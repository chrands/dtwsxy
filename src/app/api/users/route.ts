/**
 * 用户API路由（需要认证）
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { UserService } from '@/modules/user/user.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// 强制动态渲染，因为使用了 request.headers 和 request.url
export const dynamic = 'force-dynamic';

const queryUsersSchema = CommonSchemas.pagination.extend({
  role: z.enum(['USER', 'DOCTOR', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).optional(),
  keyword: z.string().optional(),
});

/**
 * GET /api/users - 查询用户列表（需要管理员权限）
 */
export async function GET(request: NextRequest) {
  try {
    // 认证检查
    const currentUser = await AuthHelper.getActiveUser(request);
    
    // 权限检查：只有管理员可以查询用户列表
    AuthHelper.requireRole(currentUser.role, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = await Validator.validateQuery(queryUsersSchema, queryParams);

    const result = await UserService.queryUsers({
      page: validatedParams.page ?? 1,
      pageSize: validatedParams.pageSize ?? 20,
      role: validatedParams.role,
      status: validatedParams.status,
      keyword: validatedParams.keyword,
    });

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('查询用户列表失败', error);
    
    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }
    
    return ResponseHelper.serverError('查询用户列表失败');
  }
}
