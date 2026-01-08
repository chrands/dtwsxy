/**
 * 自定义错误类
 * 统一错误处理机制
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super('CONFLICT', message, 409);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = '请求参数错误') {
    super('BAD_REQUEST', message, 400);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class BusinessError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_ERROR') {
    super(code, message, 400);
    this.name = 'BusinessError';
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}
