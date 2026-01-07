/*
 * Integration tests for service layer and DB behavior.
 * Requires TEST_DATABASE_URL (or set ALLOW_DB_TESTS=true to use DATABASE_URL).
 */

import { randomUUID } from 'crypto';

type TestCase = {
  name: string;
  run: () => Promise<void>;
};

const tests: TestCase[] = [];

function test(name: string, run: () => Promise<void>) {
  tests.push({ name, run });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertThrows<T>(
  fn: () => Promise<T>,
  predicate: (error: unknown) => boolean,
  message: string
) {
  let threw = false;
  try {
    await fn();
  } catch (error) {
    threw = true;
    if (!predicate(error)) {
      throw new Error(message);
    }
  }

  if (!threw) {
    throw new Error(message);
  }
}

function randomEmail(prefix: string) {
  return `${prefix}-${randomUUID()}@test.local`;
}

function randomPhone() {
  const value = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, '0');
  return `13${value}`;
}

async function main() {
  process.env.NODE_ENV = 'test';

  const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  const allowUnsafe = process.env.ALLOW_DB_TESTS === 'true';

  if (!testDbUrl) {
    console.error('Missing TEST_DATABASE_URL (or DATABASE_URL).');
    process.exit(1);
  }

  if (!process.env.TEST_DATABASE_URL && !allowUnsafe) {
    console.error('Refusing to run integration tests without TEST_DATABASE_URL.');
    console.error('Set TEST_DATABASE_URL or ALLOW_DB_TESTS=true to proceed.');
    process.exit(1);
  }

  process.env.DATABASE_URL = testDbUrl;

  const { prisma } = await import('../src/lib/prisma');
  const { UserService } = await import('../src/modules/user/user.service');
  const { PostService } = await import('../src/modules/post/post.service');
  const { OrderService } = await import('../src/modules/order/order.service');
  const { ConflictError, NotFoundError, BusinessError } = await import('../src/lib/errors');

  await prisma.order.deleteMany();
  await prisma.post.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();

  test('UserService.createUser enforces unique email', async () => {
    const email = randomEmail('user');
    const phone = randomPhone();

    await UserService.createUser({
      email,
      phone,
      password: 'Passw0rd!23',
      nickname: 'user-a',
    });

    await assertThrows(
      () =>
        UserService.createUser({
          email,
          phone: randomPhone(),
          password: 'Passw0rd!23',
          nickname: 'user-b',
        }),
      (error) => error instanceof ConflictError,
      'Expected ConflictError for duplicate email'
    );
  });

  test('UserService.updateUser enforces unique phone', async () => {
    const userA = await UserService.createUser({
      email: randomEmail('phone-a'),
      phone: randomPhone(),
      password: 'Passw0rd!23',
      nickname: 'phone-a',
    });

    const userB = await UserService.createUser({
      email: randomEmail('phone-b'),
      phone: randomPhone(),
      password: 'Passw0rd!23',
      nickname: 'phone-b',
    });

    await assertThrows(
      () => UserService.updateUser(userA.id, { phone: userB.phone || '' }),
      (error) => error instanceof ConflictError,
      'Expected ConflictError for duplicate phone'
    );
  });

  test('UserService.softDeleteUser sets INACTIVE', async () => {
    const user = await UserService.createUser({
      email: randomEmail('inactive'),
      phone: randomPhone(),
      password: 'Passw0rd!23',
      nickname: 'inactive',
    });

    await UserService.softDeleteUser(user.id);
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { status: true },
    });

    assert(record?.status === 'INACTIVE', 'Expected user status INACTIVE');
  });

  test('PostService.createPost rejects missing author', async () => {
    await assertThrows(
      () =>
        PostService.createPost({
          authorId: 'missing-author',
          title: 'missing-author',
          content: 'content',
        }),
      (error) => error instanceof NotFoundError,
      'Expected NotFoundError for missing author'
    );
  });

  test('PostService handles publish lifecycle and soft delete', async () => {
    const author = await UserService.createUser({
      email: randomEmail('post-author'),
      phone: randomPhone(),
      password: 'Passw0rd!23',
      nickname: 'post-author',
    });

    const draft = await PostService.createPost({
      authorId: author.id,
      title: 'draft',
      content: 'content',
      status: 'DRAFT',
    });

    assert(draft.publishedAt === null, 'Draft should not set publishedAt');

    const published = await PostService.createPost({
      authorId: author.id,
      title: 'published',
      content: 'content',
      status: 'PUBLISHED',
    });

    assert(!!published.publishedAt, 'Published post should set publishedAt');

    await PostService.deletePost(draft.id);

    const result = await PostService.queryPosts({
      page: 1,
      pageSize: 10,
    });

    assert(result.total === 1, 'Expected only non-deleted posts in list');
    assert(
      result.items.every((item) => item.status !== 'DELETED'),
      'Deleted posts should be excluded by default'
    );
  });

  test('OrderService enforces payment and cancel idempotency', async () => {
    const user = await UserService.createUser({
      email: randomEmail('order-user'),
      phone: randomPhone(),
      password: 'Passw0rd!23',
      nickname: 'order-user',
    });

    const order = await OrderService.createOrder({
      userId: user.id,
      productType: 'COURSE',
      productId: 'course-1',
      productName: 'Course 1',
      amount: '10.00',
    });

    const paid = await OrderService.payOrder(order.id);
    assert(paid.status === 'PAID', 'Order should be paid');

    const paidAgain = await OrderService.payOrder(order.id);
    assert(paidAgain.status === 'PAID', 'Second pay should be idempotent');

    const order2 = await OrderService.createOrder({
      userId: user.id,
      productType: 'COURSE',
      productId: 'course-2',
      productName: 'Course 2',
      amount: '20.00',
    });

    const cancelled = await OrderService.cancelOrder(order2.id);
    assert(cancelled.status === 'CANCELLED', 'Order should be cancelled');

    const cancelledAgain = await OrderService.cancelOrder(order2.id);
    assert(cancelledAgain.status === 'CANCELLED', 'Second cancel should be idempotent');

    await assertThrows(
      () => OrderService.payOrder(order2.id),
      (error) => error instanceof BusinessError,
      'Expected BusinessError when paying cancelled order'
    );
  });

  let passed = 0;
  let failed = 0;

  for (const testCase of tests) {
    try {
      await testCase.run();
      console.log(`ok - ${testCase.name}`);
      passed += 1;
    } catch (error: any) {
      console.error(`fail - ${testCase.name}`);
      console.error(error?.message || error);
      failed += 1;
    }
  }

  await prisma.$disconnect();

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed, ${passed} passed`);
    process.exit(1);
  }

  console.log(`\nAll tests passed (${passed} total)`);
}

main().catch((error) => {
  console.error('Integration tests failed to run');
  console.error(error);
  process.exit(1);
});
