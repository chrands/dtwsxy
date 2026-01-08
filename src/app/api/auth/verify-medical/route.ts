/**
 * 医护人员认证 API
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { UserService } from '@/modules/user/user.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const verifyMedicalSchema = z.object({
  hospital: z.string().min(1, '医院不能为空'),
  department: z.string().min(1, '科室不能为空'),
  title: z.string().min(1, '职称不能为空'),
  specialty: z.string().optional(),
  experience: z.number().int().min(0).optional(),
  certification: z.string().optional(),
  bio: z.string().optional(),
});

/**
 * POST /api/auth/verify-medical - 医护人员认证
 */
export async function POST(request: NextRequest) {
  try {
    // 验证登录状态
    const payload = AuthHelper.getCurrentUser(request);

    const body = await request.json();
    const validatedData = await Validator.validateBody(verifyMedicalSchema, body);

    // 执行认证
    const user = await UserService.verifyMedical(payload.userId, validatedData);

    return ResponseHelper.success(
      {
        user,
      },
      '认证信息已提交，等待审核'
    );
  } catch (error) {
    logger.error('医护人员认证失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('认证失败');
  }
}
