/**
 * 课程评论API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { CourseService } from '@/modules/course/course.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const courseIdSchema = z.object({
  id: z.string().min(1),
});

const commentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论内容最多1000个字符'),
  parentId: z.string().optional(),
});

/**
 * POST /api/courses/[id]/comment - 发表评论
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = AuthHelper.getCurrentUser(request);

    const validatedParams = await Validator.validateParams(courseIdSchema, params);
    const body = await request.json();
    const validatedData = await Validator.validateBody(commentSchema, body);

    const comment = await CourseService.createComment({
      courseId: validatedParams.id,
      userId: payload.userId,
      content: validatedData.content,
      parentId: validatedData.parentId,
    });

    return ResponseHelper.success(comment, '评论发表成功');
  } catch (error) {
    logger.error('发表评论失败', error);

    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }

    return ResponseHelper.serverError('发表评论失败');
  }
}
