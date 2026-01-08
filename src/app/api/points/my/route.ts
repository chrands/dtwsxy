/**
 * 我的积分 API
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { AuthHelper } from '@/lib/auth';
import { PointsService } from '@/modules/points/points.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// 强制动态渲染，因为使用了 request.headers
export const dynamic = 'force-dynamic';

/**
 * GET /api/points/my - 获取我的积分
 */
export async function GET(request: NextRequest) {
  try {
    const payload = AuthHelper.getCurrentUser(request);

    const userPoints = await PointsService.getUserPoints(payload.userId);

    return ResponseHelper.success(userPoints);
  } catch (error) {
    logger.error('获取积分失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('获取积分失败');
  }
}
