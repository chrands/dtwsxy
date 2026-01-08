/**
 * 资源详情API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator } from '@/lib/validator';
import { ResourceService } from '@/modules/resource/resource.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const resourceIdSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /api/resources/[id] - 获取资源详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validatedParams = await Validator.validateParams(resourceIdSchema, params);

    const resource = await ResourceService.getResourceById(validatedParams.id);

    return ResponseHelper.success(resource);
  } catch (error) {
    logger.error('获取资源详情失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('获取资源详情失败');
  }
}
