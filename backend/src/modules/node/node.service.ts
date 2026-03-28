import { CoreEntityType, CoreRelationType, Prisma, WikiBlockType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../../config/database';
import { emitCampaignEvent } from '../../config/realtime';
import { deleteCacheByPattern, deleteCacheValue, withCache } from '../../config/redis';
import { AppError } from '../../utils/error-handler';
import {
  NodeAttachCharacterInput,
  NodeBlocksInput,
  NodeCreateInput,
  NodeCreateWikiPageInput,
  NodeLinkInput,
  NodeListInput,
  NodeReplaceBlocksInput,
} from './node.types';

type CampaignContext = {
  campaignId: string;
  isGm: boolean;
};

type JsonRecord = Record<string, unknown>;

const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeKey = (value: string): string => value.trim().toLowerCase();

const normalizeNodeType = (value: string): string => value.trim().toUpperCase().replace(/\s+/g, '_');

const hasLegacyCanonMarker = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return normalized.includes('augustus frostborne') || normalized.includes('satoru naitokira');
};

const parseWikiLinks = (content: string): string[] => {
  const links = new Map<string, string>();

  const matches = content.matchAll(WIKI_LINK_PATTERN);
  for (const match of matches) {
    const title = String(match[1] ?? '').trim();
    if (!title) {
      continue;
    }

    const key = normalizeKey(title);
    if (!links.has(key)) {
      links.set(key, title);
    }
  }

  return [...links.values()];
};

const toContentRecord = (value: Prisma.JsonValue | null | undefined): JsonRecord => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as JsonRecord;
};

const resolveCoreEntityType = (nodeType: string): CoreEntityType => {
  const normalized = normalizeNodeType(nodeType);

  switch (normalized) {
    case 'WIKI_PAGE':
    case 'PAGE':
      return 'PAGE';
    case 'CHARACTER':
      return 'CHARACTER';
    case 'SESSION':
      return 'SESSION';
    case 'COMPENDIUM_ENTRY':
      return 'COMPENDIUM_ENTRY';
    case 'VTT_TOKEN':
      return 'VTT_TOKEN';
    default:
      return 'LEGACY_ANCHOR';
  }
};

const resolveCoreRelationType = (relationType: string): CoreRelationType => {
  const normalized = normalizeNodeType(relationType);

  switch (normalized) {
    case 'PARENT_CHILD':
    case 'PARENT_OF':
      return 'PARENT_OF';
    case 'WIKI_LINK':
    case 'LINKS_TO':
      return 'LINKS_TO';
    case 'REFERENCES':
      return 'REFERENCES';
    case 'CHARACTER_IN_NODE':
    case 'APPEARS_IN':
      return 'APPEARS_IN';
    case 'LOCATED_IN':
      return 'LOCATED_IN';
    default:
      return 'REFERENCES';
  }
};

const resolveWikiPageIdFromNode = (node: {
  sourceId: string;
  content: Prisma.JsonValue | null;
}): string | null => {
  if (UUID_PATTERN.test(node.sourceId)) {
    return node.sourceId;
  }

  const content = toContentRecord(node.content);
  const contentWikiPageId = content.wikiPageId;

  if (typeof contentWikiPageId === 'string' && UUID_PATTERN.test(contentWikiPageId)) {
    return contentWikiPageId;
  }

  return null;
};

const mergeContent = (baseValue: Prisma.JsonValue | null, nextValue: JsonRecord): Prisma.InputJsonValue => {
  const base = toContentRecord(baseValue);
  return {
    ...base,
    ...nextValue,
  } as Prisma.InputJsonValue;
};

export class NodeService {
  private async resolveCampaignContext(campaignId: string, userId: string): Promise<CampaignContext> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: {
            userId,
          },
          select: {
            role: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    const isMember = campaign.ownerId === userId || campaign.members.length > 0;
    if (!isMember) {
      throw new AppError(403, 'You are not a member of this campaign');
    }

    return {
      campaignId: campaign.id,
      isGm: campaign.ownerId === userId || campaign.members.some((member) => member.role === 'GM'),
    };
  }

