import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error-handler';
import { verifyAccessToken } from '../modules/auth/auth.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication token required');
    }

    const token = authHeader.substring(7);
    const user = await verifyAccessToken(token);

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      next(new AppError(401, 'Token expired'));
    } else if ((error as Error).name === 'JsonWebTokenError') {
      next(new AppError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Not authorized to access this resource'));
    }

    next();
  };
};
