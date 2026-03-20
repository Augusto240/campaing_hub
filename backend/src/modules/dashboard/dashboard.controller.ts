import { Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

const dashboardService = new DashboardService();

export const getDashboardStats = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stats = await dashboardService.getDashboardStats(req.user!.id);

    res.json(success(stats, 'Dashboard stats retrieved successfully'));
  }
);
