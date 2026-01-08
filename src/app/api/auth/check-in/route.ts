/**
 * 每日签到 API
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
 * POST /api/auth/check-in - 每日签到
 */
export async function POST(request: NextRequest) {
  try {
    // 验证登录状态
    const payload = AuthHelper.getCurrentUser(request);

    // 执行签到
    const checkIn = await PointsService.checkIn({
      userId: payload.userId,
    });

    return ResponseHelper.success(
      {
        checkIn,
      },
      `签到成功，获得${checkIn.points}积分（连续${checkIn.consecutiveDays}天）`
    );
  } catch (error) {
    logger.error('签到失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('签到失败');
  }
}
