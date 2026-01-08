/**
 * 记录观看进度API路由
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

const watchSchema = z.object({
  videoId: z.string().optional(),
  watchTime: z.number().int().min(0),
  progress: z.number().min(0).max(1),
});

/**
 * POST /api/courses/[id]/watch - 记录观看进度
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = AuthHelper.getCurrentUser(request);

    const validatedParams = await Validator.validateParams(courseIdSchema, params);
    const body = await request.json();
    const validatedData = await Validator.validateBody(watchSchema, body);

    const result = await CourseService.recordWatchProgress({
      courseId: validatedParams.id,
      userId: payload.userId,
      videoId: validatedData.videoId,
      watchTime: validatedData.watchTime,
      progress: validatedData.progress,
    });

    return ResponseHelper.success(result, '观看进度已记录');
  } catch (error) {
    logger.error('记录观看进度失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('记录观看进度失败');
  }
}
