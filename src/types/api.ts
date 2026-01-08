/**
 * API相关类型定义
 */

import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';

// API处理器类型
export type ApiHandler = (req: NextRequest, context?: RequestContext) => Promise<Response>;

// 请求上下文
export interface RequestContext {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  params?: Record<string, string>;
}
