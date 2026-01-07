/*
 * E2E tests against the running Next.js server.
 * Requires TEST_BASE_URL (default http://localhost:5288).
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5288';

const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function randomEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@test.local`;
}

function randomPhone() {
  const value = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, '0');
  return `13${value}`;
}

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  return { response, data };
}

async function main() {
  let userA = null;
  let userB = null;

  test('Register user A', async () => {
    const payload = {
      email: randomEmail('e2e-a'),
      phone: randomPhone(),
      password: 'Passw0rd!23',
      nickname: 'e2e-a',
    };

    const { response, data } = await request('POST', '/api/auth/register', payload);
    assert(response.status === 200, 'Expected 200 on register');
    assert(data?.success, 'Expected success on register');
    assert(data?.data?.token, 'Expected token on register');

    userA = data.data.user;
    userA.token = data.data.token;
  });

  test('Register user B', async () => {
    const payload = {
      email: randomEmail('e2e-b'),
      phone: randomPhone(),
      password: 'Passw0rd!23',
      nickname: 'e2e-b',
    };

    const { response, data } = await request('POST', '/api/auth/register', payload);
    assert(response.status === 200, 'Expected 200 on register');
    assert(data?.success, 'Expected success on register');
    assert(data?.data?.token, 'Expected token on register');

    userB = data.data.user;
    userB.token = data.data.token;
  });

  test('Auth me returns current user', async () => {
    const { response, data } = await request('GET', '/api/auth/me', null, userA.token);
    assert(response.status === 200, 'Expected 200 on auth me');
    assert(data?.success, 'Expected success on auth me');
    assert(data?.data?.id === userA.id, 'Expected matching user');
  });

  test('Admin-only users list returns unauthorized for non-admin', async () => {
    const { response, data } = await request('GET', '/api/users', null, userA.token);
    assert(response.status === 401, 'Expected 401 for non-admin list');
    assert(data?.error?.code === 'UNAUTHORIZED', 'Expected UNAUTHORIZED error');
  });

  test('User cannot access other user detail', async () => {
    const { response, data } = await request('GET', `/api/users/${userB.id}`, null, userA.token);
    assert(response.status === 403, 'Expected 403 when accessing other user');
    assert(data?.error?.code === 'FORBIDDEN', 'Expected FORBIDDEN error');
  });

  test('User can access own detail', async () => {
    const { response, data } = await request('GET', `/api/users/${userA.id}`, null, userA.token);
    assert(response.status === 200, 'Expected 200 when accessing own user');
    assert(data?.data?.id === userA.id, 'Expected matching user');
  });

  test('User can update own profile', async () => {
    const { response, data } = await request(
      'PATCH',
      `/api/users/${userA.id}`,
      { nickname: 'e2e-a-updated' },
      userA.token
    );
    assert(response.status === 200, 'Expected 200 on update');
    assert(data?.data?.nickname === 'e2e-a-updated', 'Expected updated nickname');
  });

  test('Post creation forbids mismatched author', async () => {
    const { response, data } = await request(
      'POST',
      '/api/posts',
      {
        authorId: userB.id,
        title: 'forbidden-post',
        content: 'content',
      },
      userA.token
    );

    assert(response.status === 403, 'Expected 403 for mismatched author');
    assert(data?.error?.code === 'FORBIDDEN', 'Expected FORBIDDEN error');
  });

  test('Post creation succeeds for owner', async () => {
    const { response, data } = await request(
      'POST',
      '/api/posts',
      {
        authorId: userA.id,
        title: 'allowed-post',
        content: 'content',
      },
      userA.token
    );

    assert(response.status === 200, 'Expected 200 on post create');
    assert(data?.success, 'Expected success on post create');
    userA.postId = data.data.id;
  });

  test('Post list includes created post', async () => {
    const { response, data } = await request('GET', '/api/posts?page=1&pageSize=10', null, userA.token);
    assert(response.status === 200, 'Expected 200 on post list');
    const items = data?.data || [];
    assert(items.some((item) => item.id === userA.postId), 'Expected created post in list');
  });

  test('Doctor creation forbids mismatched user', async () => {
    const { response, data } = await request(
      'POST',
      '/api/doctors',
      {
        userId: userB.id,
        title: 'dr',
        hospital: 'hospital',
        department: 'dept',
        specialty: 'spec',
        experience: 1,
      },
      userA.token
    );

    assert(response.status === 403, 'Expected 403 for mismatched doctor user');
    assert(data?.error?.code === 'FORBIDDEN', 'Expected FORBIDDEN error');
  });

  test('Doctor creation succeeds for owner', async () => {
    const { response, data } = await request(
      'POST',
      '/api/doctors',
      {
        userId: userA.id,
        title: 'dr',
        hospital: 'hospital',
        department: 'dept',
        specialty: 'spec',
        experience: 1,
      },
      userA.token
    );

    assert(response.status === 200, 'Expected 200 on doctor create');
    assert(data?.success, 'Expected success on doctor create');
  });

  test('Order creation forbids mismatched user', async () => {
    const { response, data } = await request(
      'POST',
      '/api/orders',
      {
        userId: userB.id,
        productType: 'COURSE',
        productId: 'course-1',
        productName: 'Course 1',
        amount: '10.00',
      },
      userA.token
    );

    assert(response.status === 403, 'Expected 403 for mismatched order user');
    assert(data?.error?.code === 'FORBIDDEN', 'Expected FORBIDDEN error');
  });

  test('Order creation succeeds for owner', async () => {
    const { response, data } = await request(
      'POST',
      '/api/orders',
      {
        userId: userA.id,
        productType: 'COURSE',
        productId: 'course-1',
        productName: 'Course 1',
        amount: '10.00',
      },
      userA.token
    );

    assert(response.status === 200, 'Expected 200 on order create');
    assert(data?.success, 'Expected success on order create');
    userA.orderId = data.data.id;
  });

  test('Order list only returns own orders', async () => {
    const { response, data } = await request('GET', '/api/orders?page=1&pageSize=10', null, userA.token);
    assert(response.status === 200, 'Expected 200 on order list');
    const items = data?.data || [];
    assert(items.length > 0, 'Expected at least one order');
    assert(items.every((item) => item.user?.id === userA.id), 'Expected only own orders');
  });

  test('User delete disables account and token', async () => {
    const { response, data } = await request('DELETE', `/api/users/${userA.id}`, null, userA.token);
    assert(response.status === 200, 'Expected 200 on delete');
    assert(data?.success, 'Expected success on delete');

    const check = await request('GET', '/api/auth/me', null, userA.token);
    assert(check.response.status === 401, 'Expected 401 after disabling account');
  });

  let passed = 0;
  let failed = 0;

  for (const testCase of tests) {
    try {
      await testCase.run();
      console.log(`ok - ${testCase.name}`);
      passed += 1;
    } catch (error) {
      console.error(`fail - ${testCase.name}`);
      console.error(error?.message || error);
      failed += 1;
      break;
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed, ${passed} passed`);
    process.exit(1);
  }

  console.log(`\nAll tests passed (${passed} total)`);
}

main().catch((error) => {
  console.error('E2E tests failed to run');
  console.error(error);
  process.exit(1);
});
