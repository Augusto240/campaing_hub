import { Request, Response, NextFunction } from 'express';
import { handleError } from '../utils/error-handler';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  handleError(err, res);
};
