/**
 * 我的观看历史API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { CourseService } from '@/modules/course/course.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * GET /api/courses/my/history - 获取我的观看历史
 */
export async function GET(request: NextRequest) {
  try {
    const payload = AuthHelper.getCurrentUser(request);

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = await Validator.validateQuery(CommonSchemas.pagination, queryParams);

    const result = await CourseService.getWatchHistory(
      payload.userId,
      validatedQuery.page ?? 1,
      validatedQuery.pageSize ?? 20
    );

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('获取观看历史失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('获取观看历史失败');
  }
}
