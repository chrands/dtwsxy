/**
 * 课程评论列表API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { CourseService } from '@/modules/course/course.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const courseIdSchema = z.object({
  id: z.string().min(1),
});

const queryCommentsSchema = CommonSchemas.pagination;

/**
 * GET /api/courses/[id]/comments - 获取评论列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validatedParams = await Validator.validateParams(courseIdSchema, params);

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = await Validator.validateQuery(queryCommentsSchema, queryParams);

    const result = await CourseService.getCourseComments(
      validatedParams.id,
      validatedQuery.page,
      validatedQuery.pageSize
    );

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('获取评论列表失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('获取评论列表失败');
  }
}
