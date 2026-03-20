import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { validate } from '../../utils/validation';
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from './auth.validation';

const authService = new AuthService();

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = validate(registerSchema, req.body);

    const result = await authService.register(name, email, password);

    res.status(201).json(success(result, 'User registered successfully'));
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = validate(loginSchema, req.body);

    const result = await authService.login(email, password);

    res.json(success(result, 'Login successful'));
  }
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = validate(refreshTokenSchema, req.body);

    const result = await authService.refreshToken(refreshToken);

    res.json(success(result, 'Token refreshed successfully'));
  }
);

export const logout = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { refreshToken } = validate(logoutSchema, req.body);

    await authService.logout(refreshToken);

    res.json(success(null, 'Logout successful'));
  }
);

export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await authService.getProfile(req.user!.id);

    res.json(success(user, 'Profile retrieved successfully'));
  }
);
