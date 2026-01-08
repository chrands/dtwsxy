/**
 * 专家服务层
 * 所有专家相关的业务逻辑必须在此实现
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import type { CreateExpertParams, QueryExpertsParams, ExpertDetail } from './expert.types';
import type { PaginatedResult } from '@/types';

export class ExpertService {
  /**
   * 创建专家
   */
  static async createExpert(params: CreateExpertParams) {
    const expert = await prisma.expert.create({
      data: {
        doctorId: params.doctorId,
        photo: params.photo,
        introduction: params.introduction,
        achievements: params.achievements,
        isFeatured: params.isFeatured || false,
        sortOrder: params.sortOrder || 0,
      },
    });

    return expert;
  }

  /**
   * 根据ID获取专家详情
   */
  static async getExpertById(expertId: string): Promise<ExpertDetail> {
    const expert = await prisma.expert.findUnique({
      where: { id: expertId },
      include: {
        doctor: {
          include: {
            user: {
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

    if (!expert) {
      throw new NotFoundError('专家不存在');
    }

    return expert as ExpertDetail;
  }

  /**
   * 查询专家列表
   */
  static async queryExperts(params: QueryExpertsParams): Promise<PaginatedResult<ExpertDetail>> {
    const { page, pageSize, isFeatured, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (keyword) {
      where.OR = [
        {
          doctor: {
            user: {
              nickname: { contains: keyword },
            },
          },
        },
        {
          doctor: {
            hospital: { contains: keyword },
          },
        },
        {
          doctor: {
            department: { contains: keyword },
          },
        },
      ];
    }

    const total = await prisma.expert.count({ where });

    const experts = await prisma.expert.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        doctor: {
          include: {
            user: {
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
      items: experts as ExpertDetail[],
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取专家的课程
   */
  static async getExpertCourses(doctorId: string, page: number = 1, pageSize: number = 20) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundError('医生不存在');
    }

    const skip = (page - 1) * pageSize;

    const total = await prisma.course.count({
      where: {
        authorId: doctor.userId,
        status: 'PUBLISHED',
      },
    });

    const courses = await prisma.course.findMany({
      where: {
        authorId: doctor.userId,
        status: 'PUBLISHED',
      },
      skip,
      take: pageSize,
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

    return {
      items: courses,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取专家的文章
   */
  static async getExpertArticles(doctorId: string, page: number = 1, pageSize: number = 20) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundError('医生不存在');
    }

    const skip = (page - 1) * pageSize;

    const total = await prisma.post.count({
      where: {
        authorId: doctor.userId,
        status: 'PUBLISHED',
      },
    });

    const articles = await prisma.post.findMany({
      where: {
        authorId: doctor.userId,
        status: 'PUBLISHED',
      },
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

    return {
      items: articles,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
