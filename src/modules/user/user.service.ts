/**
 * 用户服务层
 * 所有用户相关的业务逻辑必须在此实现
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError, ConflictError } from '@/lib/errors';
import type { CreateUserParams, UpdateUserParams, QueryUsersParams, PublicUser } from './user.types';
import type { PaginatedResult } from '@/types';
import bcrypt from 'bcryptjs';

export class UserService {
  /**
   * 创建用户
   */
  static async createUser(params: CreateUserParams): Promise<PublicUser> {
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: params.email },
    });

    if (existingUser) {
      throw new ConflictError('邮箱已被注册');
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

    // 密码加密
    const hashedPassword = await bcrypt.hash(params.password, 10);

    // 创建用户
    try {
      const user = await prisma.user.create({
        data: {
          ...params,
          password: hashedPassword,
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
    const { page, pageSize, role, status, keyword } = params;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
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