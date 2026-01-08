/**
 * 用户模块类型定义
 * 所有用户相关的类型在此定义
 */

import { User, UserRole, UserStatus, UserType } from '@prisma/client';

// 用户创建参数
export interface CreateUserParams {
  email?: string;
  phone?: string;
  password: string;
  nickname: string;
  role?: UserRole;
  userType?: UserType;
  // 医护人员专属字段
  hospital?: string;
  department?: string;
  title?: string;
  specialty?: string;
  experience?: number;
  certification?: string;
  bio?: string;
}

// 用户更新参数
export interface UpdateUserParams {
  nickname?: string;
  avatar?: string;
  phone?: string;
}

// 用户查询参数
export interface QueryUsersParams {
  page: number;
  pageSize: number;
  role?: UserRole;
  status?: UserStatus;
  userType?: UserType;
  keyword?: string;
}

// 公开用户信息（不包含敏感信息）
export type PublicUser = Omit<User, 'password'>;

// 医护人员认证参数
export interface VerifyMedicalParams {
  hospital: string;
  department: string;
  title: string;
  specialty?: string;
  experience?: number;
  certification?: string;
  bio?: string;
}
