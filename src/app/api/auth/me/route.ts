/**
 * 获取当前用户信息 API
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { AuthHelper } from '@/lib/auth';
import { UserService } from '@/modules/user/user.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * GET /api/auth/me - 获取当前登录用户信息
 */
export async function GET(request: NextRequest) {
  try {
    // 验证并获取当前用户
    const currentUser = await AuthHelper.getActiveUser(request);

    // 获取完整用户信息
    const user = await UserService.getUserById(currentUser.userId);

    return ResponseHelper.success(user);
  } catch (error) {
    logger.error('获取当前用户信息失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode);
    }

    return ResponseHelper.serverError('获取用户信息失败');
  }
}
