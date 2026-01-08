/**
 * 直播详情API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { LiveService } from '@/modules/live/live.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// 强制动态渲染，因为使用了 request.headers
export const dynamic = 'force-dynamic';

const liveIdSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /api/lives/[id] - 获取直播详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validatedParams = await Validator.validateParams(liveIdSchema, params);

    // 尝试获取用户ID（可选）
    let userId: string | undefined;
    try {
      const payload = AuthHelper.getCurrentUser(request);
      userId = payload.userId;
    } catch {
      // 未登录，继续执行
    }

    const live = await LiveService.getLiveById(validatedParams.id, userId);

    return ResponseHelper.success(live);
  } catch (error) {
    logger.error('获取直播详情失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('获取直播详情失败');
  }
}
