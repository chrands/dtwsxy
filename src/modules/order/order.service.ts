/**
 * 订单服务层
 * 所有订单相关的业务逻辑必须在此实现
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError, BusinessError } from '@/lib/errors';
import { config } from '@/lib/config';
import type { CreateOrderParams, QueryOrdersParams, OrderDetail } from './order.types';
import type { PaginatedResult } from '@/types';

export class OrderService {
  /**
   * 生成订单号
   */
  private static generateOrderNo(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${config.business.order.orderNoPrefix}${timestamp}${random}`;
  }

  /**
   * 创建订单（使用事务避免并发冲突）
   */
  static async createOrder(params: CreateOrderParams): Promise<OrderDetail> {
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // 使用事务创建订单，确保订单号唯一性
    const order = await prisma.$transaction(async (tx) => {
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const orderNo = this.generateOrderNo();

        try {
          // 尝试创建订单
          const newOrder = await tx.order.create({
            data: {
              ...params,
              orderNo,
            },
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  email: true,
                },
              },
            },
          });

          return newOrder;
        } catch (error: any) {
          // 如果是唯一约束冲突（订单号重复），重试
          if (error.code === 'P2002' && error.meta?.target?.includes('orderNo')) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw new BusinessError('订单号生成失败，请重试');
            }
            // 等待随机时间后重试，避免并发冲突
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            continue;
          }
          // 其他错误直接抛出
          throw error;
        }
      }

      throw new BusinessError('订单创建失败');
    });

    return order;
  }

  /**
   * 根据ID获取订单
   */
  static async getOrderById(id: string): Promise<OrderDetail> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    return order;
  }

  /**
   * 根据订单号获取订单
   */
  static async getOrderByOrderNo(orderNo: string): Promise<OrderDetail> {
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    return order;
  }

  /**
   * 查询订单列表（分页）
   */
  static async queryOrders(params: QueryOrdersParams): Promise<PaginatedResult<OrderDetail>> {
    const { page, pageSize, userId, status, productType } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (productType) {
      where.productType = productType;
    }

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });

    return {
      items: orders,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 支付订单（幂等处理）
   */
  static async payOrder(id: string): Promise<OrderDetail> {
    const order = await this.getOrderById(id);

    // 幂等处理：如果已支付，直接返回
    if (order.status === 'PAID') {
      return order;
    }

    if (order.status !== 'PENDING') {
      throw new BusinessError('订单状态不允许支付');
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  /**
   * 取消订单（幂等处理）
   */
  static async cancelOrder(id: string): Promise<OrderDetail> {
    const order = await this.getOrderById(id);

    // 幂等处理：如果已取消，直接返回
    if (order.status === 'CANCELLED') {
      return order;
    }

    if (order.status !== 'PENDING') {
      throw new BusinessError('订单状态不允许取消');
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });

    return updatedOrder;
  }
}