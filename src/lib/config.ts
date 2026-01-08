/**
 * 集中配置管理
 * 所有配置项必须在此文件中定义，不得分散在代码各处
 */

export const config = {
  // 应用基础配置
  app: {
    name: 'Dauteenvoice College' as const,
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5288',
    env: process.env.NODE_ENV || 'development',
  },

  // API配置
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5288/api',
    timeout: 30000 as const, // 30秒
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL,
  },

  // 分页配置
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // 文件上传配置
  upload: {
    maxFileSize: 10485760 as const, // 10MB (10 * 1024 * 1024)
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
  },

  // 业务配置
  business: {
    // 用户相关
    user: {
      passwordMinLength: 6 as const,
      nicknameMaxLength: 50 as const,
    },
    // 帖子相关
    post: {
      titleMaxLength: 200 as const,
      contentMaxLength: 50000 as const,
    },
    // 订单相关
    order: {
      orderNoPrefix: 'ORD' as const,
      paymentTimeout: 1800000 as const, // 30分钟 (30 * 60 * 1000)
    },
  },
};

// 配置验证
export function validateConfig() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0 && config.app.env === 'production') {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
}

// 启动时验证配置
if (config.app.env === 'production') {
  validateConfig();
}
