/**
 * 帖子服务层
 * 所有帖子相关的业务逻辑必须在此实现
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import type { CreatePostParams, UpdatePostParams, QueryPostsParams, PostDetail } from './post.types';
import type { PaginatedResult } from '@/types';

export class PostService {
  /**
   * 创建帖子
   */
  static async createPost(params: CreatePostParams): Promise<PostDetail> {
    const { tags, status = 'DRAFT', ...rest } = params;

    // 验证作者是否存在
    const author = await prisma.user.findUnique({
      where: { id: params.authorId },
    });

    if (!author) {
      throw new NotFoundError('作者不存在');
    }

    // 确定发布时间：只有状态为 PUBLISHED 时才设置发布时间
    const publishedAt = status === 'PUBLISHED' ? new Date() : null;

    try {
      const post = await prisma.post.create({
        data: {
          ...rest,
          status, // 显式设置状态
          tags: tags ? JSON.stringify(tags) : null,
          publishedAt,
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      });

      return {
        ...post,
        tags: post.tags ? JSON.parse(post.tags) : [],
      };
    } catch (error: any) {
      // 捕获 Prisma 外键约束错误并转换为 NotFoundError
      if (error?.code === 'P2003') {
        const fieldName = error.meta?.field_name || '';
        if (fieldName.includes('authorId') || fieldName.includes('author')) {
          throw new NotFoundError('作者不存在');
        }
      }
      throw error;
    }
  }

  /**
   * 根据ID获取帖子
   */
  static async getPostById(id: string): Promise<PostDetail> {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundError('帖子不存在');
    }

    return {
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
    };
  }

  /**
   * 更新帖子
   */
  static async updatePost(id: string, params: UpdatePostParams): Promise<PostDetail> {
    const existingPost = await this.getPostById(id);

    const { tags, status, ...rest } = params;
    const updateData: any = { ...rest };

    if (tags) {
      updateData.tags = JSON.stringify(tags);
    }

    // 状态变更逻辑
    if (status) {
      updateData.status = status;
      
      // 从草稿发布时，设置发布时间
      if (status === 'PUBLISHED' && existingPost.status === 'DRAFT' && !existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return {
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
    };
  }

  /**
   * 查询帖子列表（分页）
   */
  static async queryPosts(params: QueryPostsParams): Promise<PaginatedResult<PostDetail>> {
    const { page, pageSize, authorId, category, status, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (authorId) {
      where.authorId = authorId;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'DELETED' };
    }
    
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    const total = await prisma.post.count({ where });

    const posts = await prisma.post.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    const items = posts.map((post: typeof posts[0]) => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
    }));

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 软删除帖子（使用 DELETED 状态）
   */
  static async deletePost(id: string): Promise<void> {
    await this.getPostById(id);
    
    // 使用软删除而非硬删除
    await prisma.post.update({
      where: { id },
      data: {
        status: 'DELETED',
      },
    });
  }

  /**
   * 永久删除帖子（仅管理员）
   */
  static async permanentlyDeletePost(id: string): Promise<void> {
    await this.getPostById(id);
    await prisma.post.delete({ where: { id } });
  }

  /**
   * 增加浏览量
   */
  static async incrementViewCount(id: string): Promise<void> {
    await prisma.post.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }
}
