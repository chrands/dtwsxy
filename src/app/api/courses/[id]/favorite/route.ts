/**
 * 课程收藏API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { CourseService } from '@/modules/course/course.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const courseIdSchema = z.object({
  id: z.string().min(1),
});

/**
 * POST /api/courses/[id]/favorite - 收藏/取消收藏
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = AuthHelper.getCurrentUser(request);

    const validatedParams = await Validator.validateParams(courseIdSchema, params);

    const result = await CourseService.toggleFavorite(validatedParams.id, payload.userId);

    return ResponseHelper.success(result, result.isFavorited ? '收藏成功' : '已取消收藏');
  } catch (error) {
    logger.error('收藏操作失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('收藏操作失败');
  }
}
