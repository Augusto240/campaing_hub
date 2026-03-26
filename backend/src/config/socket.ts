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

type TabletopToken = {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  size: number;
};

type CampaignTabletopState = {
  mapImageUrl: string | null;
  gridSize: number;
  tokens: TabletopToken[];
  updatedAt: string;
  updatedBy: string;
};

type TabletopUpdatePayload = {
  campaignId: string;
  mapImageUrl?: string | null;
  gridSize?: number;
  tokens?: TabletopToken[];
};

type CampaignSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  { user: SocketUser; joinedCampaignIds: Set<string> }
>;

const campaignPresence = new Map<string, Map<string, number>>();
const tabletopStateByCampaign = new Map<string, CampaignTabletopState>();

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const sanitizeTokens = (tokens: TabletopToken[]): TabletopToken[] => {
  return tokens.slice(0, 150).map((token) => ({
    id: String(token.id || '').slice(0, 64),
    label: String(token.label || 'Token').slice(0, 60),
    x: clamp(Number.isFinite(token.x) ? token.x : 0, 0, 5000),
    y: clamp(Number.isFinite(token.y) ? token.y : 0, 0, 5000),
    color: String(token.color || '#c9a84c').slice(0, 20),
    size: clamp(Number.isFinite(token.size) ? token.size : 56, 24, 160),
  }));
};

const getOrCreateTabletopState = (campaignId: string, userId: string): CampaignTabletopState => {
  const existing = tabletopStateByCampaign.get(campaignId);
  if (existing) {
    return existing;
  }

  const initialState: CampaignTabletopState = {
    mapImageUrl: null,
    gridSize: 56,
    tokens: [],
    updatedAt: new Date().toISOString(),
    updatedBy: userId,
  };

  tabletopStateByCampaign.set(campaignId, initialState);
  return initialState;
};

const emitTabletopState = (io: SocketServer, campaignId: string): void => {
  const state = tabletopStateByCampaign.get(campaignId);
  if (!state) {
    return;
  }

  io.to(`campaign:${campaignId}`).emit('campaign:tabletop:state', {
    campaignId,
    state,
  });
};

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

    typedSocket.on('campaign:tabletop:request', (campaignId: string) => {
      if (!typedSocket.data.joinedCampaignIds.has(campaignId)) {
        return;
      }

      const state = getOrCreateTabletopState(campaignId, typedSocket.data.user.id);
      (typedSocket as unknown as Socket).emit('campaign:tabletop:state', {
        campaignId,
        state,
      });
    });

    typedSocket.on('campaign:tabletop:update', (payload: TabletopUpdatePayload) => {
      const campaignId = String(payload?.campaignId || '');
      if (!campaignId || !typedSocket.data.joinedCampaignIds.has(campaignId)) {
        return;
      }

      const currentState = getOrCreateTabletopState(campaignId, typedSocket.data.user.id);
      const nextState: CampaignTabletopState = {
        mapImageUrl:
          payload.mapImageUrl === undefined
            ? currentState.mapImageUrl
            : payload.mapImageUrl
              ? String(payload.mapImageUrl).slice(0, 500)
              : null,
        gridSize:
          payload.gridSize === undefined
            ? currentState.gridSize
            : clamp(Math.round(payload.gridSize), 24, 120),
        tokens: payload.tokens === undefined ? currentState.tokens : sanitizeTokens(payload.tokens),
        updatedAt: new Date().toISOString(),
        updatedBy: typedSocket.data.user.id,
      };

      tabletopStateByCampaign.set(campaignId, nextState);
      emitTabletopState(io, campaignId);
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
