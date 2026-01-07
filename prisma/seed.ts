import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始数据库种子数据初始化...');
  
  // 这里预留种子数据逻辑
  // 生产环境不应运行此文件
  
  console.log('数据库种子数据初始化完成');
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
