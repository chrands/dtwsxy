/**
 * 医生服务层
 * 所有医生相关的业务逻辑必须在此实现
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError, ConflictError } from '@/lib/errors';
import type { CreateDoctorParams, UpdateDoctorParams, QueryDoctorsParams, DoctorDetail } from './doctor.types';
import type { PaginatedResult } from '@/types';

export class DoctorService {
  /**
   * 创建医生资料
   */
  static async createDoctor(params: CreateDoctorParams): Promise<DoctorDetail> {
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // 检查是否已有医生资料
    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId: params.userId },
    });

    if (existingDoctor) {
      throw new ConflictError('该用户已有医生资料');
    }

    // 创建医生资料
    const doctor = await prisma.doctor.create({
      data: params,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return doctor;
  }

  /**
   * 根据ID获取医生
   */
  static async getDoctorById(id: string): Promise<DoctorDetail> {
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundError('医生不存在');
    }

    return doctor;
  }

  /**
   * 更新医生信息
   */
  static async updateDoctor(id: string, params: UpdateDoctorParams): Promise<DoctorDetail> {
    await this.getDoctorById(id);

    const doctor = await prisma.doctor.update({
      where: { id },
      data: params,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return doctor;
  }

  /**
   * 查询医生列表（分页）
   */
  static async queryDoctors(params: QueryDoctorsParams): Promise<PaginatedResult<DoctorDetail>> {
    const { page, pageSize, isVerified, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }
    
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { hospital: { contains: keyword } },
        { department: { contains: keyword } },
        { specialty: { contains: keyword } },
      ];
    }

    const total = await prisma.doctor.count({ where });

    const doctors = await prisma.doctor.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return {
      items: doctors,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 验证医生
   */
  static async verifyDoctor(id: string): Promise<DoctorDetail> {
    const doctor = await this.updateDoctor(id, { isVerified: true });
    return doctor;
  }
}
