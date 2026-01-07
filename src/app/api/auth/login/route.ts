/**
 * 用户登录 API
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppError, UnauthorizedError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: CommonSchemas.email,
  password: z.string().min(1, '密码不能为空'),
});

/**
 * POST /api/auth/login - 用户登录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = await Validator.validateBody(loginSchema, body);

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // 检查账户状态
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('账户已被禁用');
    }

    // 生成 Token
    const token = AuthHelper.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 返回用户信息（不含密码）
    const { password, ...userWithoutPassword } = user;

    return ResponseHelper.success(
      {
        user: userWithoutPassword,
        token,
      },
      '登录成功'
    );
  } catch (error) {
    logger.error('用户登录失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode);
    }

    return ResponseHelper.serverError('登录失败');
  }
}