  private async invalidateNodeCache(campaignId: string): Promise<void> {
    await Promise.all([
      deleteCacheByPattern(`node:${campaignId}:*`),
      deleteCacheByPattern(`core:${campaignId}:*`),
      deleteCacheByPattern(`campaign:${campaignId}:wiki*`),
      deleteCacheValue(`campaign:${campaignId}:vtt-state`),
    ]);
  }

  private async upsertNodeRelation(input: {
    tx: Prisma.TransactionClient;
    campaignId: string;
    fromId: string;
    toId: string;
    type: string;
    metadata?: JsonRecord;
  }) {
    const relationType = normalizeNodeType(input.type);

    const relation = await input.tx.nodeRelation.upsert({
      where: {
        fromId_toId_type: {
          fromId: input.fromId,
          toId: input.toId,
          type: relationType,
        },
      },
      update: {},
      create: {
        fromId: input.fromId,
        toId: input.toId,
        type: relationType,
      },
    });

    await input.tx.coreRelation.upsert({
      where: {
        campaignId_relationType_sourceNodeId_targetNodeId: {
          campaignId: input.campaignId,
          relationType: resolveCoreRelationType(relationType),
          sourceNodeId: input.fromId,
          targetNodeId: input.toId,
        },
      },
      update: {
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
      create: {
        campaignId: input.campaignId,
        relationType: resolveCoreRelationType(relationType),
        sourceNodeId: input.fromId,
        targetNodeId: input.toId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    return relation;
  }

  async createNode(input: NodeCreateInput) {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);
    if (!context.isGm) {
      throw new AppError(403, 'Only GM can create nodes');
    }

    const normalizedType = normalizeNodeType(input.type);
    const sourceId = input.sourceId ?? randomUUID();

    const existing = await prisma.node.findUnique({
      where: {
        campaignId_entityType_sourceId: {
          campaignId: context.campaignId,
          entityType: resolveCoreEntityType(normalizedType),
          sourceId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new AppError(409, 'Node with same source already exists in this campaign');
    }

    const created = await prisma.node.create({
      data: {
        campaignId: context.campaignId,
        type: normalizedType,
        title: input.title,
        content: input.content ? (input.content as Prisma.InputJsonValue) : Prisma.JsonNull,
        entityType: resolveCoreEntityType(normalizedType),
        sourceId,
        label: input.title,
        pageId: input.pageId,
        legacyAnchor: input.legacyAnchor ?? hasLegacyCanonMarker(input.title),
        metadata: (input.metadata ?? input.content ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.invalidateNodeCache(context.campaignId);
    emitCampaignEvent(context.campaignId, 'node:created', {
      nodeId: created.id,
      type: created.type,
      title: created.title,
    });

    return created;
  }

  async listCampaignNodes(input: NodeListInput) {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);
    const safeLimit = Math.min(Math.max(input.limit ?? 80, 1), 250);
    const normalizedType = input.type ? normalizeNodeType(input.type) : undefined;

    const cacheKey = `node:${context.campaignId}:list:${normalizedType ?? 'ALL'}:${safeLimit}`;

    return withCache(cacheKey, 45, async () => {
      const nodes = await prisma.node.findMany({
        where: {
          campaignId: context.campaignId,
          ...(normalizedType ? { type: normalizedType } : {}),
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: safeLimit,
      });

      return {
        campaignId: context.campaignId,
        total: nodes.length,
        nodes,
      };
    });
  }

  async linkNodes(input: NodeLinkInput) {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);
    if (!context.isGm) {
      throw new AppError(403, 'Only GM can create node relations');
    }

    const [fromNode, toNode] = await Promise.all([
      prisma.node.findFirst({
        where: {
          id: input.fromId,
          campaignId: context.campaignId,
        },
      }),
      prisma.node.findFirst({
        where: {
          id: input.toId,
          campaignId: context.campaignId,
        },
      }),
    ]);

    if (!fromNode || !toNode) {
      throw new AppError(404, 'Source or target node not found in campaign');
    }

    const relation = await prisma.$transaction((tx) =>
      this.upsertNodeRelation({
        tx,
        campaignId: context.campaignId,
        fromId: fromNode.id,
        toId: toNode.id,
        type: input.type,
        metadata: input.metadata,
      })
    );

    await this.invalidateNodeCache(context.campaignId);
    emitCampaignEvent(context.campaignId, 'node:relation_upserted', {
      relationId: relation.id,
      type: relation.type,
      fromId: relation.fromId,
      toId: relation.toId,
    });

    return relation;
  }

  async createWikiNode(input: NodeCreateWikiPageInput) {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);
    if (!context.isGm) {
      throw new AppError(403, 'Only GM can create wiki-backed nodes');
    }

    const created = await prisma.$transaction(async (tx) => {
      if (input.parentWikiPageId) {
        const parentWikiPage = await tx.wikiPage.findUnique({
          where: { id: input.parentWikiPageId },
          select: { id: true, campaignId: true },
        });

        if (!parentWikiPage || parentWikiPage.campaignId !== context.campaignId) {
          throw new AppError(400, 'Parent wiki page must belong to the same campaign');
        }
      }

      const wikiPage = await tx.wikiPage.create({
        data: {
          campaignId: context.campaignId,
          parentPageId: input.parentWikiPageId,
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags ?? [],
          isPublic: input.isPublic ?? true,
          createdBy: input.userId,
        },
      });

      const blocks = input.blocks ?? [];
      if (blocks.length > 0) {
        await tx.wikiBlock.createMany({
          data: blocks.map((block, index) => ({
            wikiPageId: wikiPage.id,
            blockType: block.blockType,
            sortOrder: index,
            payload: block.payload as Prisma.InputJsonValue,
          })),
        });
      }

      const nodeContent: JsonRecord = {
        wikiPageId: wikiPage.id,
        category: wikiPage.category,
        tags: wikiPage.tags,
        blocksCount: blocks.length,
      };

      const node = await tx.node.upsert({
        where: {
          campaignId_entityType_sourceId: {
            campaignId: context.campaignId,
            entityType: 'PAGE',
            sourceId: wikiPage.id,
          },
        },
        update: {
          type: 'WIKI_PAGE',
          title: wikiPage.title,
          content: nodeContent as Prisma.InputJsonValue,
          label: wikiPage.title,
          legacyAnchor: hasLegacyCanonMarker(`${wikiPage.title} ${wikiPage.content}`),
          metadata: {
            category: wikiPage.category,
            tags: wikiPage.tags,
          },
        },
        create: {
          campaignId: context.campaignId,
          type: 'WIKI_PAGE',
          title: wikiPage.title,
          content: nodeContent as Prisma.InputJsonValue,
          entityType: 'PAGE',
          sourceId: wikiPage.id,
          label: wikiPage.title,
          legacyAnchor: hasLegacyCanonMarker(`${wikiPage.title} ${wikiPage.content}`),
          metadata: {
            category: wikiPage.category,
            tags: wikiPage.tags,
          },
        },
      });

      if (input.parentNodeId) {
        const parentNode = await tx.node.findFirst({
          where: {
            id: input.parentNodeId,
            campaignId: context.campaignId,
          },
          select: {
            id: true,
          },
        });

        if (!parentNode) {
          throw new AppError(400, 'Parent node not found in campaign');
        }

        await this.upsertNodeRelation({
          tx,
          campaignId: context.campaignId,
          fromId: parentNode.id,
          toId: node.id,
          type: 'PARENT_CHILD',
          metadata: { relation: 'hierarchy' },
        });
      }

      const linkedTitles = parseWikiLinks(wikiPage.content);
      let linksCreated = 0;

      if (linkedTitles.length > 0) {
        const linkedPages = await tx.wikiPage.findMany({
          where: {
            campaignId: context.campaignId,
            OR: linkedTitles.map((title) => ({
              title: {
                equals: title,
                mode: 'insensitive',
              },
            })),
          },
          select: {
            id: true,
            title: true,
            content: true,
            category: true,
            tags: true,
          },
          take: 30,
        });

        for (const linkedPage of linkedPages) {
          if (linkedPage.id === wikiPage.id) {
            continue;
          }

          const linkedNode = await tx.node.upsert({
            where: {
              campaignId_entityType_sourceId: {
                campaignId: context.campaignId,
                entityType: 'PAGE',
                sourceId: linkedPage.id,
              },
            },
            update: {
              type: 'WIKI_PAGE',
              title: linkedPage.title,
              content: {
                wikiPageId: linkedPage.id,
                category: linkedPage.category,
                tags: linkedPage.tags,
              },
              label: linkedPage.title,
            },
            create: {
              campaignId: context.campaignId,
              type: 'WIKI_PAGE',
              title: linkedPage.title,
              content: {
                wikiPageId: linkedPage.id,
                category: linkedPage.category,
                tags: linkedPage.tags,
              },
              entityType: 'PAGE',
              sourceId: linkedPage.id,
              label: linkedPage.title,
              legacyAnchor: hasLegacyCanonMarker(`${linkedPage.title} ${linkedPage.content}`),
              metadata: {
                category: linkedPage.category,
                tags: linkedPage.tags,
              },
            },
          });

          await this.upsertNodeRelation({
            tx,
            campaignId: context.campaignId,
            fromId: node.id,
            toId: linkedNode.id,
            type: 'WIKI_LINK',
            metadata: { relation: 'wiki-link' },
          });

          linksCreated += 1;
        }
      }

      return {
        wikiPage,
        node,
        linksCreated,
      };
    });

    await this.invalidateNodeCache(context.campaignId);
    emitCampaignEvent(context.campaignId, 'node:wiki_created', {
      nodeId: created.node.id,
      pageId: created.wikiPage.id,
      title: created.wikiPage.title,
    });

    return created;
  }

  async attachCharacterToNode(input: NodeAttachCharacterInput) {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);
    if (!context.isGm) {
      throw new AppError(403, 'Only GM can link characters to nodes');
    }

    const result = await prisma.$transaction(async (tx) => {
      const [targetNode, character] = await Promise.all([
        tx.node.findFirst({
          where: {
            id: input.targetNodeId,
            campaignId: context.campaignId,
          },
        }),
        tx.character.findUnique({
          where: { id: input.characterId },
          select: {
            id: true,
            campaignId: true,
            name: true,
            class: true,
            level: true,
          },
        }),
      ]);

      if (!targetNode) {
        throw new AppError(404, 'Target node not found in campaign');
      }

      if (!character || character.campaignId !== context.campaignId) {
        throw new AppError(404, 'Character not found in campaign');
      }

      const characterNode = await tx.node.upsert({
        where: {
          campaignId_entityType_sourceId: {
            campaignId: context.campaignId,
            entityType: 'CHARACTER',
            sourceId: character.id,
          },
        },
        update: {
          type: 'CHARACTER',
          title: character.name,
          content: {
            characterId: character.id,
            class: character.class,
            level: character.level,
          },
          label: character.name,
          metadata: {
            class: character.class,
            level: character.level,
          },
        },
        create: {
          campaignId: context.campaignId,
          type: 'CHARACTER',
          title: character.name,
          content: {
            characterId: character.id,
            class: character.class,
            level: character.level,
          },
          entityType: 'CHARACTER',
          sourceId: character.id,
          label: character.name,
          legacyAnchor: hasLegacyCanonMarker(character.name),
          metadata: {
            class: character.class,
            level: character.level,
          },
        },
      });

      const relation = await this.upsertNodeRelation({
        tx,
        campaignId: context.campaignId,
        fromId: characterNode.id,
        toId: targetNode.id,
        type: input.relationType ?? 'CHARACTER_IN_NODE',
        metadata: input.metadata,
      });

      return {
        characterNode,
        relation,
      };
    });

    await this.invalidateNodeCache(context.campaignId);
    emitCampaignEvent(context.campaignId, 'node:character_attached', {
      characterNodeId: result.characterNode.id,
      targetNodeId: input.targetNodeId,
      relationType: result.relation.type,
    });

    return result;
  }

  async getNodeBlocks(input: NodeBlocksInput) {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);

    const node = await prisma.node.findFirst({
      where: {
        id: input.nodeId,
        campaignId: context.campaignId,
      },
      select: {
        id: true,
        sourceId: true,
        content: true,
      },
    });

    if (!node) {
      throw new AppError(404, 'Node not found in campaign');
    }

    const wikiPageId = resolveWikiPageIdFromNode(node);
    if (!wikiPageId) {
      throw new AppError(400, 'Node is not linked to a wiki page');
    }

    const wikiPage = await prisma.wikiPage.findUnique({
      where: { id: wikiPageId },
      select: {
        id: true,
        campaignId: true,
      },
    });

    if (!wikiPage || wikiPage.campaignId !== context.campaignId) {
      throw new AppError(404, 'Wiki page not found for this campaign');
    }

    const blocks = await prisma.wikiBlock.findMany({
      where: {
        wikiPageId,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return {
      nodeId: node.id,
      wikiPageId,
      blocks,
    };
  }

  async replaceNodeBlocks(input: NodeReplaceBlocksInput) {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);
    if (!context.isGm) {
      throw new AppError(403, 'Only GM can replace node blocks');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const node = await tx.node.findFirst({
        where: {
          id: input.nodeId,
          campaignId: context.campaignId,
        },
        select: {
          id: true,
          sourceId: true,
          content: true,
          metadata: true,
        },
      });

      if (!node) {
        throw new AppError(404, 'Node not found in campaign');
      }

      const wikiPageId = resolveWikiPageIdFromNode(node);
      if (!wikiPageId) {
        throw new AppError(400, 'Node is not linked to a wiki page');
      }

      const wikiPage = await tx.wikiPage.findUnique({
        where: { id: wikiPageId },
        select: {
          id: true,
          campaignId: true,
        },
      });

      if (!wikiPage || wikiPage.campaignId !== context.campaignId) {
        throw new AppError(404, 'Wiki page not found for this campaign');
      }

      await tx.wikiBlock.deleteMany({
        where: {
          wikiPageId,
        },
      });

      if (input.blocks.length > 0) {
        await tx.wikiBlock.createMany({
          data: input.blocks.map((block, index) => ({
            wikiPageId,
            blockType: block.blockType as WikiBlockType,
            sortOrder: index,
            payload: block.payload as Prisma.InputJsonValue,
          })),
        });
      }

      const contentPatch: JsonRecord = {
        wikiPageId,
        blocksCount: input.blocks.length,
      };

      const metadataPatch: JsonRecord = {
        ...toContentRecord(node.metadata),
        blocksCount: input.blocks.length,
      };

      await tx.node.update({
        where: {
          id: node.id,
        },
        data: {
          content: mergeContent(node.content, contentPatch),
          metadata: metadataPatch as Prisma.InputJsonValue,
        },
      });

      const blocks = await tx.wikiBlock.findMany({
        where: {
          wikiPageId,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      return {
        nodeId: node.id,
        wikiPageId,
        totalBlocks: blocks.length,
        blocks,
      };
    });

    await this.invalidateNodeCache(context.campaignId);
    emitCampaignEvent(context.campaignId, 'node:blocks_replaced', {
      nodeId: updated.nodeId,
      wikiPageId: updated.wikiPageId,
      totalBlocks: updated.totalBlocks,
    });

    return updated;
  }
}
