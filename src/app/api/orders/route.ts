/**
 * 订单API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { OrderService } from '@/modules/order/order.service';
import { AuthHelper } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createOrderSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  productType: z.string().min(1, '产品类型不能为空'),
  productId: z.string().min(1, '产品ID不能为空'),
  productName: z.string().min(1, '产品名称不能为空'),
  // 支持字符串或数字，确保精度
  amount: z.union([
    z.string().regex(/^\d+(\.\d{1,2})?$/, '金额格式不正确'),
    z.number().positive('金额必须大于0'),
  ]).transform(val => String(val)), // 统一转换为字符串
});

const queryOrdersSchema = CommonSchemas.pagination.extend({
  userId: z.string().optional(),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']).optional(),
  productType: z.string().optional(),
});

/**
 * GET /api/orders - 查询订单列表
 */
export async function GET(request: NextRequest) {
  try {
    // 认证检查
    const currentUser = await AuthHelper.getActiveUser(request);

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = await Validator.validateQuery(queryOrdersSchema, queryParams);

    // 非管理员只能查询自己的订单
    const userId = currentUser.role !== 'ADMIN' ? currentUser.userId : validatedParams.userId;

    const result = await OrderService.queryOrders({
      page: validatedParams.page ?? 1,
      pageSize: validatedParams.pageSize ?? 20,
      userId,
      status: validatedParams.status,
      productType: validatedParams.productType,
    });

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('查询订单列表失败', error);
    
    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }
    
    return ResponseHelper.serverError('查询订单列表失败');
  }
}

/**
 * POST /api/orders - 创建订单
 */
export async function POST(request: NextRequest) {
  try {
    // 认证检查
    const currentUser = await AuthHelper.getActiveUser(request);

    const body = await request.json();
    const validatedData = await Validator.validateBody(createOrderSchema, body);

    // 确保用户只能为自己创建订单
    if (validatedData.userId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      return ResponseHelper.forbidden('只能为自己创建订单');
    }

    const order = await OrderService.createOrder(validatedData);

    return ResponseHelper.success(order, '订单创建成功');
  } catch (error) {
    logger.error('创建订单失败', error);
    
    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }
    
    return ResponseHelper.serverError('创建订单失败');
  }
}
