/**
 * 记录直播观看API路由
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

const watchSchema = z.object({
  watchTime: z.number().int().min(0),
});

/**
 * POST /api/lives/[id]/watch - 记录观看
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = AuthHelper.getCurrentUser(request);

    const validatedParams = await Validator.validateParams(liveIdSchema, params);
    const body = await request.json();
    const validatedData = await Validator.validateBody(watchSchema, body);

    const result = await LiveService.recordWatch({
      liveId: validatedParams.id,
      userId: payload.userId,
      watchTime: validatedData.watchTime,
    });

    return ResponseHelper.success(result, '观看记录已保存');
  } catch (error) {
    logger.error('记录观看失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('记录观看失败');
  }
}
