/**
 * 帖子API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { PostService } from '@/modules/post/post.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createPostSchema = z.object({
  authorId: z.string().min(1, '作者ID不能为空'),
  title: z.string().min(1, '标题不能为空').max(200, '标题最多200个字符'),
  content: z.string().min(1, '内容不能为空'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

const queryPostsSchema = CommonSchemas.pagination.extend({
  authorId: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED']).optional(),
  keyword: z.string().optional(),
});

/**
 * GET /api/posts - 查询帖子列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = await Validator.validateQuery(queryPostsSchema, queryParams);

    const result = await PostService.queryPosts({
      page: validatedParams.page ?? 1,
      pageSize: validatedParams.pageSize ?? 20,
      authorId: validatedParams.authorId,
      category: validatedParams.category,
      status: validatedParams.status,
      keyword: validatedParams.keyword,
    });

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('查询帖子列表失败', error);
    
    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }
    
    return ResponseHelper.serverError('查询帖子列表失败');
  }
}

/**
 * POST /api/posts - 创建帖子
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await AuthHelper.getActiveUser(request);
    const body = await request.json();

    const validatedData = await Validator.validateBody(createPostSchema, body);

    if (validatedData.authorId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      return ResponseHelper.forbidden('只能为自己创建帖子');
    }

    const post = await PostService.createPost({
      ...validatedData,
      authorId: currentUser.role === 'ADMIN' ? validatedData.authorId : currentUser.userId,
    });

    return ResponseHelper.success(post, '帖子创建成功');
  } catch (error) {
    logger.error('创建帖子失败', error);
    
    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }
    
    return ResponseHelper.serverError('创建帖子失败');
  }
}
