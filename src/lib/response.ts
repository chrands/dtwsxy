import { NextResponse } from 'next/server';

/**
 * 统一API响应格式
 * 所有API必须使用此模块返回响应
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ResponseHelper {
  /**
   * 成功响应
   */
  static success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message: message || '操作成功',
    });
  }

  /**
   * 分页成功响应
   */
  static successWithPagination<T>(
    data: T,
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    },
    message?: string
  ): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message: message || '操作成功',
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.pageSize),
      },
    });
  }

  /**
   * 错误响应
   */
  static error(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    status: number = 500,
    details?: unknown
  ): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message,
          details,
        },
      },
      { status }
    );
  }

  /**
   * 验证错误响应
   */
  static validationError(
    message: string = '参数验证失败',
    details?: unknown
  ): NextResponse<ApiResponse> {
    return this.error(message, 'VALIDATION_ERROR', 400, details);
  }

  /**
   * 未授权响应
   */
  static unauthorized(message: string = '未授权访问'): NextResponse<ApiResponse> {
    return this.error(message, 'UNAUTHORIZED', 401);
  }

  /**
   * 禁止访问响应
   */
  static forbidden(message: string = '禁止访问'): NextResponse<ApiResponse> {
    return this.error(message, 'FORBIDDEN', 403);
  }

  /**
   * 未找到响应
   */
  static notFound(message: string = '资源不存在'): NextResponse<ApiResponse> {
    return this.error(message, 'NOT_FOUND', 404);
  }

  /**
   * 服务器错误响应
   */
  static serverError(
    message: string = '服务器内部错误',
    details?: unknown
  ): NextResponse<ApiResponse> {
    return this.error(message, 'SERVER_ERROR', 500, details);
  }
}
