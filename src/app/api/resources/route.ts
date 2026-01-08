/**
 * 资源API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { ResourceService } from '@/modules/resource/resource.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { ResourceType } from '@prisma/client';

const queryResourcesSchema = CommonSchemas.pagination.extend({
  type: z.nativeEnum(ResourceType).optional(),
  category: z.string().optional(),
  keyword: z.string().optional(),
});

/**
 * GET /api/resources - 查询资源列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = await Validator.validateQuery(queryResourcesSchema, queryParams);

    const result = await ResourceService.queryResources({
      page: validatedParams.page ?? 1,
      pageSize: validatedParams.pageSize ?? 20,
      type: validatedParams.type,
      category: validatedParams.category,
      keyword: validatedParams.keyword,
    });

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('查询资源列表失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('查询资源列表失败');
  }
}
