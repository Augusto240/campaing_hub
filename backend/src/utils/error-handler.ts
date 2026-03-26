import { Response, NextFunction, Request } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
    public code = 'APP_ERROR'
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const isDevelopment = process.env.NODE_ENV === 'development';

export const handleError = (err: Error | AppError, res: Response) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      code: err.code,
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  logger.error({ err }, 'Unhandled error');

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDevelopment && { stack: err.stack }),
  });
};

export const asyncHandler = <TReq = Request, TRes = Response>(
  fn: (req: TReq, res: TRes, next: NextFunction) => Promise<unknown>
) => {
  return (req: TReq, res: TRes, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};
