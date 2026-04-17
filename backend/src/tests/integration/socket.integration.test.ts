import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { Server as SocketServer } from 'socket.io';
import { AuthService } from '../../modules/auth/auth.service';
import { setupSocket } from '../../config/socket';
import {
  cleanDatabase,
  createTestCampaign,
  createTestUser,
  disconnectDatabase,
  prisma,
} from './setup';
import { disconnectDatabase as disconnectAppDatabase } from '../../config/database';

type CampaignJoinedEvent = {
  campaignId: string;
  isGM: boolean;
};

type CampaignSocketErrorEvent = {
  campaignId?: string;
  code: 'CAMPAIGN_FORBIDDEN' | 'GM_REQUIRED' | 'INVALID_PAYLOAD';
  message: string;
};

type TabletopStateEvent = {
  campaignId: string;
  state: {
    gridSize: number;
  };
};

type VttChatEvent = {
  campaignId: string;
  message: {
    text: string;
    kind: 'chat' | 'system' | 'dice';
  };
};

type VttTokenEvent = {
  campaignId: string;
  token: {
    id: string;
    name: string;
  };
};

const waitForEvent = <TPayload>(
  socket: ClientSocket,
  event: string,
  timeoutMs = 2000
): Promise<TPayload> => {
  return new Promise<TPayload>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);

    socket.once(event, (payload: TPayload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
};

const expectNoEvent = (
  socket: ClientSocket,
  event: string,
  timeoutMs = 250
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const handler = () => {
      clearTimeout(timer);
      socket.off(event, handler);
      reject(new Error(`Unexpected event received: ${event}`));
    };

    const timer = setTimeout(() => {
      socket.off(event, handler);
      resolve();
    }, timeoutMs);

    socket.on(event, handler);
  });
};

const connectClient = async (baseUrl: string, token: string): Promise<ClientSocket> => {
  const client = io(baseUrl, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });

  await new Promise<void>((resolve, reject) => {
    client.once('connect', () => resolve());
    client.once('connect_error', (error) => reject(error));
  });

  return client;
};

