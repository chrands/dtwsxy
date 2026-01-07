/**
 * 全局通用类型定义
 */

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页结果
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 排序参数
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// 时间戳
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// 软删除
export interface SoftDelete {
  deletedAt: Date | null;
}
