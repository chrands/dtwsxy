/**
 * 课程模块类型定义
 */

import { Course, CourseStatus, CourseVideo, CourseComment, Category } from '@prisma/client';

// 课程创建参数
export interface CreateCourseParams {
  title: string;
  description?: string;
  cover?: string;
  categoryId: string;
  authorId: string;
  price?: number;
  originalPrice?: number;
  isFree?: boolean;
  isVip?: boolean;
}

// 课程更新参数
export interface UpdateCourseParams {
  title?: string;
  description?: string;
  cover?: string;
  categoryId?: string;
  price?: number;
  originalPrice?: number;
  isFree?: boolean;
  isVip?: boolean;
  status?: CourseStatus;
}

// 课程查询参数
export interface QueryCoursesParams {
  page: number;
  pageSize: number;
  categoryId?: string;
  department?: string; // 科室筛选
  authorId?: string;
  status?: CourseStatus;
  isFree?: boolean;
  keyword?: string;
  sortBy?: 'latest' | 'popular' | 'price'; // 排序方式
}

// 视频创建参数
export interface CreateVideoParams {
  courseId: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  sortOrder?: number;
}

// 评论创建参数
export interface CreateCommentParams {
  courseId: string;
  userId: string;
  content: string;
  parentId?: string;
}

// 课程详情（包含关联数据）
export interface CourseDetail extends Course {
  category: Category;
  author: {
    id: string;
    nickname: string;
    avatar: string | null;
    doctorProfile?: {
      hospital: string;
      department: string;
      title: string;
    } | null;
  };
  videos?: CourseVideo[];
  isLiked?: boolean;
  isFavorited?: boolean;
  watchProgress?: number; // 观看进度（0-1）
}

// 课程列表项
export interface CourseListItem extends Course {
  category: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    nickname: string;
    avatar: string | null;
  };
  isLiked?: boolean;
  isFavorited?: boolean;
}

// 观看进度记录参数
export interface RecordWatchProgressParams {
  courseId: string;
  userId: string;
  videoId?: string;
  watchTime: number; // 观看时长（秒）
  progress: number; // 观看进度（0-1）
}
