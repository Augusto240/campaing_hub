import {
  Prisma,
} from '@prisma/client';
import { prisma } from '../../config/database';
import { deleteCacheByPattern, deleteCacheValue } from '../../config/redis';
import { emitCampaignEvent } from '../../config/realtime';
import {
  CampaignTabletopState,
  TabletopToken,
  TabletopStatePatch,
  buildNextTabletopState,
  createInitialTabletopState,
} from '../../config/tabletop-state';
import { AppError } from '../../utils/error-handler';
import { filterCompendiumEntries } from '../compendium/compendium.data';
import { KnowledgeGraphService } from '../knowledge-graph/knowledge-graph.service';
import {
  CoreBacklinksInput,
  CoreCompendiumKind,
  CoreCompendiumSource,
  CoreCompendiumEntryDTO,
  CoreCompendiumView,
  CoreCreateHomebrewEntryInput,
  CoreCreatePageInput,
  CoreKnowledgeSearchInput,
  CoreListCompendiumInput,
  CoreUpsertPageBlocksInput,
  CoreVttPatchInput,
} from './core.types';

type CampaignContext = {
  campaignId: string;
  systemSlug: string;
  isGm: boolean;
};

type PrismaTx = any;

type StaticCompendiumKind = 'BESTIARY' | 'SPELL' | 'ITEM' | 'CLASS';

const prismaUnsafe = prisma as unknown as Record<string, any>;

const getNodeStore = (store: Record<string, any>): Record<string, any> => {
  const delegate = store.node ?? store.coreNode;
  if (!delegate) {
    throw new AppError(500, 'Node storage delegate is unavailable');
  }

  return delegate as Record<string, any>;
};

const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

const normalize = (value: string): string => value.trim().toLowerCase();

const DEFAULT_CORE_PAGE_TYPE = 'WIKI';

const toSummary = (value: string, maxLength = 220): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
};

const hasLegacyCanonMarker = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return normalized.includes('augustus frostborne') || normalized.includes('satoru naitokira');
};

const parseWikiLinks = (content: string): string[] => {
  const links = new Map<string, string>();

  const matches = content.matchAll(WIKI_LINK_PATTERN);
  for (const match of matches) {
    const title = String(match[1] || '').trim();
    if (!title) {
      continue;
    }

    const key = normalize(title);
    if (!links.has(key)) {
      links.set(key, title);
    }
  }

  return [...links.values()];
};

const toCoreCompendiumKind = (kind: StaticCompendiumKind): CoreCompendiumKind => {
  if (kind === 'BESTIARY') {
    return 'CREATURE';
  }

  if (kind === 'SPELL') {
    return 'SPELL';
  }

  return 'ITEM';
};

const toStaticCompendiumKind = (kind?: CoreCompendiumKind): StaticCompendiumKind | undefined => {
  if (kind === 'CREATURE') {
    return 'BESTIARY';
  }

  if (kind === 'SPELL') {
    return 'SPELL';
  }

  if (kind === 'ITEM') {
    return 'ITEM';
  }

  return undefined;
};

const asTabletopTokens = (value: unknown): TabletopToken[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => !!entry && typeof entry === 'object')
    .map((entry) => entry as TabletopToken);
};

const asTabletopLights = (value: unknown): CampaignTabletopState['lights'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => !!entry && typeof entry === 'object')
    .map((entry) => entry as CampaignTabletopState['lights'][number]);
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
};

export class CoreService {
  private readonly knowledgeGraphService = new KnowledgeGraphService();

