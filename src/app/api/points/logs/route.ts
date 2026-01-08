/**
 * 积分流水 API
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { PointsService } from '@/modules/points/points.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { PointsType } from '@prisma/client';

const queryLogsSchema = CommonSchemas.pagination.extend({
  type: z.nativeEnum(PointsType).optional(),
});

/**
 * GET /api/points/logs - 查询积分流水
 */
export async function GET(request: NextRequest) {
  try {
    const payload = AuthHelper.getCurrentUser(request);

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = await Validator.validateQuery(queryLogsSchema, queryParams);

    const result = await PointsService.queryPointsLogs({
      ...validatedParams,
      userId: payload.userId,
    });

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('查询积分流水失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('查询积分流水失败');
  }
}
