/**
 * 专家详情API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator } from '@/lib/validator';
import { ExpertService } from '@/modules/expert/expert.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const expertIdSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /api/experts/[id] - 获取专家详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validatedParams = await Validator.validateParams(expertIdSchema, params);

    const expert = await ExpertService.getExpertById(validatedParams.id);

    return ResponseHelper.success(expert);
  } catch (error) {
    logger.error('获取专家详情失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('获取专家详情失败');
  }
}
