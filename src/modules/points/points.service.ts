/**
 * 积分服务层
 * 所有积分相关的业务逻辑必须在此实现
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError, BusinessError } from '@/lib/errors';
import type { CheckInParams, QueryPointsLogsParams, ExchangePointsParams } from './points.types';
import type { PaginatedResult } from '@/types';
import { PointsType } from '@prisma/client';

export class PointsService {
  /**
   * 每日签到
   */
  static async checkIn(params: CheckInParams) {
    const { userId } = params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查今日是否已签到
    const todayCheckIn = await prisma.checkIn.findUnique({
      where: {
        userId_checkInDate: {
          userId,
          checkInDate: today,
        },
      },
    });

    if (todayCheckIn) {
      throw new BusinessError('今日已签到，请明天再来');
    }

    // 获取最近一次签到记录
    const lastCheckIn = await prisma.checkIn.findFirst({
      where: { userId },
      orderBy: { checkInDate: 'desc' },
    });

    // 计算连续签到天数
    let consecutiveDays = 1;
    if (lastCheckIn) {
      const lastDate = new Date(lastCheckIn.checkInDate);
      lastDate.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate.getTime() === yesterday.getTime()) {
        // 连续签到
        consecutiveDays = lastCheckIn.consecutiveDays + 1;
      }
    }

    // 计算积分（基础10分，连续签到有加成）
    let points = 10;
    if (consecutiveDays >= 7) {
      points = 20; // 连续7天及以上，双倍积分
    } else if (consecutiveDays >= 3) {
      points = 15; // 连续3天及以上，1.5倍积分
    }

    // 创建签到记录
    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        checkInDate: today,
        consecutiveDays,
        points,
      },
    });

    // 更新用户积分
    await this.addPoints(userId, points, PointsType.CHECK_IN, `每日签到（连续${consecutiveDays}天）`);

    return checkIn;
  }

  /**
   * 添加积分
   */
  static async addPoints(
    userId: string,
    points: number,
    type: PointsType,
    description?: string,
    relatedId?: string
  ) {
    // 获取或创建用户积分记录
    let userPoints = await prisma.userPoints.findUnique({
      where: { userId },
    });

    if (!userPoints) {
      userPoints = await prisma.userPoints.create({
        data: {
          userId,
          totalPoints: 0,
          availablePoints: 0,
          usedPoints: 0,
        },
      });
    }

    // 更新积分
    await prisma.userPoints.update({
      where: { userId },
      data: {
        totalPoints: userPoints.totalPoints + points,
        availablePoints: userPoints.availablePoints + points,
      },
    });

    // 记录积分流水
    await prisma.pointsLog.create({
      data: {
        userId,
        points,
        type,
        description,
        relatedId,
      },
    });
  }

  /**
   * 消耗积分
   */
  static async consumePoints(
    userId: string,
    points: number,
    type: PointsType,
    description?: string,
    relatedId?: string
  ) {
    const userPoints = await prisma.userPoints.findUnique({
      where: { userId },
    });

    if (!userPoints) {
      throw new NotFoundError('用户积分记录不存在');
    }

    if (userPoints.availablePoints < points) {
      throw new BadRequestError('积分不足');
    }

    // 更新积分
    await prisma.userPoints.update({
      where: { userId },
      data: {
        availablePoints: userPoints.availablePoints - points,
        usedPoints: userPoints.usedPoints + points,
      },
    });

    // 记录积分流水（负数）
    await prisma.pointsLog.create({
      data: {
        userId,
        points: -points,
        type,
        description,
        relatedId,
      },
    });
  }

  /**
   * 获取用户积分
   */
  static async getUserPoints(userId: string) {
    let userPoints = await prisma.userPoints.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    if (!userPoints) {
      // 如果不存在，创建默认记录
      userPoints = await prisma.userPoints.create({
        data: {
          userId,
          totalPoints: 0,
          availablePoints: 0,
          usedPoints: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      });
    }

    return userPoints;
  }

  /**
   * 查询积分流水
   */
  static async queryPointsLogs(params: QueryPointsLogsParams): Promise<PaginatedResult<any>> {
    const { page, pageSize, userId, type } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    const total = await prisma.pointsLog.count({ where });

    const logs = await prisma.pointsLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: logs,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 积分兑换
   */
  static async exchangePoints(params: ExchangePointsParams) {
    const { userId, points, type, relatedId, description } = params;

    // 消耗积分
    await this.consumePoints(
      userId,
      points,
      PointsType.EXCHANGE,
      description || `积分兑换：${type}`,
      relatedId
    );

    return { success: true };
  }

  /**
   * 观看视频积分（检查每日上限）
   */
  static async addWatchVideoPoints(userId: string, watchTime: number) {
    // 获取今日观看视频积分记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = await prisma.pointsLog.findMany({
      where: {
        userId,
        type: PointsType.WATCH_VIDEO,
        createdAt: {
          gte: today,
        },
      },
    });

    // 计算今日已获得积分
    const todayPoints = todayLogs.reduce((sum, log) => sum + log.points, 0);

    // 每日上限100分
    if (todayPoints >= 100) {
      return { points: 0, message: '今日观看视频积分已达上限' };
    }

    // 观看超过5分钟才给积分
    if (watchTime < 300) {
      return { points: 0, message: '观看时长不足5分钟' };
    }

    // 每次观看+20分
    const points = 20;
    const remaining = 100 - todayPoints;
    const actualPoints = Math.min(points, remaining);

    if (actualPoints > 0) {
      await this.addPoints(
        userId,
        actualPoints,
        PointsType.WATCH_VIDEO,
        `观看视频（${Math.floor(watchTime / 60)}分钟）`
      );
    }

    return {
      points: actualPoints,
      message: actualPoints > 0 ? '积分已到账' : '今日观看视频积分已达上限',
    };
  }
}
