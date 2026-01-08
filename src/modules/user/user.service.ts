/**
 * 用户服务层
 * 所有用户相关的业务逻辑必须在此实现
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '@/lib/errors';
import type { CreateUserParams, UpdateUserParams, QueryUsersParams, PublicUser, VerifyMedicalParams } from './user.types';
import type { PaginatedResult } from '@/types';
import bcrypt from 'bcryptjs';
import { UserType } from '@prisma/client';

export class UserService {
  /**
   * 创建用户
   */
  static async createUser(params: CreateUserParams): Promise<PublicUser> {
    // 验证：必须提供邮箱或手机号至少一个
    if (!params.email && !params.phone) {
      throw new BadRequestError('必须提供邮箱或手机号');
    }

    // 检查邮箱是否已存在
    if (params.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: params.email },
      });

      if (existingUser) {
        throw new ConflictError('邮箱已被注册');
      }
    }

    // 检查手机号是否已存在
    if (params.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: params.phone },
      });

      if (existingPhone) {
        throw new ConflictError('手机号已被注册');
      }
    }

    // 医护人员注册验证
    if (params.userType === UserType.MEDICAL_STAFF) {
      if (!params.hospital || !params.department || !params.title) {
        throw new BadRequestError('医护人员注册必须填写医院、科室和职称');
      }
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(params.password, 10);

    // 创建用户（包含医护人员信息）
    try {
      const { hospital, department, title, specialty, experience, certification, bio, ...userData } = params;

      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          userType: params.userType || UserType.NON_MEDICAL,
          // 如果是医护人员，创建 Doctor 记录
          doctorProfile: params.userType === UserType.MEDICAL_STAFF && hospital && department && title ? {
            create: {
              hospital,
              department,
              title,
              specialty: specialty || '',
              experience: experience || 0,
              certification,
              bio,
              isVerified: false, // 初始未认证，需要后续审核
            },
          } : undefined,
        },
        include: {
          doctorProfile: true,
        },
      });

      // 移除密码字段
      const { password, ...publicUser } = user;
      return publicUser;
    } catch (error: any) {
      // 捕获 Prisma 唯一约束错误并转换为 ConflictError
      if (error?.code === 'P2002') {
        const target = error.meta?.target || [];
        if (Array.isArray(target) && target.some((t: string) => t.includes('email') || t === 'email')) {
          throw new ConflictError('邮箱已被注册');
        }
        if (Array.isArray(target) && target.some((t: string) => t.includes('phone') || t === 'phone')) {
          throw new ConflictError('手机号已被注册');
        }
        // 如果无法确定具体字段，抛出通用冲突错误
        throw new ConflictError('数据冲突，请检查邮箱或手机号是否已被使用');
      }
      throw error;
    }
  }

  /**
   * 医护人员认证
   */
  static async verifyMedical(userId: string, params: VerifyMedicalParams): Promise<PublicUser> {
    const user = await this.getUserById(userId);

    if (user.userType !== UserType.MEDICAL_STAFF) {
      throw new BadRequestError('只有医护人员可以进行认证');
    }

    // 更新或创建 Doctor 记录
    await prisma.doctor.upsert({
      where: { userId },
      create: {
        userId,
        hospital: params.hospital,
        department: params.department,
        title: params.title,
        specialty: params.specialty || '',
        experience: params.experience || 0,
        certification: params.certification,
        bio: params.bio,
        isVerified: false, // 需要管理员审核
      },
      update: {
        hospital: params.hospital,
        department: params.department,
        title: params.title,
        specialty: params.specialty || '',
        experience: params.experience || 0,
        certification: params.certification,
        bio: params.bio,
      },
    });

    // 更新用户认证状态
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isMedicalVerified: false, // 等待审核
      },
    });

    const { password, ...publicUser } = updatedUser;
    return publicUser;
  }

  /**
   * 根据ID获取用户
   */
  static async getUserById(id: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const { password, ...publicUser } = user;
    return publicUser;
  }

  /**
   * 更新用户信息（包含唯一性校验）
   */
  static async updateUser(id: string, params: UpdateUserParams): Promise<PublicUser> {
    // 检查用户是否存在
    const existingUser = await this.getUserById(id);

    // 如果更新手机号，检查是否已被其他用户使用
    if (params.phone) {
      const phoneUser = await prisma.user.findUnique({
        where: { phone: params.phone },
      });

      if (phoneUser && phoneUser.id !== id) {
        throw new ConflictError('手机号已被其他用户使用');
      }
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: params,
      });

      const { password, ...publicUser } = user;
      return publicUser;
    } catch (error: any) {
      // 捕获 Prisma 唯一约束错误并转换为 ConflictError
      if (error?.code === 'P2002') {
        const target = error.meta?.target || [];
        if (Array.isArray(target) && target.some((t: string) => t.includes('phone') || t === 'phone')) {
          throw new ConflictError('手机号已被其他用户使用');
        }
        if (Array.isArray(target) && target.some((t: string) => t.includes('email') || t === 'email')) {
          throw new ConflictError('邮箱已被其他用户使用');
        }
        // 如果无法确定具体字段，抛出通用冲突错误
        throw new ConflictError('数据冲突，请检查邮箱或手机号是否已被使用');
      }
      throw error;
    }
  }

  /**
   * 查询用户列表（分页）
   */
  static async queryUsers(params: QueryUsersParams): Promise<PaginatedResult<PublicUser>> {
    const { page, pageSize, role, status, userType, keyword } = params;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
    }

    if (userType) {
      where.userType = userType;
    }
    
    if (keyword) {
      where.OR = [
        { email: { contains: keyword } },
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    // 查询总数
    const total = await prisma.user.count({ where });

    // 查询数据
    const users = await prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    // 移除密码字段
    const publicUsers = users.map(({ password, ...user }) => user);

    return {
      items: publicUsers,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 软删除用户（推荐）
   */
  static async softDeleteUser(id: string): Promise<void> {
    await this.getUserById(id);
    await prisma.user.update({
      where: { id },
      data: {
        status: 'INACTIVE',
      },
    });
  }

  /**
   * 永久删除用户（仅管理员，慎用）
   */
  static async deleteUser(id: string): Promise<void> {
    await this.getUserById(id);
    await prisma.user.delete({ where: { id } });
  }
}