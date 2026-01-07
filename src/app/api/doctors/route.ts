/**
 * 医生API路由
 */

import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/lib/response';
import { Validator, CommonSchemas } from '@/lib/validator';
import { AuthHelper } from '@/lib/auth';
import { DoctorService } from '@/modules/doctor/doctor.service';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createDoctorSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  title: z.string().min(1, '职称不能为空'),
  hospital: z.string().min(1, '医院不能为空'),
  department: z.string().min(1, '科室不能为空'),
  specialty: z.string().min(1, '专长不能为空'),
  experience: z.number().int().min(0, '从业年限不能为负数'),
  certification: z.string().optional(),
  bio: z.string().optional(),
});

const queryDoctorsSchema = CommonSchemas.pagination.extend({
  isVerified: z.coerce.boolean().optional(),
  keyword: z.string().optional(),
});

/**
 * GET /api/doctors - 查询医生列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = await Validator.validateQuery(queryDoctorsSchema, queryParams);

    const result = await DoctorService.queryDoctors(validatedParams);

    return ResponseHelper.successWithPagination(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    logger.error('查询医生列表失败', error);
    
    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }
    
    return ResponseHelper.serverError('查询医生列表失败');
  }
}

/**
 * POST /api/doctors - 创建医生资料
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await AuthHelper.getActiveUser(request);
    const body = await request.json();

    const validatedData = await Validator.validateBody(createDoctorSchema, body);

    if (validatedData.userId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      return ResponseHelper.forbidden('只能为自己创建医生资料');
    }

    const doctor = await DoctorService.createDoctor({
      ...validatedData,
      userId: currentUser.role === 'ADMIN' ? validatedData.userId : currentUser.userId,
    });

    return ResponseHelper.success(doctor, '医生资料创建成功');
  } catch (error) {
    logger.error('创建医生资料失败', error);
    
    if (error instanceof AppError) {
      return ResponseHelper.error(error.message, error.code, error.statusCode, error.details);
    }
    
    return ResponseHelper.serverError('创建医生资料失败');
  }
}