describe('Socket Integration', () => {
  let httpServer: HttpServer;
  let ioServer: SocketServer;
  let baseUrl = '';
  const clients: ClientSocket[] = [];

  beforeEach(async () => {
    await cleanDatabase();

    httpServer = createServer();
    ioServer = setupSocket(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => resolve());
    });

    const address = httpServer.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await Promise.all(
      clients.splice(0).map(
        (client) =>
          new Promise<void>((resolve) => {
            if (!client.connected) {
              resolve();
              return;
            }

            client.once('disconnect', () => resolve());
            client.disconnect();
          })
      )
    );

    await new Promise<void>((resolve) => ioServer.close(() => resolve()));
    if (httpServer.listening) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
    await disconnectAppDatabase();
  });

  it('bloqueia intruso, libera leitura para membro e libera mutacao para GM', async () => {
    const gm = await createTestUser('gm@test.com', 'GM');
    const member = await createTestUser('member@test.com', 'Member');
    const intruder = await createTestUser('intruder@test.com', 'Intruder');
    const campaign = await createTestCampaign(gm.id);

    await prisma.campaignMember.create({
      data: {
        campaignId: campaign.id,
        userId: member.id,
        role: 'PLAYER',
      },
    });

    const authService = new AuthService();
    const gmSession = await authService.login(gm.email, 'password123');
    const memberSession = await authService.login(member.email, 'password123');
    const intruderSession = await authService.login(intruder.email, 'password123');

    const gmClient = await connectClient(baseUrl, gmSession.accessToken);
    const memberClient = await connectClient(baseUrl, memberSession.accessToken);
    const intruderClient = await connectClient(baseUrl, intruderSession.accessToken);

    clients.push(gmClient, memberClient, intruderClient);

    const gmJoinedPromise = waitForEvent<CampaignJoinedEvent>(gmClient, 'campaign:joined');
    gmClient.emit('campaign:join', campaign.id);
    await expect(gmJoinedPromise).resolves.toEqual({
      campaignId: campaign.id,
      isGM: true,
    });

    const memberJoinedPromise = waitForEvent<CampaignJoinedEvent>(memberClient, 'campaign:joined');
    memberClient.emit('campaign:join', campaign.id);
    await expect(memberJoinedPromise).resolves.toEqual({
      campaignId: campaign.id,
      isGM: false,
    });

    const intruderForbiddenPromise = waitForEvent<CampaignSocketErrorEvent>(
      intruderClient,
      'campaign:error'
    );
    intruderClient.emit('campaign:join', campaign.id);
    await expect(intruderForbiddenPromise).resolves.toMatchObject({
      campaignId: campaign.id,
      code: 'CAMPAIGN_FORBIDDEN',
    });

    intruderClient.emit('campaign:tabletop:request', campaign.id);
    await expect(expectNoEvent(intruderClient, 'campaign:tabletop:state')).resolves.toBeUndefined();

    const memberStatePromise = waitForEvent<TabletopStateEvent>(
      memberClient,
      'campaign:tabletop:state'
    );
    memberClient.emit('campaign:tabletop:request', campaign.id);
    await expect(memberStatePromise).resolves.toMatchObject({
      campaignId: campaign.id,
      state: {
        gridSize: 56,
      },
    });

    const gmChatPromise = waitForEvent<VttChatEvent>(gmClient, 'vtt:chat:message');
    memberClient.emit('vtt:chat:message', {
      campaignId: campaign.id,
      text: 'A mesa escuta?',
      kind: 'chat',
    });
    await expect(gmChatPromise).resolves.toMatchObject({
      campaignId: campaign.id,
      message: {
        text: 'A mesa escuta?',
        kind: 'chat',
      },
    });

    const memberDeniedStatePromise = waitForEvent<CampaignSocketErrorEvent>(
      memberClient,
      'campaign:error'
    );
    memberClient.emit('campaign:tabletop:update', {
      campaignId: campaign.id,
      gridSize: 80,
    });
    await expect(memberDeniedStatePromise).resolves.toMatchObject({
      campaignId: campaign.id,
      code: 'GM_REQUIRED',
    });

    const memberDeniedTokenPromise = waitForEvent<CampaignSocketErrorEvent>(
      memberClient,
      'campaign:error'
    );
    memberClient.emit('vtt:token:upsert', {
      campaignId: campaign.id,
      token: {
        id: 'token-member',
        name: 'Intruso Arcano',
        x: 30,
        y: 30,
        color: '#c9a84c',
        hp: 10,
        maxHp: 10,
        initiative: 10,
      },
    });
    await expect(memberDeniedTokenPromise).resolves.toMatchObject({
      campaignId: campaign.id,
      code: 'GM_REQUIRED',
    });

    const memberUpdatedStatePromise = waitForEvent<TabletopStateEvent>(
      memberClient,
      'campaign:tabletop:state'
    );
    gmClient.emit('campaign:tabletop:update', {
      campaignId: campaign.id,
      gridSize: 88,
    });
    await expect(memberUpdatedStatePromise).resolves.toMatchObject({
      campaignId: campaign.id,
      state: {
        gridSize: 88,
      },
    });

    const memberTokenPromise = waitForEvent<VttTokenEvent>(memberClient, 'vtt:token:upsert');
    gmClient.emit('vtt:token:upsert', {
      campaignId: campaign.id,
      token: {
        id: 'token-gm',
        name: 'Augustus Frostborne',
        x: 25,
        y: 40,
        color: '#c9a84c',
        hp: 18,
        maxHp: 18,
        initiative: 14,
      },
    });
    await expect(memberTokenPromise).resolves.toMatchObject({
      campaignId: campaign.id,
      token: {
        id: 'token-gm',
        name: 'Augustus Frostborne',
      },
    });
  });
});
