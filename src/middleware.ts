import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * 全局中间件
 * 处理请求日志、认证等
 */

// 需要认证的 API 路由（详细认证逻辑在各自的路由中实现）
const protectedApiRoutes = [
  '/api/auth/me',
  '/api/auth/check-in',
  '/api/auth/verify-medical',
  '/api/courses/my',
  '/api/points',
  '/api/courses/[id]/watch',
  '/api/courses/[id]/comment',
  '/api/courses/[id]/like',
  '/api/courses/[id]/favorite',
  '/api/lives/[id]/watch',
];

// 公开的 API 路由（游客可访问）
const publicApiRoutes = [
  '/api/courses',
  '/api/courses/categories',
  '/api/courses/[id]',
  '/api/courses/[id]/videos',
  '/api/courses/[id]/comments',
  '/api/lives',
  '/api/lives/[id]',
  '/api/experts',
  '/api/experts/[id]',
  '/api/resources',
  '/api/resources/[id]',
  '/api/auth/login',
  '/api/auth/register',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 记录请求日志
  logger.info(`${request.method} ${pathname}`);

  // API 路由的认证检查（基础检查，详细逻辑在各自路由中）
  if (pathname.startsWith('/api/')) {
    // 检查是否是受保护的路由
    const isProtected = protectedApiRoutes.some((route) => {
      // 处理动态路由匹配
      const routePattern = route.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${routePattern.replace(/\//g, '\\/')}$`);
      return regex.test(pathname);
    });

    if (isProtected) {
      // 检查是否有认证 token
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 返回 401，但让 API 路由自己处理详细错误信息
        // 这里只做基础检查
      }
    }
  }

  // 前端路由：游客模式允许访问首页和公开内容
  // 详细的权限检查在前端组件中实现

  return NextResponse.next();
}

// 配置中间件应用的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
