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
import { UserType } from '@prisma/client';

// 强制动态渲染，因为需要访问数据库和生成 token
export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  email: CommonSchemas.email.optional(),
  phone: CommonSchemas.phone.optional(),
  password: CommonSchemas.password,
  nickname: z.string().min(1, '昵称不能为空').max(50, '昵称最多50个字符'),
  userType: z.nativeEnum(UserType).default(UserType.NON_MEDICAL),
  // 医护人员专属字段
  hospital: z.string().min(1, '医院不能为空').optional(),
  department: z.string().min(1, '科室不能为空').optional(),
  title: z.string().min(1, '职称不能为空').optional(),
  specialty: z.string().optional(),
  experience: z.number().int().min(0).optional(),
  certification: z.string().optional(),
  bio: z.string().optional(),
}).refine((data) => {
  // 必须提供邮箱或手机号至少一个
  return data.email || data.phone;
}, {
  message: '必须提供邮箱或手机号',
  path: ['email'],
}).refine((data) => {
  // 医护人员必须填写医院、科室、职称
  if (data.userType === UserType.MEDICAL_STAFF) {
    return data.hospital && data.department && data.title;
  }
  return true;
}, {
  message: '医护人员注册必须填写医院、科室和职称',
  path: ['hospital'],
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
      email: user.email || '',
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
