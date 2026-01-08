/**
 * 直播服务层
 * 所有直播相关的业务逻辑必须在此实现
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import type {
  CreateLiveParams,
  UpdateLiveParams,
  QueryLivesParams,
  LiveDetail,
  RecordWatchParams,
} from './live.types';
import type { PaginatedResult } from '@/types';
import { LiveStatus, PointsType } from '@prisma/client';
import { PointsService } from '../points/points.service';

export class LiveService {
  /**
   * 创建直播
   */
  static async createLive(params: CreateLiveParams) {
    const live = await prisma.live.create({
      data: {
        title: params.title,
        description: params.description,
        cover: params.cover,
        liveUrl: params.liveUrl,
        startTime: params.startTime,
        endTime: params.endTime,
        status: LiveStatus.UPCOMING,
      },
    });

    return live;
  }

  /**
   * 更新直播
   */
  static async updateLive(liveId: string, params: UpdateLiveParams) {
    const live = await this.getLiveById(liveId);

    const updated = await prisma.live.update({
      where: { id: liveId },
      data: params,
    });

    return updated;
  }

  /**
   * 根据ID获取直播详情
   */
  static async getLiveById(liveId: string, userId?: string): Promise<LiveDetail> {
    const live = await prisma.live.findUnique({
      where: { id: liveId },
    });

    if (!live) {
      throw new NotFoundError('直播不存在');
    }

    let isWatched = false;
    let watchTime = 0;

    if (userId) {
      const watchRecord = await prisma.liveWatchRecord.findUnique({
        where: {
          liveId_userId: {
            liveId,
            userId,
          },
        },
      });

      if (watchRecord) {
        isWatched = true;
        watchTime = watchRecord.watchTime;
      }
    }

    return {
      ...live,
      isWatched,
      watchTime,
    };
  }

  /**
   * 查询直播列表
   */
  static async queryLives(params: QueryLivesParams): Promise<PaginatedResult<LiveDetail>> {
    const { page, pageSize, status, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const total = await prisma.live.count({ where });

    const lives = await prisma.live.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { startTime: 'desc' },
    });

    return {
      items: lives as LiveDetail[],
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 记录观看
   */
  static async recordWatch(params: RecordWatchParams) {
    const { liveId, userId, watchTime } = params;

    // 检查直播是否存在
    await this.getLiveById(liveId);

    // 更新或创建观看记录
    const watchRecord = await prisma.liveWatchRecord.upsert({
      where: {
        liveId_userId: {
          liveId,
          userId,
        },
      },
      create: {
        liveId,
        userId,
        watchTime,
      },
      update: {
        watchTime: {
          increment: watchTime,
        },
      },
    });

    // 增加直播观看人数
    await prisma.live.update({
      where: { id: liveId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // 记录积分（观看直播）
    if (watchTime >= 60) {
      // 观看超过1分钟给积分
      await PointsService.addPoints(
        userId,
        10,
        PointsType.WATCH_LIVE,
        `观看直播（${Math.floor(watchTime / 60)}分钟）`,
        liveId
      );
    }

    return watchRecord;
  }

  /**
   * 获取进行中的直播
   */
  static async getLiveStreaming() {
    const now = new Date();

    const lives = await prisma.live.findMany({
      where: {
        status: LiveStatus.LIVE,
        startTime: {
          lte: now,
        },
        OR: [
          { endTime: null },
          { endTime: { gte: now } },
        ],
      },
      orderBy: { startTime: 'desc' },
      take: 5,
    });

    return lives;
  }

  /**
   * 获取直播预告
   */
  static async getUpcomingLives(limit: number = 5) {
    const now = new Date();

    const lives = await prisma.live.findMany({
      where: {
        status: LiveStatus.UPCOMING,
        startTime: {
          gte: now,
        },
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    });

    return lives;
  }
}
