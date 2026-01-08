/**
 * 资源服务层
 * 所有资源相关的业务逻辑必须在此实现
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import type { CreateResourceParams, QueryResourcesParams } from './resource.types';
import type { PaginatedResult } from '@/types';
import { ResourceStatus } from '@prisma/client';

export class ResourceService {
  /**
   * 创建资源
   */
  static async createResource(params: CreateResourceParams) {
    const resource = await prisma.resource.create({
      data: {
        title: params.title,
        description: params.description,
        type: params.type,
        fileUrl: params.fileUrl,
        cover: params.cover,
        category: params.category,
        status: ResourceStatus.PUBLISHED,
      },
    });

    return resource;
  }

  /**
   * 根据ID获取资源详情
   */
  static async getResourceById(resourceId: string) {
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundError('资源不存在');
    }

    // 增加查看次数
    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return resource;
  }

  /**
   * 查询资源列表
   */
  static async queryResources(params: QueryResourcesParams): Promise<PaginatedResult<Resource>> {
    const { page, pageSize, type, category, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: ResourceStatus.PUBLISHED,
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const total = await prisma.resource.count({ where });

    const resources = await prisma.resource.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: resources,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