  private buildSlug(title: string): string {
    return title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 90);
  }

  private async buildUniqueSlug(tx: PrismaTx, campaignId: string, title: string): Promise<string> {
    const baseSlug = this.buildSlug(title) || 'page';

    let suffix = 0;
    let candidate = baseSlug;

    while (true) {
      const found = await (tx as any).corePage.findFirst({
        where: {
          campaignId,
          slug: candidate,
        },
        select: {
          id: true,
        },
      });

      if (!found) {
        return candidate;
      }

      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  private async invalidateCoreCache(campaignId: string): Promise<void> {
    await Promise.all([
      deleteCacheByPattern(`core:${campaignId}:*`),
      deleteCacheByPattern(`campaign:${campaignId}:wiki*`),
      deleteCacheByPattern(`knowledge-graph:${campaignId}:*`),
      deleteCacheValue(`campaign:${campaignId}:vtt-state`),
    ]);
  }

  private async resolveCampaignContext(campaignId: string, userId: string): Promise<CampaignContext> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        ownerId: true,
        system: true,
        systemTemplate: {
          select: {
            slug: true,
          },
        },
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

    const isGm = campaign.ownerId === userId || campaign.members.some((member) => member.role === 'GM');

    return {
      campaignId: campaign.id,
      systemSlug: campaign.systemTemplate?.slug ?? campaign.system,
      isGm,
    };
  }

  private toCompendiumDTOFromStatic(entry: {
    id: string;
    systemSlug: string;
    kind: StaticCompendiumKind;
    source: string;
    name: string;
    summary: string;
    tags: string[];
    payload: Record<string, unknown>;
  }): CoreCompendiumEntryDTO {
    return {
      id: entry.id,
      systemSlug: entry.systemSlug,
      kind: toCoreCompendiumKind(entry.kind),
      source: entry.source === 'LEGACY' ? 'LEGACY' : 'SRD',
      name: entry.name,
      summary: entry.summary,
      tags: entry.tags,
      content: entry.payload,
      origin: 'STATIC',
    };
  }

  private toCompendiumDTOFromDb(entry: {
    id: string;
    systemSlug: string;
    kind: CoreCompendiumKind;
    source: CoreCompendiumSource;
    name: string;
    summary: string | null;
    tags: string[];
    content: Prisma.JsonValue;
  }): CoreCompendiumEntryDTO {
    return {
      id: entry.id,
      systemSlug: entry.systemSlug,
      kind: entry.kind,
      source: entry.source,
      name: entry.name,
      summary: entry.summary ?? '',
      tags: entry.tags,
      content: asRecord(entry.content),
      origin: 'CAMPAIGN',
    };
  }

  private toCompendiumView(
    campaignId: string,
    systemSlug: string,
    entries: CoreCompendiumEntryDTO[]
  ): CoreCompendiumView {
    return {
      campaignId,
      systemSlug,
      creatures: entries.filter((entry) => entry.kind === 'CREATURE'),
      spells: entries.filter((entry) => entry.kind === 'SPELL'),
      items: entries.filter((entry) => entry.kind === 'ITEM'),
    };
  }

  private mapDbVttStateToCampaignState(
    dbState: {
      mapImageUrl: string | null;
      gridSize: number;
      tokens: Prisma.JsonValue;
      fogState: Prisma.JsonValue;
      lights: Prisma.JsonValue;
      updatedBy: string;
      updatedAt: Date;
    },
    fallbackUserId: string
  ): CampaignTabletopState {
    return {
      mapImageUrl: dbState.mapImageUrl,
      gridSize: dbState.gridSize,
      tokens: asTabletopTokens(dbState.tokens),
      fog: {
        cellSize: Number(asRecord(dbState.fogState).cellSize ?? 56),
        opacity: Number(asRecord(dbState.fogState).opacity ?? 0.72),
        maskedCells: asStringArray(asRecord(dbState.fogState).maskedCells),
      },
      lights: asTabletopLights(dbState.lights),
      updatedAt: dbState.updatedAt.toISOString(),
      updatedBy: dbState.updatedBy || fallbackUserId,
    };
  }

  async createPage(input: CoreCreatePageInput) {
    await this.resolveCampaignContext(input.campaignId, input.userId);

    const created = await prisma.$transaction(async (tx: PrismaTx) => {
      if (input.parentPageId) {
        const parentPage = await tx.wikiPage.findUnique({
          where: { id: input.parentPageId },
          select: { id: true, campaignId: true },
        });

        if (!parentPage || parentPage.campaignId !== input.campaignId) {
          throw new AppError(400, 'Parent wiki page must belong to the same campaign');
        }
      }

      const wikiPage = await tx.wikiPage.create({
        data: {
          campaignId: input.campaignId,
          parentPageId: input.parentPageId,
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags,
          isPublic: input.isPublic,
          createdBy: input.userId,
        },
      });

      if (input.blocks.length > 0) {
        await (tx as any).wikiBlock.createMany({
          data: input.blocks.map((block, index) => ({
            wikiPageId: wikiPage.id,
            blockType: block.blockType,
            sortOrder: index,
            payload: block.payload as Prisma.InputJsonValue,
          })),
        });
      }

      const slug = await this.buildUniqueSlug(tx, input.campaignId, input.title);
      const corePage = await (tx as any).corePage.create({
        data: {
          campaignId: input.campaignId,
          wikiPageId: wikiPage.id,
          parentPageId: null,
          title: input.title,
          slug,
          pageType: DEFAULT_CORE_PAGE_TYPE,
          summary: toSummary(input.content),
          metadata: {
            category: input.category,
            tags: input.tags,
          },
          createdBy: input.userId,
        },
      });

      const nodeStore = getNodeStore(tx as unknown as Record<string, any>);

      const coreNode = await nodeStore.upsert({
        where: {
          campaignId_entityType_sourceId: {
            campaignId: input.campaignId,
            entityType: 'PAGE',
            sourceId: wikiPage.id,
          },
        },
        update: {
          pageId: corePage.id,
          label: wikiPage.title,
          legacyAnchor: hasLegacyCanonMarker(`${wikiPage.title} ${wikiPage.content}`),
          metadata: {
            category: wikiPage.category,
            tags: wikiPage.tags,
          },
        },
        create: {
          campaignId: input.campaignId,
          pageId: corePage.id,
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

      await tx.knowledgeNode.upsert({
        where: {
          campaignId_nodeType_sourceId: {
            campaignId: input.campaignId,
            nodeType: 'WIKI_PAGE',
            sourceId: wikiPage.id,
          },
        },
        update: {
          label: wikiPage.title,
          legacyAnchor: hasLegacyCanonMarker(`${wikiPage.title} ${wikiPage.content}`),
          metadata: {
            category: wikiPage.category,
            tags: wikiPage.tags,
          },
        },
        create: {
          campaignId: input.campaignId,
          nodeType: 'WIKI_PAGE',
          sourceId: wikiPage.id,
          label: wikiPage.title,
          legacyAnchor: hasLegacyCanonMarker(`${wikiPage.title} ${wikiPage.content}`),
          metadata: {
            category: wikiPage.category,
            tags: wikiPage.tags,
          },
        },
      });

      if (input.parentPageId) {
        const parentWikiPage = await tx.wikiPage.findUnique({
          where: { id: input.parentPageId },
          select: {
            id: true,
            title: true,
            content: true,
            category: true,
            tags: true,
          },
        });

        if (parentWikiPage) {
          const parentCorePage = await (tx as any).corePage.upsert({
            where: {
              wikiPageId: parentWikiPage.id,
            },
            update: {
              title: parentWikiPage.title,
              summary: toSummary(parentWikiPage.content),
              metadata: {
                category: parentWikiPage.category,
                tags: parentWikiPage.tags,
              },
            },
            create: {
              campaignId: input.campaignId,
              wikiPageId: parentWikiPage.id,
              parentPageId: null,
              title: parentWikiPage.title,
              slug: await this.buildUniqueSlug(tx, input.campaignId, parentWikiPage.title),
              pageType: DEFAULT_CORE_PAGE_TYPE,
              summary: toSummary(parentWikiPage.content),
              metadata: {
                category: parentWikiPage.category,
                tags: parentWikiPage.tags,
              },
              createdBy: input.userId,
            },
          });

          await (tx as any).corePage.update({
            where: { id: corePage.id },
            data: {
              parentPageId: parentCorePage.id,
            },
          });

          const parentNode = await nodeStore.upsert({
            where: {
              campaignId_entityType_sourceId: {
                campaignId: input.campaignId,
                entityType: 'PAGE',
                sourceId: parentWikiPage.id,
              },
            },
            update: {
              pageId: parentCorePage.id,
              label: parentWikiPage.title,
            },
            create: {
              campaignId: input.campaignId,
              pageId: parentCorePage.id,
              entityType: 'PAGE',
              sourceId: parentWikiPage.id,
              label: parentWikiPage.title,
              legacyAnchor: hasLegacyCanonMarker(`${parentWikiPage.title} ${parentWikiPage.content}`),
              metadata: {
                category: parentWikiPage.category,
                tags: parentWikiPage.tags,
              },
            },
          });

          await (tx as any).coreRelation.upsert({
            where: {
              campaignId_relationType_sourceNodeId_targetNodeId: {
                campaignId: input.campaignId,
                relationType: 'PARENT_OF',
                sourceNodeId: parentNode.id,
                targetNodeId: coreNode.id,
              },
            },
            update: {
              metadata: {
                relation: 'hierarchy',
              },
            },
            create: {
              campaignId: input.campaignId,
              relationType: 'PARENT_OF',
              sourceNodeId: parentNode.id,
              targetNodeId: coreNode.id,
              metadata: {
                relation: 'hierarchy',
              },
            },
          });
        }
      }

      const linkedTitles = parseWikiLinks(input.content);
      if (linkedTitles.length > 0) {
        const linkedPages = await tx.wikiPage.findMany({
          where: {
            campaignId: input.campaignId,
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

          const linkedCoreNode = await nodeStore.upsert({
            where: {
              campaignId_entityType_sourceId: {
                campaignId: input.campaignId,
                entityType: 'PAGE',
                sourceId: linkedPage.id,
              },
            },
            update: {
              label: linkedPage.title,
            },
            create: {
              campaignId: input.campaignId,
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

          await (tx as any).coreRelation.upsert({
            where: {
              campaignId_relationType_sourceNodeId_targetNodeId: {
                campaignId: input.campaignId,
                relationType: 'LINKS_TO',
                sourceNodeId: coreNode.id,
                targetNodeId: linkedCoreNode.id,
              },
            },
            update: {
              metadata: {
                relation: 'wiki-link',
              },
            },
            create: {
              campaignId: input.campaignId,
              relationType: 'LINKS_TO',
              sourceNodeId: coreNode.id,
              targetNodeId: linkedCoreNode.id,
              metadata: {
                relation: 'wiki-link',
              },
            },
          });
        }
      }

      return {
        wikiPage,
        corePage,
      };
    });

    await this.invalidateCoreCache(input.campaignId);
    emitCampaignEvent(input.campaignId, 'core:page_created', {
      pageId: created.wikiPage.id,
      title: created.wikiPage.title,
    });

    return created;
  }

  async upsertPageBlocks(input: CoreUpsertPageBlocksInput) {
    const page = await prisma.wikiPage.findUnique({
      where: { id: input.wikiPageId },
      select: {
        id: true,
        campaignId: true,
        title: true,
        content: true,
        category: true,
        tags: true,
      },
    });

    if (!page) {
      throw new AppError(404, 'Wiki page not found');
    }

    await this.resolveCampaignContext(page.campaignId, input.userId);

    const updatedBlocks = await prisma.$transaction(async (tx: PrismaTx) => {
      await tx.wikiBlock.deleteMany({
        where: {
          wikiPageId: page.id,
        },
      });

      if (input.blocks.length > 0) {
        await (tx as any).wikiBlock.createMany({
          data: input.blocks.map((block, index) => ({
            wikiPageId: page.id,
            blockType: block.blockType,
            sortOrder: index,
            payload: block.payload as Prisma.InputJsonValue,
          })),
        });
      }

      await (tx as any).corePage.upsert({
        where: {
          wikiPageId: page.id,
        },
        update: {
          title: page.title,
          summary: toSummary(page.content),
          metadata: {
            category: page.category,
            tags: page.tags,
            hasBlocks: input.blocks.length > 0,
          },
        },
        create: {
          campaignId: page.campaignId,
          wikiPageId: page.id,
          parentPageId: null,
          title: page.title,
          slug: await this.buildUniqueSlug(tx, page.campaignId, page.title),
          pageType: DEFAULT_CORE_PAGE_TYPE,
          summary: toSummary(page.content),
          metadata: {
            category: page.category,
            tags: page.tags,
            hasBlocks: input.blocks.length > 0,
          },
          createdBy: input.userId,
        },
      });

      return (tx as any).wikiBlock.findMany({
        where: {
          wikiPageId: page.id,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });
    });

    await this.invalidateCoreCache(page.campaignId);
    emitCampaignEvent(page.campaignId, 'core:page_blocks_updated', {
      pageId: page.id,
      blocks: updatedBlocks.length,
    });

    return updatedBlocks;
  }

  async listBacklinks(input: CoreBacklinksInput) {
    const page = await prisma.wikiPage.findUnique({
      where: { id: input.wikiPageId },
      select: {
        id: true,
        campaignId: true,
        title: true,
      },
    });

    if (!page) {
      throw new AppError(404, 'Wiki page not found');
    }

    await this.resolveCampaignContext(page.campaignId, input.userId);

    const targetNode = await getNodeStore(prismaUnsafe).findUnique({
      where: {
        campaignId_entityType_sourceId: {
          campaignId: page.campaignId,
          entityType: 'PAGE',
          sourceId: page.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!targetNode) {
      return {
        page,
        backlinks: [],
      };
    }

    const backlinkRelations = await prismaUnsafe.coreRelation.findMany({
      where: {
        campaignId: page.campaignId,
        targetNodeId: targetNode.id,
        relationType: {
          in: ['LINKS_TO', 'REFERENCES'],
        },
      },
      include: {
        sourceNode: {
          include: {
            page: {
              include: {
                wikiPage: {
                  select: {
                    id: true,
                    title: true,
                    category: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: input.limit,
    });

    const backlinks = (backlinkRelations as Array<{ sourceNode?: { page?: { wikiPage?: unknown } } }>)
      .map((relation) => relation.sourceNode?.page?.wikiPage)
      .filter((wikiPage): wikiPage is Record<string, unknown> => Boolean(wikiPage));

    return {
      page,
      backlinks,
    };
  }

  async searchKnowledge(input: CoreKnowledgeSearchInput) {
    await this.resolveCampaignContext(input.campaignId, input.userId);

    const wikiPages = await prisma.wikiPage.findMany({
      where: {
        campaignId: input.campaignId,
        OR: [
          {
            title: {
              contains: input.query,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: input.query,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              has: input.query,
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        category: true,
        updatedAt: true,
      },
      take: input.limit,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const compendium = await this.listCompendium({
      campaignId: input.campaignId,
      userId: input.userId,
      search: input.query,
      limit: input.limit,
    });

    return {
      query: input.query,
      wikiPages,
      compendium,
    };
  }

  async listCompendium(input: CoreListCompendiumInput): Promise<CoreCompendiumView> {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);

    const staticEntries = filterCompendiumEntries({
      systemSlug: context.systemSlug,
      kind: toStaticCompendiumKind(input.kind),
      search: input.search,
      limit: input.limit,
    }).filter((entry) => entry.kind !== 'CLASS');

    const dbWhere: Record<string, unknown> = {
      systemSlug: context.systemSlug,
      ...(input.kind ? { kind: input.kind } : {}),
      AND: [
        {
          OR: [
            {
              campaignId: context.campaignId,
            },
            {
              campaignId: null,
            },
          ],
        },
        ...(input.search
          ? [
              {
                OR: [
                  {
                    name: {
                      contains: input.search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    summary: {
                      contains: input.search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };

    const dbEntries = await prismaUnsafe.compendiumCoreEntry.findMany({
      where: dbWhere,
      select: {
        id: true,
        systemSlug: true,
        kind: true,
        source: true,
        name: true,
        summary: true,
        tags: true,
        content: true,
      },
      orderBy: [
        {
          source: 'desc',
        },
        {
          updatedAt: 'desc',
        },
      ],
      take: input.limit,
    });

    const entries = [
      ...staticEntries.map((entry) => this.toCompendiumDTOFromStatic(entry)),
      ...(dbEntries as Array<{
        id: string;
        systemSlug: string;
        kind: CoreCompendiumKind;
        source: CoreCompendiumSource;
        name: string;
        summary: string | null;
        tags: string[];
        content: Prisma.JsonValue;
      }>).map((entry) => this.toCompendiumDTOFromDb(entry)),
    ];

    const deduped = new Map<string, CoreCompendiumEntryDTO>();
    for (const entry of entries) {
      const key = `${entry.kind}:${normalize(entry.name)}`;
      if (!deduped.has(key)) {
        deduped.set(key, entry);
      }
    }

    return this.toCompendiumView(context.campaignId, context.systemSlug, [...deduped.values()]);
  }

  async createHomebrewEntry(input: CoreCreateHomebrewEntryInput) {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);

    if (!context.isGm) {
      throw new AppError(403, 'Only GM can create compendium entries for this campaign');
    }

    const createdEntry = await prisma.$transaction(async (tx: PrismaTx) => {
      const entry = await (tx as any).compendiumCoreEntry.create({
        data: {
          campaignId: context.campaignId,
          systemSlug: context.systemSlug,
          kind: input.kind,
          source: input.source ?? 'HOMEBREW',
          name: input.name,
          summary: input.summary,
          tags: input.tags,
          content: input.content,
          createdBy: input.userId,
        },
      });

      const nodeStore = getNodeStore(tx as unknown as Record<string, any>);

      const entryNode = await nodeStore.upsert({
        where: {
          campaignId_entityType_sourceId: {
            campaignId: context.campaignId,
            entityType: 'COMPENDIUM_ENTRY',
            sourceId: entry.id,
          },
        },
        update: {
          label: entry.name,
          metadata: {
            kind: entry.kind,
            source: entry.source,
          },
        },
        create: {
          campaignId: context.campaignId,
          entityType: 'COMPENDIUM_ENTRY',
          sourceId: entry.id,
          label: entry.name,
          legacyAnchor: hasLegacyCanonMarker(`${entry.name} ${entry.summary ?? ''}`),
          metadata: {
            kind: entry.kind,
            source: entry.source,
          },
        },
      });

      if (input.linkedWikiPageIds.length > 0) {
        const linkedPages = await tx.wikiPage.findMany({
          where: {
            id: {
              in: input.linkedWikiPageIds,
            },
            campaignId: context.campaignId,
          },
          select: {
            id: true,
            title: true,
            content: true,
            category: true,
            tags: true,
          },
        });

        for (const linkedPage of linkedPages) {
          const pageNode = await nodeStore.upsert({
            where: {
              campaignId_entityType_sourceId: {
                campaignId: context.campaignId,
                entityType: 'PAGE',
                sourceId: linkedPage.id,
              },
            },
            update: {
              label: linkedPage.title,
            },
            create: {
              campaignId: context.campaignId,
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

          await (tx as any).coreRelation.upsert({
            where: {
              campaignId_relationType_sourceNodeId_targetNodeId: {
                campaignId: context.campaignId,
                relationType: 'REFERENCES',
                sourceNodeId: pageNode.id,
                targetNodeId: entryNode.id,
              },
            },
            update: {
              metadata: {
                relation: 'wiki-reference',
              },
            },
            create: {
              campaignId: context.campaignId,
              relationType: 'REFERENCES',
              sourceNodeId: pageNode.id,
              targetNodeId: entryNode.id,
              metadata: {
                relation: 'wiki-reference',
              },
            },
          });
        }
      }

      return entry;
    });

    await this.invalidateCoreCache(context.campaignId);
    emitCampaignEvent(context.campaignId, 'core:compendium_created', {
      entryId: createdEntry.id,
      name: createdEntry.name,
      kind: createdEntry.kind,
    });

    return createdEntry;
  }

  async getVttState(campaignId: string, userId: string) {
    const context = await this.resolveCampaignContext(campaignId, userId);

    const state = await prismaUnsafe.vttState.findUnique({
      where: {
        campaignId: context.campaignId,
      },
      select: {
        id: true,
        campaignId: true,
        sessionId: true,
        mapImageUrl: true,
        gridSize: true,
        tokens: true,
        fogState: true,
        lights: true,
        metadata: true,
        updatedBy: true,
        updatedAt: true,
      },
    });

    if (!state) {
      return {
        campaignId: context.campaignId,
        sessionId: null,
        state: createInitialTabletopState(userId),
        metadata: {},
      };
    }

    return {
      campaignId: state.campaignId,
      sessionId: state.sessionId,
      state: this.mapDbVttStateToCampaignState(state, userId),
      metadata: asRecord(state.metadata),
    };
  }

  async upsertVttState(input: CoreVttPatchInput) {
    const context = await this.resolveCampaignContext(input.campaignId, input.userId);

    if (!context.isGm) {
      throw new AppError(403, 'Only GM can update VTT state');
    }

    const currentStateRecord = await prismaUnsafe.vttState.findUnique({
      where: {
        campaignId: context.campaignId,
      },
      select: {
        mapImageUrl: true,
        gridSize: true,
        tokens: true,
        fogState: true,
        lights: true,
        updatedBy: true,
        updatedAt: true,
      },
    });

    const currentState = currentStateRecord
      ? this.mapDbVttStateToCampaignState(currentStateRecord, input.userId)
      : createInitialTabletopState(input.userId);

    const patch: TabletopStatePatch = {
      mapImageUrl: input.mapImageUrl,
      gridSize: input.gridSize,
      tokens: input.tokens,
      fog: input.fog,
      lights: input.lights,
    };

    const nextState = buildNextTabletopState(currentState, patch, input.userId);

    const savedState = await prismaUnsafe.vttState.upsert({
      where: {
        campaignId: context.campaignId,
      },
      update: {
        sessionId: input.sessionId === undefined ? undefined : input.sessionId,
        mapImageUrl: nextState.mapImageUrl,
        gridSize: nextState.gridSize,
        tokens: nextState.tokens,
        fogState: nextState.fog,
        lights: nextState.lights,
        updatedBy: input.userId,
        metadata: {
          tokenCount: nextState.tokens.length,
        },
      },
      create: {
        campaignId: context.campaignId,
        sessionId: input.sessionId ?? null,
        mapImageUrl: nextState.mapImageUrl,
        gridSize: nextState.gridSize,
        tokens: nextState.tokens,
        fogState: nextState.fog,
        lights: nextState.lights,
        metadata: {
          tokenCount: nextState.tokens.length,
        },
        updatedBy: input.userId,
      },
      select: {
        campaignId: true,
        sessionId: true,
        mapImageUrl: true,
        gridSize: true,
        tokens: true,
        fogState: true,
        lights: true,
        metadata: true,
        updatedBy: true,
        updatedAt: true,
      },
    });

    const tokenNodes = nextState.tokens
      .filter((token) => token.id.length > 0)
      .map((token) => ({
        campaignId: context.campaignId,
        entityType: 'VTT_TOKEN' as const,
        sourceId: token.id,
        label: token.label,
        metadata: {
          x: token.x,
          y: token.y,
          color: token.color,
          size: token.size,
        },
      }));

    for (const tokenNode of tokenNodes) {
      await getNodeStore(prismaUnsafe).upsert({
        where: {
          campaignId_entityType_sourceId: {
            campaignId: tokenNode.campaignId,
            entityType: tokenNode.entityType,
            sourceId: tokenNode.sourceId,
          },
        },
        update: {
          label: tokenNode.label,
          metadata: tokenNode.metadata,
        },
        create: tokenNode,
      });
    }

    await this.invalidateCoreCache(context.campaignId);
    emitCampaignEvent(context.campaignId, 'vtt:state_updated', {
      campaignId: context.campaignId,
      state: nextState,
    });

    return {
      campaignId: savedState.campaignId,
      sessionId: savedState.sessionId,
      state: this.mapDbVttStateToCampaignState(savedState, input.userId),
      metadata: asRecord(savedState.metadata),
    };
  }

  async getCampaignSnapshot(campaignId: string, userId: string, limit: number) {
    const context = await this.resolveCampaignContext(campaignId, userId);

    const [wikiTree, compendium, vttState, graph] = await Promise.all([
      prisma.wikiPage.findMany({
        where: {
          campaignId: context.campaignId,
          ...(context.isGm ? {} : { isPublic: true }),
        },
        select: {
          id: true,
          title: true,
          category: true,
          parentPageId: true,
          tags: true,
          updatedAt: true,
          isPublic: true,
        },
        orderBy: [
          {
            updatedAt: 'desc',
          },
        ],
        take: Math.min(Math.max(limit, 20), 300),
      }),
      this.listCompendium({
        campaignId: context.campaignId,
        userId,
        limit: Math.min(Math.max(limit, 20), 150),
      }),
      this.getVttState(context.campaignId, userId),
      this.knowledgeGraphService.buildCampaignGraph(context.campaignId, userId, limit),
    ]);

    const hasAugustus = wikiTree.some((page) => hasLegacyCanonMarker(page.title));
    const hasSatoru = wikiTree.some((page) => normalize(page.title).includes('satoru naitokira'));

    const characterConnections = await prisma.character.findMany({
      where: {
        campaignId: context.campaignId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 40,
    });

    return {
      campaignId: context.campaignId,
      generatedAt: new Date().toISOString(),
      founders: {
        augustusFrostborne: hasAugustus,
        satoruNaitokira: hasSatoru,
      },
      wiki: {
        totalPages: wikiTree.length,
        pages: wikiTree,
      },
      compendium,
      vtt: vttState,
      graph: {
        stats: graph.stats,
      },
      characters: characterConnections,
    };
  }
}
