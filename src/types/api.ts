/**
 * API相关类型定义
 */

import { NextRequest } from 'next/server';

// API处理器类型
export type ApiHandler = (req: NextRequest, context?: any) => Promise<Response>;

// 请求上下文
export interface RequestContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  params?: Record<string, string>;
}
