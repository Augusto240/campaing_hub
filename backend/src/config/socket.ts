import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../modules/auth/auth.service';
import { logger } from './logger';
import { setSocketServer } from './realtime';

type SocketUser = {
  id: string;
  email: string;
  role: string;
};

type CampaignSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  { user: SocketUser; joinedCampaignIds: Set<string> }
>;

const campaignPresence = new Map<string, Map<string, number>>();

const serializePresence = (campaignId: string): string[] => {
  return Array.from(campaignPresence.get(campaignId)?.keys() ?? []);
};

const emitPresenceUpdate = (io: SocketServer, campaignId: string): void => {
  io.to(`campaign:${campaignId}`).emit('presence:update', {
    campaignId,
    onlineUserIds: serializePresence(campaignId),
  });
};

const joinPresence = (campaignId: string, userId: string): void => {
  const users = campaignPresence.get(campaignId) ?? new Map<string, number>();
  users.set(userId, (users.get(userId) ?? 0) + 1);
  campaignPresence.set(campaignId, users);
};

const leavePresence = (campaignId: string, userId: string): void => {
  const users = campaignPresence.get(campaignId);
  if (!users) {
    return;
  }

  const currentCount = users.get(userId);
  if (!currentCount) {
    return;
  }

  if (currentCount === 1) {
    users.delete(userId);
  } else {
    users.set(userId, currentCount - 1);
  }

  if (users.size === 0) {
    campaignPresence.delete(campaignId);
  }
};

export function setupSocket(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:4200',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const rawToken = socket.handshake.auth.token;
      const token = typeof rawToken === 'string' ? rawToken : '';
      const user = await verifyAccessToken(token);

      (socket as CampaignSocket).data.user = user;
      (socket as CampaignSocket).data.joinedCampaignIds = new Set();
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const typedSocket = socket as CampaignSocket;
    logger.info({ userId: typedSocket.data.user.id }, '[socket] user connected');

    typedSocket.on('campaign:join', (campaignId: string) => {
      typedSocket.join(`campaign:${campaignId}`);
      typedSocket.data.joinedCampaignIds.add(campaignId);
      joinPresence(campaignId, typedSocket.data.user.id);
      emitPresenceUpdate(io, campaignId);
      logger.info({ userId: typedSocket.data.user.id, campaignId }, '[socket] joined campaign room');
    });

    typedSocket.on('campaign:leave', (campaignId: string) => {
      typedSocket.leave(`campaign:${campaignId}`);

      if (typedSocket.data.joinedCampaignIds.has(campaignId)) {
        typedSocket.data.joinedCampaignIds.delete(campaignId);
        leavePresence(campaignId, typedSocket.data.user.id);
        emitPresenceUpdate(io, campaignId);
      }
    });

    typedSocket.on('disconnect', () => {
      typedSocket.data.joinedCampaignIds.forEach((campaignId) => {
        leavePresence(campaignId, typedSocket.data.user.id);
        emitPresenceUpdate(io, campaignId);
      });

      logger.info({ userId: typedSocket.data.user.id }, '[socket] user disconnected');
    });
  });

  setSocketServer(io);
  return io;
}
