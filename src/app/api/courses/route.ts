/**
 * 课程API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { CourseService } from '@/modules/course/course.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { CourseStatus } from '@prisma/client';

// 强制动态渲染，因为使用了 request.url
export const dynamic = 'force-dynamic';

const queryCoursesSchema = CommonSchemas.pagination.extend({
  categoryId: z.string().optional(),
  department: z.string().optional(),
  authorId: z.string().optional(),
  status: z.nativeEnum(CourseStatus).optional(),
  isFree: z.boolean().optional(),
  keyword: z.string().optional(),
  sortBy: z.enum(['latest', 'popular', 'price']).optional(),
});

/**
 * GET /api/courses - 查询课程列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = await Validator.validateQuery(queryCoursesSchema, queryParams);

    const result = await CourseService.queryCourses({
      page: validatedParams.page ?? 1,
      pageSize: validatedParams.pageSize ?? 20,
      categoryId: validatedParams.categoryId,
      department: validatedParams.department,
      authorId: validatedParams.authorId,
      status: validatedParams.status,
      isFree: validatedParams.isFree,
      keyword: validatedParams.keyword,
      sortBy: validatedParams.sortBy,
    });

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('查询课程列表失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('查询课程列表失败');
  }
}
