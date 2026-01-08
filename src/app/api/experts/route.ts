/**
 * 专家API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { ExpertService } from '@/modules/expert/expert.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const queryExpertsSchema = CommonSchemas.pagination.extend({
  isFeatured: z.boolean().optional(),
  keyword: z.string().optional(),
});

/**
 * GET /api/experts - 查询专家列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = await Validator.validateQuery(queryExpertsSchema, queryParams);

    const result = await ExpertService.queryExperts({
      page: validatedParams.page ?? 1,
      pageSize: validatedParams.pageSize ?? 20,
      isFeatured: validatedParams.isFeatured,
      keyword: validatedParams.keyword,
    });

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('查询专家列表失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('查询专家列表失败');
  }
}
