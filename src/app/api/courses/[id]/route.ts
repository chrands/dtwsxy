/**
 * 课程详情API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { CourseService } from '@/modules/course/course.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// 强制动态渲染，因为使用了 request.headers
export const dynamic = 'force-dynamic';

const courseIdSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /api/courses/[id] - 获取课程详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validatedParams = await Validator.validateParams(courseIdSchema, params);

    // 尝试获取用户ID（可选，用于判断是否已点赞、收藏）
    let userId: string | undefined;
    try {
      const payload = AuthHelper.getCurrentUser(request);
      userId = payload.userId;
    } catch {
      // 未登录，继续执行
    }

    const course = await CourseService.getCourseById(validatedParams.id, userId);

    return ResponseHelper.success(course);
  } catch (error) {
    logger.error('获取课程详情失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('获取课程详情失败');
  }
}
