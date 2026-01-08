/**
 * 直播模块类型定义
 */

import { Live, LiveStatus } from '@prisma/client';

// 直播创建参数
export interface CreateLiveParams {
  title: string;
  description?: string;
  cover?: string;
  liveUrl?: string;
  startTime: Date;
  endTime?: Date;
}

// 直播更新参数
export interface UpdateLiveParams {
  title?: string;
  description?: string;
  cover?: string;
  liveUrl?: string;
  status?: LiveStatus;
  startTime?: Date;
  endTime?: Date;
}

// 直播查询参数
export interface QueryLivesParams {
  page: number;
  pageSize: number;
  status?: LiveStatus;
  keyword?: string;
}

// 直播详情
export interface LiveDetail extends Live {
  isWatched?: boolean; // 是否已观看
  watchTime?: number; // 观看时长
}

// 观看记录参数
export interface RecordWatchParams {
  liveId: string;
  userId: string;
  watchTime: number; // 观看时长（秒）
}
