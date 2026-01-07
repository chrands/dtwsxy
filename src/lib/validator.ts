import { z } from 'zod';
import { ValidationError } from './errors';

/**
 * 参数验证工具
 * 基于Zod进行参数验证
 */

export class Validator {
  /**
   * 验证请求体
   */
  static async validateBody<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
    try {
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('参数验证失败', error.errors);
      }
      throw error;
    }
  }

  /**
   * 验证查询参数
   */
  static async validateQuery<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
    try {
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('查询参数验证失败', error.errors);
      }
      throw error;
    }
  }

  /**
   * 验证路径参数
   */
  static async validateParams<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
    try {
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('路径参数验证失败', error.errors);
      }
      throw error;
    }
  }
}

// 通用验证Schema
export const CommonSchemas = {
  // 分页参数
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  }),

  // ID参数
  id: z.object({
    id: z.string().min(1),
  }),

  // 邮箱
  email: z.string().email('邮箱格式不正确'),

  // 手机号（中国）
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),

  // 密码
  password: z.string().min(6, '密码至少6个字符').max(50, '密码最多50个字符'),
};
