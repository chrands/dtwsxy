import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * 全局中间件
 * 处理请求日志、认证等
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 记录请求日志
  logger.info(`${request.method} ${pathname}`);

  // 预留：认证检查逻辑
  // 如果是API路由且需要认证，在此处理

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
