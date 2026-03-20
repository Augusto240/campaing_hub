import cron from 'node-cron';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';

const NOTIFICATION_RETENTION_DAYS = 30;
let cleanupSchedulerStarted = false;

export const startNotificationCleanup = () => {
  if (cleanupSchedulerStarted) {
    return;
  }

  cleanupSchedulerStarted = true;
  cron.schedule('0 3 * * *', async () => {
    try {
      const cutoffDate = new Date(
        Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000
      );

      await prisma.notification.deleteMany({
        where: {
          read: true,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
    } catch (error) {
      console.error('[notification-cleanup] Failed to cleanup notifications', error);
    }
  });
};

export class NotificationService {
  async getUserNotifications(userId: string) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    if (notification.read) {
      return notification;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async createNotification(userId: string, message: string) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        message,
      },
    });

    return notification;
  }
}
