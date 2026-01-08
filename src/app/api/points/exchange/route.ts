/**
 * 积分兑换 API
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { PointsService } from '@/modules/points/points.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// 强制动态渲染，因为使用了 request.headers
export const dynamic = 'force-dynamic';

const exchangeSchema = z.object({
  points: z.number().int().positive('积分必须大于0'),
  type: z.string().min(1, '兑换类型不能为空'),
  relatedId: z.string().min(1, '关联ID不能为空'),
  description: z.string().optional(),
});

/**
 * POST /api/points/exchange - 积分兑换
 */
export async function POST(request: NextRequest) {
  try {
    const payload = AuthHelper.getCurrentUser(request);

    const body = await request.json();
    const validatedData = await Validator.validateBody(exchangeSchema, body);

    const result = await PointsService.exchangePoints({
      ...validatedData,
      userId: payload.userId,
    });

    return ResponseHelper.success(result, '兑换成功');
  } catch (error) {
    logger.error('积分兑换失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('积分兑换失败');
  }
}
