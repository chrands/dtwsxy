/**
 * 用户注册 API
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { UserService } from '@/modules/user/user.service';
import { AuthHelper } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const registerSchema = z.object({
  email: CommonSchemas.email,
  phone: CommonSchemas.phone.optional(),
  password: CommonSchemas.password,
  nickname: z.string().min(1, '昵称不能为空').max(50, '昵称最多50个字符'),
});

/**
 * POST /api/auth/register - 用户注册
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = await Validator.validateBody(registerSchema, body);

    // 创建用户
    const user = await UserService.createUser(validatedData);

    // 生成 Token
    const token = AuthHelper.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return ResponseHelper.success(
      {
        user,
        token,
      },
      '注册成功'
    );
  } catch (error) {
    logger.error('用户注册失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('注册失败');
  }
}