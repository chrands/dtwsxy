/**
 * 直播API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { LiveService } from '@/modules/live/live.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { LiveStatus } from '@prisma/client';

const queryLivesSchema = CommonSchemas.pagination.extend({
  status: z.nativeEnum(LiveStatus).optional(),
  keyword: z.string().optional(),
});

/**
 * GET /api/lives - 查询直播列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = await Validator.validateQuery(queryLivesSchema, queryParams);

    const result = await LiveService.queryLives({
      page: validatedParams.page ?? 1,
      pageSize: validatedParams.pageSize ?? 20,
      status: validatedParams.status,
      keyword: validatedParams.keyword,
    });

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('查询直播列表失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('查询直播列表失败');
  }
}
