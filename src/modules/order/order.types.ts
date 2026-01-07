/**
 * 订单模块类型定义
 */

import { Order, OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// 订单创建参数
export interface CreateOrderParams {
  userId: string;
  productType: string;
  productId: string;
  productName: string;
  amount: string | number; // 支持字符串和数字，服务层转换为 Decimal
}

// 订单查询参数
export interface QueryOrdersParams {
  page: number;
  pageSize: number;
  userId?: string;
  status?: OrderStatus;
  productType?: string;
}

// 订单详情（包含用户信息）
export interface OrderDetail extends Order {
  user: {
    id: string;
    nickname: string;
    email: string;
  };
}