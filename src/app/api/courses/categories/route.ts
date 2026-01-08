/**
 * 课程分类API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * GET /api/courses/categories - 获取分类列表
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null, // 只获取顶级分类（七大术式）
      },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return ResponseHelper.success(categories);
  } catch (error) {
    logger.error('获取分类列表失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('获取分类列表失败');
  }
}
