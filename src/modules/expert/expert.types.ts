/**
 * 专家模块类型定义
 */

import { Expert, Doctor } from '@prisma/client';

// 专家创建参数
export interface CreateExpertParams {
  doctorId: string;
  photo?: string;
  introduction?: string;
  achievements?: string;
  isFeatured?: boolean;
  sortOrder?: number;
}

// 专家查询参数
export interface QueryExpertsParams {
  page: number;
  pageSize: number;
  isFeatured?: boolean;
  keyword?: string;
}

// 专家详情（包含医生信息）
export interface ExpertDetail extends Expert {
  doctor: Doctor & {
    user: {
      id: string;
      nickname: string;
      avatar: string | null;
    };
  };
}
