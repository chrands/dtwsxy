/**
 * 课程视频列表API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator } from '@/lib/validator';
import { CourseService } from '@/modules/course/course.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const courseIdSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /api/courses/[id]/videos - 获取课程视频列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validatedParams = await Validator.validateParams(courseIdSchema, params);

    const videos = await CourseService.getCourseVideos(validatedParams.id);

    return ResponseHelper.success(videos);
  } catch (error) {
    logger.error('获取课程视频列表失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('获取课程视频列表失败');
  }
}
