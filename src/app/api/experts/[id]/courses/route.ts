/**
 * 专家的课程API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { ExpertService } from '@/modules/expert/expert.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const expertIdSchema = z.object({
  id: z.string().min(1),
});

const queryCoursesSchema = CommonSchemas.pagination;

/**
 * GET /api/experts/[id]/courses - 获取专家的课程
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validatedParams = await Validator.validateParams(expertIdSchema, params);

    // 获取专家信息
    const expert = await prisma.expert.findUnique({
      where: { id: validatedParams.id },
      include: {
        doctor: true,
      },
    });

    if (!expert) {
      return ResponseHelper.error('专家不存在', 'NOT_FOUND', 404);
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = await Validator.validateQuery(queryCoursesSchema, queryParams);

    const result = await ExpertService.getExpertCourses(
      expert.doctorId,
      validatedQuery.page,
      validatedQuery.pageSize
    );

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('获取专家课程失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('获取专家课程失败');
  }
}
