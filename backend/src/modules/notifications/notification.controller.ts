import { Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { validate } from '../../utils/validation';
import { notificationIdParamsSchema } from './notification.validation';

const notificationService = new NotificationService();

export const getNotifications = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const notifications = await notificationService.getUserNotifications(req.user!.id);

    res.json(success(notifications, 'Notifications retrieved successfully'));
  }
);

export const markAsRead = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { notificationId } = validate(notificationIdParamsSchema, req.params);

    const notification = await notificationService.markAsRead(req.user!.id, notificationId);

    res.json(success(notification, 'Notification marked as read'));
  }
);

export const markAllAsRead = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    await notificationService.markAllAsRead(req.user!.id);

    res.json(success(null, 'All notifications marked as read'));
  }
);
