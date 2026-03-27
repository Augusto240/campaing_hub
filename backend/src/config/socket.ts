import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
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

type VttTokenPayload = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  hp: number | null;
  maxHp: number | null;
  initiative: number | null;
  characterId?: string;
  imageUrl?: string;
};

type VttTokenUpsertEvent = {
  campaignId: string;
  token: VttTokenPayload;
};

type VttChatIncomingKind = 'chat' | 'system' | 'dice';

type VttChatIncomingEvent = {
  campaignId: string;
  text: string;
  kind?: VttChatIncomingKind;
};

type VttChatOutgoingEvent = {
  campaignId: string;
  message: {
    id: string;
    authorId: string;
    authorName: string;
    text: string;
    kind: VttChatIncomingKind;
    createdAt: string;
  };
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const asString = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
};

const clampPercent = (value: number): number => {
  return Math.min(95, Math.max(5, value));
};

const parseTokenUpsertEvent = (value: unknown): VttTokenUpsertEvent | null => {
  const payload = asRecord(value);
  if (!payload) {
    return null;
  }

  const campaignId = asString(payload['campaignId']);
  const tokenRaw = asRecord(payload['token']);

  if (!campaignId || !tokenRaw) {
    return null;
  }

  const id = asString(tokenRaw['id']);
  const name = asString(tokenRaw['name']);
  const color = asString(tokenRaw['color']);
  const x = asNumber(tokenRaw['x']);
  const y = asNumber(tokenRaw['y']);

  if (!id || !name || !color || x === null || y === null) {
    return null;
  }

  const hpRaw = tokenRaw['hp'];
  const maxHpRaw = tokenRaw['maxHp'];
  const initiativeRaw = tokenRaw['initiative'];
  const characterIdRaw = tokenRaw['characterId'];
  const imageUrlRaw = tokenRaw['imageUrl'];

  const hp = hpRaw === null ? null : asNumber(hpRaw);
  const maxHp = maxHpRaw === null ? null : asNumber(maxHpRaw);
  const initiative = initiativeRaw === null ? null : asNumber(initiativeRaw);
  const characterId = characterIdRaw === undefined ? undefined : asString(characterIdRaw);
  const imageUrl = imageUrlRaw === undefined ? undefined : asString(imageUrlRaw);

  if (hpRaw !== null && hp === null) {
    return null;
  }

  if (maxHpRaw !== null && maxHp === null) {
    return null;
  }

  if (initiativeRaw !== null && initiative === null) {
    return null;
  }

  return {
    campaignId,
    token: {
      id,
      name,
      color,
      x: clampPercent(x),
      y: clampPercent(y),
      hp,
      maxHp,
      initiative,
      ...(characterId ? { characterId } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    },
  };
};

const parseChatIncomingEvent = (value: unknown): VttChatIncomingEvent | null => {
  const payload = asRecord(value);
  if (!payload) {
    return null;
  }

  const campaignId = asString(payload['campaignId']);
  const text = asString(payload['text']);
  const kindRaw = payload['kind'];
  const kind: VttChatIncomingKind =
    kindRaw === 'system' || kindRaw === 'dice' ? kindRaw : 'chat';

  if (!campaignId || !text) {
    return null;
  }

  return {
    campaignId,
    text,
    kind,
  };
};

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

<<<<<<< HEAD
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
=======
    typedSocket.on('vtt:token:upsert', (payload: unknown) => {
      const parsed = parseTokenUpsertEvent(payload);

      if (!parsed || !typedSocket.data.joinedCampaignIds.has(parsed.campaignId)) {
        return;
      }

      io.to(`campaign:${parsed.campaignId}`).emit('vtt:token:upsert', parsed);
    });

    typedSocket.on('vtt:chat:message', (payload: unknown) => {
      const parsed = parseChatIncomingEvent(payload);

      if (!parsed || !typedSocket.data.joinedCampaignIds.has(parsed.campaignId)) {
        return;
      }

      const outgoing: VttChatOutgoingEvent = {
        campaignId: parsed.campaignId,
        message: {
          id: randomUUID(),
          authorId: typedSocket.data.user.id,
          authorName: typedSocket.data.user.email,
          text: parsed.text,
          kind: parsed.kind ?? 'chat',
          createdAt: new Date().toISOString(),
        },
      };

      io.to(`campaign:${parsed.campaignId}`).emit('vtt:chat:message', outgoing);
>>>>>>> bd47dd9da94ef8cb6fed9c2db135d6dcdeef18bd
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
