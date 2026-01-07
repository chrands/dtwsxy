/**
 * 帖子模块类型定义
 */

import { Post, PostStatus } from '@prisma/client';

// 帖子创建参数
export interface CreatePostParams {
  authorId: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  status?: PostStatus;
}

// 帖子更新参数
export interface UpdatePostParams {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status?: PostStatus;
}

// 帖子查询参数
export interface QueryPostsParams {
  page: number;
  pageSize: number;
  authorId?: string;
  category?: string;
  status?: PostStatus;
  keyword?: string;
}

// 帖子详情（包含作者信息）
export interface PostDetail extends Omit<Post, 'tags'> {
  tags: string[];
  author: {
    id: string;
    nickname: string;
    avatar: string | null;
  };
}
