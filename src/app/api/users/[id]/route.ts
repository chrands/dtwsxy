/**
 * 用户详情API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { UserService } from '@/modules/user/user.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const updateUserSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  avatar: z.string().url('头像必须是有效的URL').optional(),
  phone: CommonSchemas.phone.optional(),
});

/**
 * GET /api/users/[id] - 获取用户详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const currentUser = await AuthHelper.getActiveUser(request);
    if (currentUser.userId !== id && currentUser.role !== 'ADMIN') {
      return ResponseHelper.forbidden('无权访问该用户');
    }

    const user = await UserService.getUserById(id);

    return ResponseHelper.success(user);
  } catch (error) {
    logger.error('获取用户详情失败', error);
    
    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode);
    }
    
    return ResponseHelper.serverError('获取用户详情失败');
  }
}

/**
 * PATCH /api/users/[id] - 更新用户信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const currentUser = await AuthHelper.getActiveUser(request);

    if (currentUser.userId !== id && currentUser.role !== 'ADMIN') {
      return ResponseHelper.forbidden('无权更新该用户');
    }

    const body = await request.json();

    const validatedData = await Validator.validateBody(updateUserSchema, body);

    const user = await UserService.updateUser(id, validatedData);

    return ResponseHelper.success(user, '用户信息更新成功');
  } catch (error) {
    logger.error('更新用户信息失败', error);
    
    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }
    
    return ResponseHelper.serverError('更新用户信息失败');
  }
}

/**
 * DELETE /api/users/[id] - 删除用户
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const currentUser = await AuthHelper.getActiveUser(request);
    if (currentUser.userId !== id && currentUser.role !== 'ADMIN') {
      return ResponseHelper.forbidden('无权删除该用户');
    }

    await UserService.softDeleteUser(id);

    return ResponseHelper.success(null, '用户已禁用');
  } catch (error) {
    logger.error('删除用户失败', error);
    
    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode);
    }
    
    return ResponseHelper.serverError('删除用户失败');
  }
}
