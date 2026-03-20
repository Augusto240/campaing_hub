import { AppError } from '../../utils/error-handler';

const mockPrisma = {
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({
  prisma: mockPrisma,
}));

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not mark another user notification as read', async () => {
    mockPrisma.notification.findFirst.mockResolvedValue(null);
    const service = new NotificationService();

    await expect(service.markAsRead('user-a', 'notif-b')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Notification not found',
    } as AppError);

    expect(mockPrisma.notification.update).not.toHaveBeenCalled();
  });
});
