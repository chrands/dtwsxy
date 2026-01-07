# Dauteenvoice College - 医生内容平台

专业的医生内容平台，提供论坛、课程和付费功能。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: MySQL
- **ORM**: Prisma
- **验证**: Zod
- **架构**: Monorepo全栈架构

## 项目结构
```
dauteenvoice-college/
├── prisma/                 # 数据库相关
│   ├── schema.prisma       # 数据库模型定义
│   └── seed.ts             # 种子数据
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API路由（仅参数验证，调用Service层）
│   │   ├── layout.tsx      # 全局布局
│   │   ├── page.tsx        # 首页
│   │   └── globals.css     # 全局样式
│   ├── modules/            # 业务模块（所有业务逻辑必须在此）
│   │   ├── user/           # 用户模块
│   │   ├── doctor/         # 医生模块
│   │   ├── post/           # 帖子模块
│   │   └── order/          # 订单模块
│   ├── lib/                # 核心库（稳定基础设施）
│   │   ├── prisma.ts       # 数据库连接
│   │   ├── response.ts     # 统一响应格式
│   │   ├── validator.ts    # 参数验证
│   │   ├── config.ts       # 集中配置
│   │   ├── errors.ts       # 错误处理
│   │   └── logger.ts       # 日志管理
│   ├── types/              # TypeScript类型定义
│   ├── components/         # React组件
│   └── middleware.ts       # 全局中间件
├── .env.example            # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.example` 到 `.env` 并填写必要的配置：
```bash
cp .env.example .env
```

**重要配置项：**
- `DATABASE_URL`: MySQL数据库连接字符串
- `JWT_SECRET`: JWT密钥（生产环境必须更换）

### 3. 初始化数据库
```bash
# 生成Prisma客户端
npm run prisma:generate

# 推送数据库模式
npm run db:push

# 或者使用迁移（推荐生产环境）
npm run prisma:migrate
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:5288

## 核心设计原则

### 1. 分层架构

- **API层** (`src/app/api/*`): 仅负责参数验证，调用Service层
- **Service层** (`src/modules/*/**.service.ts`): 所有业务逻辑必须在此实现
- **数据层** (Prisma): 通过Service层调用，不直接在API中使用

### 2. 统一响应格式
所有API必须使用 `ResponseHelper` 返回统一格式：
```typescript
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "meta": {  // 分页时包含
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 3. 集中配置管理
所有配置必须在 `src/lib/config.ts` 中定义，禁止分散在代码各处。

### 4. 业务逻辑隔离

- 所有业务逻辑必须在 `src/modules/` 目录下
- API路由不得包含业务逻辑
- Service层可以互相调用，但要避免循环依赖

### 5. 错误处理
使用统一的错误类：

- `ValidationError`: 参数验证错误
- `UnauthorizedError`: 未授权
- `NotFoundError`: 资源不存在
- `ConflictError`: 资源冲突
- `BusinessError`: 业务错误

## 稳定基础文件（不可随意修改）

以下文件是项目的稳定基础，除非有重大架构变更，否则不应修改：

- `src/lib/prisma.ts` - 数据库连接
- `src/lib/response.ts` - 统一响应格式
- `src/lib/validator.ts` - 参数验证
- `src/lib/config.ts` - 配置管理
- `src/lib/errors.ts` - 错误处理
- `src/lib/logger.ts` - 日志管理
- `src/middleware.ts` - 全局中间件
- `prisma/schema.prisma` - 数据库模型（可扩展，不可随意修改现有模型）

## 开发指南

### 添加新的业务模块

1. 在 `src/modules/` 下创建新目录
2. 创建 `*.types.ts` 定义类型
3. 创建 `*.service.ts` 实现业务逻辑
4. 在 `src/app/api/` 下创建对应的API路由
5. API路由仅做参数验证，调用Service层

### 数据库变更
```bash
# 修改 prisma/schema.prisma 后执行
npm run db:push

# 或创建迁移（推荐）
npx prisma migrate dev --name your_migration_name
```

### 查看数据库
```bash
npm run prisma:studio
```

## 生产部署

### 1. 环境变量
确保生产环境配置了正确的环境变量：

- `DATABASE_URL`: 生产数据库
- `JWT_SECRET`: 强随机密钥
- `NODE_ENV=production`

### 2. 构建
```bash
npm run build
```

### 3. 启动
```bash
npm run start
```

## 待实现功能

以下功能预留在对应模块中实现：

- ✅ 用户认证与授权 (`src/modules/user/`)
- ✅ 医生认证流程 (`src/modules/doctor/`)
- ✅ 帖子评论功能 (`src/modules/post/`)
- ✅ 订单支付集成 (`src/modules/order/`)
- ⏳ 课程管理模块 (新建 `src/modules/course/`)
- ⏳ 咨询功能模块 (新建 `src/modules/consultation/`)

## 技术支持

如有问题，请查看：

- [Next.js文档](https://nextjs.org/docs)
- [Prisma文档](https://www.prisma.io/docs)
- [TypeScript文档](https://www.typescriptlang.org/docs)

## 许可证

Private - All Rights Reserved
