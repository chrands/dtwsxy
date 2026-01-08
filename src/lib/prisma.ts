import { PrismaClient } from '@prisma/client';
import { config } from './config';

/**
 * Prisma客户端单例
 * 确保在开发环境下热重载不会创建多个数据库连接
 */

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.app.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (config.app.env !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
