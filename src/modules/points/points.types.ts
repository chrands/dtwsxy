/**
 * 积分模块类型定义
 */

import { PointsType, PointsLog, CheckIn, UserPoints } from '@prisma/client';

// 签到参数
export interface CheckInParams {
  userId: string;
}

// 积分查询参数
export interface QueryPointsLogsParams {
  page: number;
  pageSize: number;
  userId: string;
  type?: PointsType;
}

// 积分兑换参数
export interface ExchangePointsParams {
  userId: string;
  points: number;
  type: string; // 兑换类型：COURSE 等
  relatedId: string; // 关联ID（如课程ID）
  description?: string;
}

// 积分详情（包含用户信息）
export interface PointsDetail extends UserPoints {
  user: {
    id: string;
    nickname: string;
  };
}

// 签到详情
export interface CheckInDetail extends CheckIn {
  user: {
    id: string;
    nickname: string;
  };
}
