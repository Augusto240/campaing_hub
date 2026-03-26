import { GridType, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';

interface CreateMapInput {
  campaignId: string;
  name: string;
  imageUrl: string;
  width?: number;
  height?: number;
  gridType?: GridType;
  gridSize?: number;
}

interface UpdateMapInput {
  mapId: string;
  name?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  gridType?: GridType;
  gridSize?: number;
  gridColor?: string;
  gridOpacity?: number;
  fogOfWar?: unknown;
  walls?: unknown;
  lights?: unknown;
  isActive?: boolean;
}

interface CreateTokenInput {
  mapId: string;
  name: string;
  imageUrl?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  characterId?: string;
  creatureId?: string;
  controlledBy?: string[];
}

interface UpdateTokenInput {
  tokenId: string;
  name?: string;
  imageUrl?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  isVisible?: boolean;
  isLocked?: boolean;
  layer?: string;
  conditions?: string[];
  hp?: number;
  maxHp?: number;
  aura?: unknown;
  vision?: unknown;
  controlledBy?: string[];
}

interface MoveTokenInput {
  tokenId: string;
  x: number;
  y: number;
  rotation?: number;
}

export class VttService {
  // === MAP OPERATIONS ===

  async getMapsByCampaign(campaignId: string) {
    return prisma.gameMap.findMany({
      where: { campaignId },
      include: {
        _count: { select: { tokens: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMap(mapId: string) {
    const map = await prisma.gameMap.findUnique({
      where: { id: mapId },
      include: {
        tokens: {
          include: {
            character: { select: { id: true, name: true, imageUrl: true } },
            creature: { select: { id: true, name: true } },
          },
          orderBy: { layer: 'asc' },
        },
      },
    });

    if (!map) {
      throw new AppError(404, 'Map not found');
    }

    return map;
  }

  async createMap(input: CreateMapInput) {
    return prisma.gameMap.create({
      data: {
        campaignId: input.campaignId,
        name: input.name,
        imageUrl: input.imageUrl,
        width: input.width ?? 1920,
        height: input.height ?? 1080,
        gridType: input.gridType ?? 'SQUARE',
        gridSize: input.gridSize ?? 50,
      },
    });
  }

  async updateMap(input: UpdateMapInput) {
    const map = await prisma.gameMap.findUnique({
      where: { id: input.mapId },
    });

    if (!map) {
      throw new AppError(404, 'Map not found');
    }

    return prisma.gameMap.update({
      where: { id: input.mapId },
      data: {
        name: input.name,
        imageUrl: input.imageUrl,
        width: input.width,
        height: input.height,
        gridType: input.gridType,
        gridSize: input.gridSize,
        gridColor: input.gridColor,
        gridOpacity: input.gridOpacity,
        fogOfWar: input.fogOfWar as Prisma.InputJsonValue,
        walls: input.walls as Prisma.InputJsonValue,
        lights: input.lights as Prisma.InputJsonValue,
        isActive: input.isActive,
      },
    });
  }

  async deleteMap(mapId: string) {
    const map = await prisma.gameMap.findUnique({
      where: { id: mapId },
    });

    if (!map) {
      throw new AppError(404, 'Map not found');
    }

    await prisma.gameMap.delete({
      where: { id: mapId },
    });
  }

  async setActiveMap(campaignId: string, mapId: string) {
    // Deactivate all maps in campaign
    await prisma.gameMap.updateMany({
      where: { campaignId },
      data: { isActive: false },
    });

    // Activate the selected map
    return prisma.gameMap.update({
      where: { id: mapId },
      data: { isActive: true },
    });
  }

  // === TOKEN OPERATIONS ===

  async createToken(input: CreateTokenInput) {
    const map = await prisma.gameMap.findUnique({
      where: { id: input.mapId },
    });

    if (!map) {
      throw new AppError(404, 'Map not found');
    }

    return prisma.mapToken.create({
      data: {
        mapId: input.mapId,
        name: input.name,
        imageUrl: input.imageUrl,
        x: input.x ?? 0,
        y: input.y ?? 0,
        width: input.width ?? 1,
        height: input.height ?? 1,
        characterId: input.characterId,
        creatureId: input.creatureId,
        controlledBy: input.controlledBy ?? [],
      },
      include: {
        character: { select: { id: true, name: true, imageUrl: true } },
        creature: { select: { id: true, name: true } },
      },
    });
  }

  async updateToken(input: UpdateTokenInput) {
    const token = await prisma.mapToken.findUnique({
      where: { id: input.tokenId },
    });

    if (!token) {
      throw new AppError(404, 'Token not found');
    }

    return prisma.mapToken.update({
      where: { id: input.tokenId },
      data: {
        name: input.name,
        imageUrl: input.imageUrl,
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height,
        rotation: input.rotation,
        isVisible: input.isVisible,
        isLocked: input.isLocked,
        layer: input.layer,
        conditions: input.conditions,
        hp: input.hp,
        maxHp: input.maxHp,
        aura: input.aura as Prisma.InputJsonValue,
        vision: input.vision as Prisma.InputJsonValue,
        controlledBy: input.controlledBy,
      },
      include: {
        character: { select: { id: true, name: true, imageUrl: true } },
        creature: { select: { id: true, name: true } },
      },
    });
  }

  async moveToken(input: MoveTokenInput) {
    return prisma.mapToken.update({
      where: { id: input.tokenId },
      data: {
        x: input.x,
        y: input.y,
        rotation: input.rotation,
      },
    });
  }

  async deleteToken(tokenId: string) {
    const token = await prisma.mapToken.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      throw new AppError(404, 'Token not found');
    }

    await prisma.mapToken.delete({
      where: { id: tokenId },
    });
  }

  async batchMoveTokens(moves: MoveTokenInput[]) {
    const updates = moves.map((move) =>
      prisma.mapToken.update({
        where: { id: move.tokenId },
        data: {
          x: move.x,
          y: move.y,
          rotation: move.rotation,
        },
      })
    );

    return prisma.$transaction(updates);
  }

  // === FOG OF WAR ===

  async revealFog(mapId: string, areas: { x: number; y: number; radius: number }[]) {
    const map = await prisma.gameMap.findUnique({
      where: { id: mapId },
    });

    if (!map) {
      throw new AppError(404, 'Map not found');
    }

    const currentFog = (map.fogOfWar as { revealed: unknown[] } | null) || { revealed: [] };
    const newRevealed = [...(currentFog.revealed || []), ...areas];

    return prisma.gameMap.update({
      where: { id: mapId },
      data: {
        fogOfWar: { revealed: newRevealed },
      },
    });
  }

  async resetFog(mapId: string) {
    return prisma.gameMap.update({
      where: { id: mapId },
      data: {
        fogOfWar: { revealed: [] },
      },
    });
  }
}
