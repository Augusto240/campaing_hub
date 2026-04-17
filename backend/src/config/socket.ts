import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import { verifyAccessToken } from '../modules/auth/auth.service';
import { resolveCampaignAccess } from '../modules/campaigns/campaign-access.service';
import { logger } from './logger';
import { setSocketServer } from './realtime';
import {
  CampaignTabletopState,
  TabletopLightSource,
  TabletopStatePatch,
  buildNextTabletopState,
  createInitialTabletopState,
} from './tabletop-state';

type SocketUser = {
  id: string;
  email: string;
  role: string;
};

type CampaignSocketErrorCode = 'CAMPAIGN_FORBIDDEN' | 'GM_REQUIRED' | 'INVALID_PAYLOAD';

type TabletopUpdatePayload = TabletopStatePatch & {
  campaignId: string;
};

type CampaignSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  { user: SocketUser; joinedCampaigns: Map<string, { isGM: boolean }> }
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

type TabletopLightUpsertPayload = {
  campaignId: string;
  light: TabletopLightSource;
};

type TabletopFogPatchPayload = {
  campaignId: string;
  fog: TabletopStatePatch['fog'];
};

type CampaignJoinedEvent = {
  campaignId: string;
  isGM: boolean;
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

const emitCampaignSocketError = (
  socket: Socket,
  payload: { campaignId?: string; code: CampaignSocketErrorCode; message: string }
): void => {
  socket.emit('campaign:error', payload);
};

const emitCampaignJoined = (
  socket: Socket,
  payload: CampaignJoinedEvent
): void => {
  socket.emit('campaign:joined', payload);
};

const requireCampaignAccess = (
  socket: CampaignSocket,
  campaignIdRaw: unknown,
  options?: {
    requireGM?: boolean;
    invalidMessage?: string;
  }
): { campaignId: string; access: { isGM: boolean } } | null => {
  const campaignId = asString(campaignIdRaw);
  if (!campaignId) {
    emitCampaignSocketError(socket, {
      code: 'INVALID_PAYLOAD',
      message: options?.invalidMessage ?? 'Campaign payload is invalid',
    });
    return null;
  }

  const access = socket.data.joinedCampaigns.get(campaignId);
  if (!access) {
    emitCampaignSocketError(socket, {
      campaignId,
      code: 'CAMPAIGN_FORBIDDEN',
      message: 'You are not allowed to access this campaign',
    });
    return null;
  }

  if (options?.requireGM && !access.isGM) {
    emitCampaignSocketError(socket, {
      campaignId,
      code: 'GM_REQUIRED',
      message: 'Only the GM can mutate the tabletop state',
    });
    return null;
  }

  return {
    campaignId,
    access,
  };
};

const getOrCreateTabletopState = (campaignId: string, userId: string): CampaignTabletopState => {
  const existing = tabletopStateByCampaign.get(campaignId);
  if (existing) {
    return existing;
  }

  const initialState = createInitialTabletopState(userId);

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
      (socket as CampaignSocket).data.joinedCampaigns = new Map();
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const typedSocket = socket as CampaignSocket;
    logger.info({ userId: typedSocket.data.user.id }, '[socket] user connected');

    typedSocket.on('campaign:join', async (campaignIdRaw: string) => {
      const campaignId = asString(campaignIdRaw);
      if (!campaignId) {
        emitCampaignSocketError(typedSocket, {
          code: 'INVALID_PAYLOAD',
          message: 'Campaign ID is required',
        });
        return;
      }

      try {
        const access = await resolveCampaignAccess(campaignId, typedSocket.data.user.id);
        if (!access) {
          logger.warn(
            { userId: typedSocket.data.user.id, campaignId },
            '[socket] denied campaign room join'
          );
          emitCampaignSocketError(typedSocket, {
            campaignId,
            code: 'CAMPAIGN_FORBIDDEN',
            message: 'You are not allowed to access this campaign',
          });
          return;
        }

        const alreadyJoined = typedSocket.data.joinedCampaigns.has(campaignId);
        typedSocket.join(`campaign:${campaignId}`);
        typedSocket.data.joinedCampaigns.set(campaignId, { isGM: access.isGM });
        if (!alreadyJoined) {
          joinPresence(campaignId, typedSocket.data.user.id);
        }
        emitPresenceUpdate(io, campaignId);
        emitCampaignJoined(typedSocket, {
          campaignId,
          isGM: access.isGM,
        });
        logger.info({ userId: typedSocket.data.user.id, campaignId }, '[socket] joined campaign room');
      } catch (err) {
        logger.error({ err, userId: typedSocket.data.user.id, campaignId }, '[socket] join failed');
        emitCampaignSocketError(typedSocket, {
          campaignId,
          code: 'CAMPAIGN_FORBIDDEN',
          message: 'Unable to join campaign room',
        });
      }
    });

    typedSocket.on('campaign:leave', (campaignIdRaw: string) => {
      const campaignId = asString(campaignIdRaw);
      if (!campaignId) {
        return;
      }

      typedSocket.leave(`campaign:${campaignId}`);

      if (typedSocket.data.joinedCampaigns.has(campaignId)) {
        typedSocket.data.joinedCampaigns.delete(campaignId);
        leavePresence(campaignId, typedSocket.data.user.id);
        emitPresenceUpdate(io, campaignId);
      }
    });

    typedSocket.on('campaign:tabletop:request', (campaignIdRaw: string) => {
      const campaign = requireCampaignAccess(typedSocket, campaignIdRaw, {
        invalidMessage: 'Campaign ID is required to request tabletop state',
      });
      if (!campaign) {
        return;
      }

      const state = getOrCreateTabletopState(campaign.campaignId, typedSocket.data.user.id);
      (typedSocket as unknown as Socket).emit('campaign:tabletop:state', {
        campaignId: campaign.campaignId,
        state,
      });
    });

    typedSocket.on('campaign:tabletop:update', (payload: TabletopUpdatePayload) => {
      const campaign = requireCampaignAccess(typedSocket, payload?.campaignId, {
        requireGM: true,
        invalidMessage: 'Campaign ID is required to update the tabletop state',
      });
      if (!campaign) {
        return;
      }

      const currentState = getOrCreateTabletopState(campaign.campaignId, typedSocket.data.user.id);
      const nextState = buildNextTabletopState(currentState, payload, typedSocket.data.user.id);

      tabletopStateByCampaign.set(campaign.campaignId, nextState);
      emitTabletopState(io, campaign.campaignId);
    });

    typedSocket.on('campaign:tabletop:fog', (payload: TabletopFogPatchPayload) => {
      const campaign = requireCampaignAccess(typedSocket, payload?.campaignId, {
        requireGM: true,
        invalidMessage: 'Campaign ID is required to update fog of war',
      });
      if (!campaign) {
        return;
      }

      const currentState = getOrCreateTabletopState(campaign.campaignId, typedSocket.data.user.id);
      const nextState = buildNextTabletopState(
        currentState,
        {
          fog: payload.fog,
        },
        typedSocket.data.user.id
      );

      tabletopStateByCampaign.set(campaign.campaignId, nextState);
      emitTabletopState(io, campaign.campaignId);
    });

    typedSocket.on('campaign:tabletop:light:upsert', (payload: TabletopLightUpsertPayload) => {
      const campaign = requireCampaignAccess(typedSocket, payload?.campaignId, {
        requireGM: true,
        invalidMessage: 'Campaign ID is required to update a light source',
      });
      const lightId = asString(payload?.light?.id);
      if (!campaign || !lightId) {
        if (campaign && !lightId) {
          emitCampaignSocketError(typedSocket, {
            campaignId: campaign.campaignId,
            code: 'INVALID_PAYLOAD',
            message: 'Light source payload is invalid',
          });
        }
        return;
      }

      const currentState = getOrCreateTabletopState(campaign.campaignId, typedSocket.data.user.id);
      const hasLight = currentState.lights.some((light) => light.id === lightId);
      const lights = hasLight
        ? currentState.lights.map((light) => (light.id === lightId ? payload.light : light))
        : [...currentState.lights, payload.light];

      const nextState = buildNextTabletopState(
        currentState,
        {
          lights,
        },
        typedSocket.data.user.id
      );

      tabletopStateByCampaign.set(campaign.campaignId, nextState);
      emitTabletopState(io, campaign.campaignId);
    });

    typedSocket.on('campaign:tabletop:light:remove', (payload: { campaignId: string; lightId: string }) => {
      const campaign = requireCampaignAccess(typedSocket, payload?.campaignId, {
        requireGM: true,
        invalidMessage: 'Campaign ID is required to remove a light source',
      });
      const lightId = asString(payload?.lightId);
      if (!campaign || !lightId) {
        if (campaign && !lightId) {
          emitCampaignSocketError(typedSocket, {
            campaignId: campaign.campaignId,
            code: 'INVALID_PAYLOAD',
            message: 'Light removal payload is invalid',
          });
        }
        return;
      }

      const currentState = getOrCreateTabletopState(campaign.campaignId, typedSocket.data.user.id);
      const nextState = buildNextTabletopState(
        currentState,
        {
          lights: currentState.lights.filter((light) => light.id !== lightId),
        },
        typedSocket.data.user.id
      );

      tabletopStateByCampaign.set(campaign.campaignId, nextState);
      emitTabletopState(io, campaign.campaignId);
    });

    typedSocket.on('vtt:token:upsert', (payload: unknown) => {
      const parsed = parseTokenUpsertEvent(payload);
      if (!parsed) {
        emitCampaignSocketError(typedSocket, {
          code: 'INVALID_PAYLOAD',
          message: 'Token payload is invalid',
        });
        return;
      }

      const campaign = requireCampaignAccess(typedSocket, parsed.campaignId, {
        requireGM: true,
      });
      if (!campaign) {
        return;
      }

      io.to(`campaign:${parsed.campaignId}`).emit('vtt:token:upsert', parsed);
    });

    typedSocket.on('vtt:chat:message', (payload: unknown) => {
      const parsed = parseChatIncomingEvent(payload);
      if (!parsed) {
        emitCampaignSocketError(typedSocket, {
          code: 'INVALID_PAYLOAD',
          message: 'Chat payload is invalid',
        });
        return;
      }

      const campaign = requireCampaignAccess(typedSocket, parsed.campaignId);
      if (!campaign) {
        return;
      }

      const outgoing: VttChatOutgoingEvent = {
        campaignId: campaign.campaignId,
        message: {
          id: randomUUID(),
          authorId: typedSocket.data.user.id,
          authorName: typedSocket.data.user.email,
          text: parsed.text,
          kind: parsed.kind ?? 'chat',
          createdAt: new Date().toISOString(),
        },
      };

      io.to(`campaign:${campaign.campaignId}`).emit('vtt:chat:message', outgoing);
    });

    typedSocket.on('disconnect', () => {
      typedSocket.data.joinedCampaigns.forEach((_access, campaignId) => {
        leavePresence(campaignId, typedSocket.data.user.id);
        emitPresenceUpdate(io, campaignId);
      });

      logger.info({ userId: typedSocket.data.user.id }, '[socket] user disconnected');
    });
  });

  setSocketServer(io);
  return io;
}
