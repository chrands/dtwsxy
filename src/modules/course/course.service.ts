/**
 * 课程服务层
 * 所有课程相关的业务逻辑必须在此实现
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '@/lib/errors';
import type {
  CreateCourseParams,
  UpdateCourseParams,
  QueryCoursesParams,
  CreateVideoParams,
  CreateCommentParams,
  CourseDetail,
  CourseListItem,
  RecordWatchProgressParams,
} from './course.types';
import type { PaginatedResult } from '@/types';
import { CourseStatus } from '@prisma/client';
import { PointsService } from '../points/points.service';

export class CourseService {
  /**
   * 创建课程
   */
  static async createCourse(params: CreateCourseParams) {
    const course = await prisma.course.create({
      data: {
        title: params.title,
        description: params.description,
        cover: params.cover,
        categoryId: params.categoryId,
        authorId: params.authorId,
        price: params.price || 0,
        originalPrice: params.originalPrice,
        isFree: params.isFree || false,
        isVip: params.isVip || false,
        status: CourseStatus.DRAFT,
      },
    });

    return course;
  }

  /**
   * 更新课程
   */
  static async updateCourse(courseId: string, params: UpdateCourseParams) {
    const course = await this.getCourseById(courseId);

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: params,
    });

    return updated;
  }

  /**
   * 根据ID获取课程详情
   */
  static async getCourseById(courseId: string, userId?: string): Promise<CourseDetail> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            doctorProfile: {
              select: {
                hospital: true,
                department: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('课程不存在');
    }

    // 检查是否已点赞、收藏
    let isLiked = false;
    let isFavorited = false;
    let watchProgress = 0;

    if (userId) {
      const [like, favorite, history] = await Promise.all([
        prisma.courseLike.findUnique({
          where: {
            courseId_userId: {
              courseId,
              userId,
            },
          },
        }),
        prisma.courseFavorite.findUnique({
          where: {
            courseId_userId: {
              courseId,
              userId,
            },
          },
        }),
        prisma.videoWatchHistory.findUnique({
          where: {
            courseId_userId: {
              courseId,
              userId,
            },
          },
        }),
      ]);

      isLiked = !!like;
      isFavorited = !!favorite;
      watchProgress = history?.progress || 0;
    }

    return {
      ...course,
      isLiked,
      isFavorited,
      watchProgress,
    };
  }

  /**
   * 查询课程列表
   */
  static async queryCourses(params: QueryCoursesParams): Promise<PaginatedResult<CourseListItem>> {
    const { page, pageSize, categoryId, department, authorId, status, isFree, keyword, sortBy } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (status !== undefined) {
      where.status = status;
    } else {
      // 默认只显示已发布的课程
      where.status = CourseStatus.PUBLISHED;
    }

    if (isFree !== undefined) {
      where.isFree = isFree;
    }

    // 科室筛选（通过分类的父分类）
    if (department) {
      where.category = {
        parent: {
          name: {
            contains: department,
          },
        },
      };
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    // 排序
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'popular') {
      orderBy = { viewCount: 'desc' };
    } else if (sortBy === 'price') {
      orderBy = { price: 'asc' };
    }

    const total = await prisma.course.count({ where });

    const courses = await prisma.course.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
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
      items: courses as CourseListItem[],
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 添加视频
   */
  static async addVideo(params: CreateVideoParams) {
    const course = await this.getCourseById(params.courseId);

    const video = await prisma.courseVideo.create({
      data: {
        courseId: params.courseId,
        title: params.title,
        description: params.description,
        videoUrl: params.videoUrl,
        duration: params.duration || 0,
        sortOrder: params.sortOrder || 0,
      },
    });

    return video;
  }

  /**
   * 获取课程视频列表
   */
  static async getCourseVideos(courseId: string) {
    await this.getCourseById(courseId);

    const videos = await prisma.courseVideo.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
    });

    return videos;
  }

  /**
   * 记录观看进度
   */
  static async recordWatchProgress(params: RecordWatchProgressParams) {
    const { courseId, userId, videoId, watchTime, progress } = params;

    // 更新或创建观看历史
    await prisma.videoWatchHistory.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      create: {
        courseId,
        videoId,
        userId,
        watchTime,
        progress,
      },
      update: {
        watchTime,
        progress,
        lastWatchAt: new Date(),
      },
    });

    // 增加课程观看次数
    await prisma.course.update({
      where: { id: courseId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // 记录积分（观看超过5分钟）
    if (watchTime >= 300) {
      await PointsService.addWatchVideoPoints(userId, watchTime);
    }

    return { success: true };
  }

  /**
   * 发表评论
   */
  static async createComment(params: CreateCommentParams) {
    const course = await this.getCourseById(params.courseId);

    const comment = await prisma.courseComment.create({
      data: {
        courseId: params.courseId,
        userId: params.userId,
        content: params.content,
        parentId: params.parentId,
      },
    });

    // 更新课程评论数
    await prisma.course.update({
      where: { id: params.courseId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    return comment;
  }

  /**
   * 获取课程评论列表
   */
  static async getCourseComments(courseId: string, page: number = 1, pageSize: number = 20) {
    await this.getCourseById(courseId);

    const skip = (page - 1) * pageSize;

    const total = await prisma.courseComment.count({
      where: {
        courseId,
        status: 'PUBLISHED',
        parentId: null, // 只获取顶级评论
      },
    });

    const comments = await prisma.courseComment.findMany({
      where: {
        courseId,
        status: 'PUBLISHED',
        parentId: null,
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        replies: {
          where: {
            status: 'PUBLISHED',
          },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      items: comments,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 点赞/取消点赞
   */
  static async toggleLike(courseId: string, userId: string) {
    const course = await this.getCourseById(courseId);

    const existingLike = await prisma.courseLike.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    if (existingLike) {
      // 取消点赞
      await prisma.courseLike.delete({
        where: {
          courseId_userId: {
            courseId,
            userId,
          },
        },
      });

      await prisma.course.update({
        where: { id: courseId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });

      return { isLiked: false };
    } else {
      // 点赞
      await prisma.courseLike.create({
        data: {
          courseId,
          userId,
        },
      });

      await prisma.course.update({
        where: { id: courseId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      });

      return { isLiked: true };
    }
  }

  /**
   * 收藏/取消收藏
   */
  static async toggleFavorite(courseId: string, userId: string) {
    const course = await this.getCourseById(courseId);

    const existingFavorite = await prisma.courseFavorite.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    if (existingFavorite) {
      // 取消收藏
      await prisma.courseFavorite.delete({
        where: {
          courseId_userId: {
            courseId,
            userId,
          },
        },
      });

      await prisma.course.update({
        where: { id: courseId },
        data: {
          favoriteCount: {
            decrement: 1,
          },
        },
      });

      return { isFavorited: false };
    } else {
      // 收藏
      await prisma.courseFavorite.create({
        data: {
          courseId,
          userId,
        },
      });

      await prisma.course.update({
        where: { id: courseId },
        data: {
          favoriteCount: {
            increment: 1,
          },
        },
      });

      return { isFavorited: true };
    }
  }

  /**
   * 获取观看历史
   */
  static async getWatchHistory(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const total = await prisma.videoWatchHistory.count({
      where: { userId },
    });

    const history = await prisma.videoWatchHistory.findMany({
      where: { userId },
      skip,
      take: pageSize,
      orderBy: { lastWatchAt: 'desc' },
      include: {
        course: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return {
      items: history,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取相关课程推荐
   */
  static async getRelatedCourses(courseId: string, limit: number = 5) {
    const course = await this.getCourseById(courseId);

    const related = await prisma.course.findMany({
      where: {
        categoryId: course.categoryId,
        id: {
          not: courseId,
        },
        status: CourseStatus.PUBLISHED,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return related;
  }
}
