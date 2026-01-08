/**
 * 课程点赞API路由
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
 * POST /api/courses/[id]/like - 点赞/取消点赞
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = AuthHelper.getCurrentUser(request);

    const validatedParams = await Validator.validateParams(courseIdSchema, params);

    const result = await CourseService.toggleLike(validatedParams.id, payload.userId);

    return ResponseHelper.success(result, result.isLiked ? '点赞成功' : '已取消点赞');
  } catch (error) {
    logger.error('点赞操作失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('点赞操作失败');
  }
}
