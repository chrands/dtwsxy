/**
 * 资源模块类型定义
 */

import { Resource, ResourceType, ResourceStatus } from '@prisma/client';

// 资源创建参数
export interface CreateResourceParams {
  title: string;
  description?: string;
  type: ResourceType;
  fileUrl: string;
  cover?: string;
  category?: string;
}

// 资源查询参数
export interface QueryResourcesParams {
  page: number;
  pageSize: number;
  type?: ResourceType;
  category?: string;
  keyword?: string;
}
