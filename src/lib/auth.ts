/**
 * JWT 认证工具
 * 提供 token 生成、验证和用户认证功能
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from './config';
import { prisma } from './prisma';
import { UnauthorizedError } from './errors';
import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isUserRole = (value: unknown): value is UserRole =>
  value === UserRole.USER || value === UserRole.DOCTOR || value === UserRole.ADMIN;

const isJwtPayload = (value: unknown): value is JwtPayload => {
  if (!isRecord(value)) {
    return false;
  }

  const userId = value['userId'];
  const email = value['email'];
  const role = value['role'];

  return typeof userId === 'string' && typeof email === 'string' && isUserRole(role);
};

export class AuthHelper {
  /**
   * 生成 JWT Token
   */
  static generateToken(payload: JwtPayload): string {
    const options: SignOptions = {
      expiresIn: config.jwt.expiresIn as string | number,
    };
    return jwt.sign(payload, config.jwt.secret, options);
  }

  /**
   * 验证 JWT Token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      if (!isJwtPayload(decoded)) {
        throw new UnauthorizedError('无效或过期的令牌');
      }
      return decoded;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('无效或过期的令牌');
    }
  }

  /**
   * 从请求中提取并验证 Token
   */
  static extractTokenFromRequest(request: NextRequest): JwtPayload {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      throw new UnauthorizedError('缺少认证令牌');
    }

    // 支持 "Bearer TOKEN" 格式
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    return this.verifyToken(token);
  }

  /**
   * 检查用户角色权限
   */
  static checkRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(userRole);
  }

  /**
   * 要求特定角色
   */
  static requireRole(userRole: UserRole, allowedRoles: UserRole[]): void {
    if (!this.checkRole(userRole, allowedRoles)) {
      throw new UnauthorizedError('权限不足');
    }
  }

  /**
   * 获取当前用户（从请求中）
   */
  static getCurrentUser(request: NextRequest): JwtPayload {
    return this.extractTokenFromRequest(request);
  }

  /**
   * 获取当前用户（验证账户状态与角色）
   */
  static async getActiveUser(request: NextRequest): Promise<JwtPayload> {
    const payload = this.extractTokenFromRequest(request);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('账户已被禁用');
    }

    return {
      userId: user.id,
      email: user.email || '',
      role: user.role,
    };
  }
}
