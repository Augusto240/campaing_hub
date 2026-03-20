import { z } from 'zod';

export const notificationIdParamsSchema = z.object({
  notificationId: z.string().uuid(),
});
