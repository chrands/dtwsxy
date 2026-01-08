/**
 * 医生模块类型定义
 */

import { Doctor } from '@prisma/client';

// 医生创建参数
export interface CreateDoctorParams {
  userId: string;
  title: string;
  hospital: string;
  department: string;
  specialty: string;
  experience: number;
  certification?: string;
  bio?: string;
}

// 医生更新参数
export interface UpdateDoctorParams {
  title?: string;
  hospital?: string;
  department?: string;
  specialty?: string;
  experience?: number;
  certification?: string;
  bio?: string;
  isVerified?: boolean;
}

// 医生查询参数
export interface QueryDoctorsParams {
  page: number;
  pageSize: number;
  isVerified?: boolean;
  keyword?: string;
}

// 医生详情（包含用户信息）
export interface DoctorDetail extends Doctor {
  user: {
    id: string;
    email: string | null;
    nickname: string;
    avatar: string | null;
  };
}
