import { Prisma, WikiBlockType, WikiCategory } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';
import { LEGACY_WIKI_SEED } from './wiki-legacy-content';

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

interface WikiAccess {
  campaignId: string;
  isGm: boolean;
}

interface ListWikiPagesInput {
  campaignId: string;
  userId: string;
  category?: WikiCategory;
  search?: string;
  tag?: string;
  limit: number;
}

interface CreateWikiPageInput {
  campaignId: string;
  userId: string;
  parentPageId?: string | null;
  title: string;
  content: string;
  category: WikiCategory;
  tags: string[];
  isPublic: boolean;
}

interface UpdateWikiPageInput {
  userId: string;
  wikiPageId: string;
  parentPageId?: string | null;
  title?: string;
  content?: string;
  category?: WikiCategory;
  tags?: string[];
  isPublic?: boolean;
}

interface GetWikiTreeInput {
  campaignId: string;
  userId: string;
}

interface SeedLegacyInput {
  campaignId: string;
  userId: string;
}

interface BootstrapLegacyInput {
  campaignId: string;
  userId: string;
}

interface CreateWikiFromTemplateInput {
  campaignId: string;
  userId: string;
  title: string;
  templateKey: WikiTemplateKey;
  parentPageId?: string | null;
  category?: WikiCategory;
  tags: string[];
  isPublic: boolean;
}

interface UpsertWikiBlocksInput {
  wikiPageId: string;
  userId: string;
  blocks: Array<{
    blockType: WikiBlockType;
    payload: Record<string, unknown>;
  }>;
}

type WikiTemplateKey = 'CHARACTER_DOSSIER' | 'LOCATION_ATLAS' | 'SESSION_CHRONICLE';

type WikiTemplateDefinition = {
  key: WikiTemplateKey;
  name: string;
  description: string;
  category: WikiCategory;
  tags: string[];
  blocks: Array<{
    blockType: WikiBlockType;
    payload: Record<string, unknown>;
  }>;
};

export interface WikiTreeNode {
  id: string;
  title: string;
  category: WikiCategory;
  parentPageId: string | null;
  isPublic: boolean;
  updatedAt: Date;
  children: WikiTreeNode[];
}

export interface WikiPageRelations {
  page: {
    id: string;
    title: string;
    category: WikiCategory;
    tags: string[];
    parentPageId: string | null;
  };
  parent: {
    id: string;
    title: string;
    category: WikiCategory;
  } | null;
  children: Array<{
    id: string;
    title: string;
    category: WikiCategory;
    updatedAt: Date;
  }>;
  backlinks: Array<{
    id: string;
    title: string;
    category: WikiCategory;
    updatedAt: Date;
  }>;
  outgoingLinks: Array<{
    id: string;
    title: string;
    category: WikiCategory;
    updatedAt: Date;
  }>;
  relatedByTag: Array<{
    id: string;
    title: string;
    category: WikiCategory;
    updatedAt: Date;
    sharedTags: string[];
    sharedTagsCount: number;
  }>;
  entityBacklinks: Array<{
    entityType: 'CHARACTER' | 'SESSION' | 'ITEM' | 'CREATURE';
    entityId: string;
    title: string;
    excerpt: string;
    updatedAt: Date;
  }>;
  outgoingEntities: Array<{
    entityType: 'CHARACTER' | 'SESSION' | 'ITEM' | 'CREATURE';
    entityId: string;
    title: string;
  }>;
}

export class WikiService {
  private readonly WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
  private readonly LEGACY_MENTION_PATTERN = /@([^\n@#.,;:!?()[\]{}]{2,80})/g;
  private readonly UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private readonly WIKI_TEMPLATES: WikiTemplateDefinition[] = [
    {
      key: 'CHARACTER_DOSSIER',
      name: 'Dossie de Personagem',
      description: 'Template para personagens canonicos, protagonistas e NPCs recorrentes.',
      category: 'NPC',
      tags: ['template', 'personagem', 'legacy-2023'],
      blocks: [
        { blockType: 'CALLOUT', payload: { title: 'Resumo', content: 'Quem e este personagem no mundo?' } },
        { blockType: 'TEXT', payload: { content: '## Origem\nDescreva a origem e contexto social.' } },
        { blockType: 'TEXT', payload: { content: '## Linha do Tempo\n- Ano/Evento\n- Ano/Evento' } },
        {
          blockType: 'CHECKLIST',
          payload: {
            items: [
              { text: 'Vincular campanha principal', checked: false },
              { text: 'Adicionar relacoes com faccoes', checked: false },
              { text: 'Anexar arte canonicamente usada', checked: false },
            ],
          },
        },
      ],
    },
    {
      key: 'LOCATION_ATLAS',
      name: 'Atlas de Local',
      description: 'Template para cidades, florestas, ruinas e regioes importantes.',
      category: 'LOCATION',
      tags: ['template', 'local', 'worldbuilding'],
      blocks: [
        {
          blockType: 'TEXT',
          payload: { content: '## Visao Geral\nDescreva atmosfera, clima e tom narrativo do local.' },
        },
        { blockType: 'QUOTE', payload: { content: '"Toda trilha tem memoria. Toda memoria cobra um preco."' } },
        {
          blockType: 'TABLE',
          payload: {
            columns: ['Ponto', 'Descricao', 'Perigo'],
            rows: [
              ['Entrada', 'Portao antigo', 'Baixo'],
              ['Centro', 'Praca principal', 'Medio'],
            ],
          },
        },
      ],
    },
    {
      key: 'SESSION_CHRONICLE',
      name: 'Cronica de Sessao',
      description: 'Template para diarios de sessao com links para personagens, loot e eventos.',
      category: 'SESSION_RECAP',
      tags: ['template', 'sessao', 'cronica'],
      blocks: [
        { blockType: 'TEXT', payload: { content: '## Resumo\nO que aconteceu nesta sessao?' } },
        {
          blockType: 'TEXT',
          payload: {
            content:
              '## Personagens em Foco\n- [[Canon 2023 - Augustus Frostborne]]\n- [[Canon 2023 - Satoru Naitokira]]',
          },
        },
        {
          blockType: 'CHECKLIST',
          payload: {
            items: [
              { text: 'Registrar loot principal', checked: false },
              { text: 'Registrar gancho da proxima sessao', checked: false },
            ],
          },
        },
      ],
    },
  ];

  private getVisibilityFilter(access: WikiAccess): { isPublic?: true } {
    return access.isGm ? {} : { isPublic: true };
  }

  private normalizeWikiTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private truncateExcerpt(value: string | null | undefined, maxLength = 140): string {
    if (!value) {
      return '';
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength - 1)}…`;
  }

  private async listRankedPageIdsByFullText(input: {
    campaignId: string;
    search: string;
    category?: WikiCategory;
    tag?: string;
    access: WikiAccess;
    limit: number;
  }): Promise<string[]> {
    const query = input.search.trim();
    if (!query) {
      return [];
    }

    const whereParts: Prisma.Sql[] = [Prisma.sql`wp.campaign_id = ${input.campaignId}`];

    if (!input.access.isGm) {
      whereParts.push(Prisma.sql`wp.is_public = TRUE`);
    }

    if (input.category) {
      whereParts.push(
        Prisma.sql`wp.category = CAST(${input.category} AS "WikiCategory")`
      );
    }

    if (input.tag) {
      whereParts.push(Prisma.sql`${input.tag} = ANY(wp.tags)`);
    }

    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT wp.id,
             ts_rank_cd(
               to_tsvector('portuguese', coalesce(wp.title, '') || ' ' || coalesce(wp.content, '')),
               websearch_to_tsquery('portuguese', ${query})
             ) AS rank
      FROM "wiki_pages" wp
      WHERE ${Prisma.join(
        [
          ...whereParts,
          Prisma.sql`to_tsvector('portuguese', coalesce(wp.title, '') || ' ' || coalesce(wp.content, '')) @@ websearch_to_tsquery('portuguese', ${query})`,
        ],
        ' AND '
      )}
      ORDER BY rank DESC, wp.updated_at DESC
      LIMIT ${input.limit}
    `);

    return rows.map((row) => row.id);
  }

  private async findOutgoingEntityLinks(input: {
    campaignId: string;
    content: string;
    userId: string;
    limit: number;
  }): Promise<WikiPageRelations['outgoingEntities']> {
    const titles = this.extractWikiLinkTitles(input.content).slice(0, 40);
    if (titles.length === 0) {
      return [];
    }

    const sessionIds = titles.filter((title) => this.UUID_PATTERN.test(title));

    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
      select: { systemId: true },
    });

    const [characters, sessionsBySummary, sessionsById, items, creatures] = await Promise.all([
      prisma.character.findMany({
        where: {
          campaignId: input.campaignId,
          OR: titles.map((title) => ({
            name: {
              equals: title,
              mode: 'insensitive' as const,
            },
          })),
        },
        select: {
          id: true,
          name: true,
        },
        take: input.limit,
      }),
      prisma.session.findMany({
        where: {
          campaignId: input.campaignId,
          OR: titles.map((title) => ({
            summary: {
              equals: title,
              mode: 'insensitive' as const,
            },
          })),
        },
        select: {
          id: true,
          summary: true,
          date: true,
        },
        orderBy: { date: 'desc' },
        take: input.limit,
      }),
      sessionIds.length > 0
        ? prisma.session.findMany({
            where: {
              campaignId: input.campaignId,
              id: {
                in: sessionIds,
              },
            },
            select: {
              id: true,
              summary: true,
              date: true,
            },
            orderBy: { date: 'desc' },
            take: input.limit,
          })
        : Promise.resolve([]),
      campaign?.systemId
        ? prisma.item.findMany({
            where: {
              systemId: campaign.systemId,
              OR: titles.map((title) => ({
                name: {
                  equals: title,
                  mode: 'insensitive' as const,
                },
              })),
            },
            select: {
              id: true,
              name: true,
            },
            take: input.limit,
          })
        : Promise.resolve([]),
      campaign?.systemId
        ? prisma.creature.findMany({
            where: {
              systemId: campaign.systemId,
              OR: [
                {
                  isPublic: true,
                },
                {
                  createdBy: input.userId,
                },
              ],
              name: {
                in: titles,
                mode: 'insensitive' as const,
              },
            },
            select: {
              id: true,
              name: true,
            },
            take: input.limit,
          })
        : Promise.resolve([]),
    ]);

    const outgoing: WikiPageRelations['outgoingEntities'] = [
      ...characters.map((entry) => ({
        entityType: 'CHARACTER' as const,
        entityId: entry.id,
        title: entry.name,
      })),
      ...sessionsBySummary.map((entry) => ({
        entityType: 'SESSION' as const,
        entityId: entry.id,
        title: entry.summary?.trim().length ? entry.summary : `Sessao ${entry.date.toISOString().slice(0, 10)}`,
      })),
      ...sessionsById.map((entry) => ({
        entityType: 'SESSION' as const,
        entityId: entry.id,
        title: entry.summary?.trim().length ? entry.summary : `Sessao ${entry.date.toISOString().slice(0, 10)}`,
      })),
      ...items.map((entry) => ({
        entityType: 'ITEM' as const,
        entityId: entry.id,
        title: entry.name,
      })),
      ...creatures.map((entry) => ({
        entityType: 'CREATURE' as const,
        entityId: entry.id,
        title: entry.name,
      })),
    ];

    const deduplicated = new Map<string, WikiPageRelations['outgoingEntities'][number]>();
    for (const entry of outgoing) {
      deduplicated.set(`${entry.entityType}:${entry.entityId}`, entry);
    }

    return [...deduplicated.values()].slice(0, input.limit);
  }

  private async findEntityBacklinks(input: {
    campaignId: string;
    pageTitle: string;
    userId: string;
    limit: number;
  }): Promise<WikiPageRelations['entityBacklinks']> {
    const wikiLinkReference = `[[${input.pageTitle}]]`;
    const mentionReference = `@${input.pageTitle}`;

    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
      select: { systemId: true },
    });

    const [characters, sessions, items, creatures] = await Promise.all([
      prisma.character.findMany({
        where: {
          campaignId: input.campaignId,
          notes: {
            not: null,
          },
          OR: [
            {
              notes: {
                contains: wikiLinkReference,
                mode: 'insensitive',
              },
            },
            {
              notes: {
                contains: mentionReference,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          notes: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: input.limit,
      }),
      prisma.session.findMany({
        where: {
          campaignId: input.campaignId,
          OR: [
            {
              summary: {
                contains: wikiLinkReference,
                mode: 'insensitive',
              },
            },
            {
              summary: {
                contains: mentionReference,
                mode: 'insensitive',
              },
            },
            {
              narrativeLog: {
                contains: wikiLinkReference,
                mode: 'insensitive',
              },
            },
            {
              narrativeLog: {
                contains: mentionReference,
                mode: 'insensitive',
              },
            },
            {
              privateGmNotes: {
                contains: wikiLinkReference,
                mode: 'insensitive',
              },
            },
            {
              privateGmNotes: {
                contains: mentionReference,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          summary: true,
          narrativeLog: true,
          privateGmNotes: true,
          updatedAt: true,
          date: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: input.limit,
      }),
      campaign?.systemId
        ? prisma.item.findMany({
            where: {
              systemId: campaign.systemId,
              OR: [
                {
                  description: {
                    contains: wikiLinkReference,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: mentionReference,
                    mode: 'insensitive',
                  },
                },
              ],
            },
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: input.limit,
          })
        : Promise.resolve([]),
      campaign?.systemId
        ? prisma.creature.findMany({
            where: {
              systemId: campaign.systemId,
              OR: [
                {
                  isPublic: true,
                },
                {
                  createdBy: input.userId,
                },
              ],
              description: {
                not: null,
              },
              AND: [
                {
                  OR: [
                    {
                      description: {
                        contains: wikiLinkReference,
                        mode: 'insensitive',
                      },
                    },
                    {
                      description: {
                        contains: mentionReference,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              ],
            },
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: input.limit,
          })
        : Promise.resolve([]),
    ]);

    const backlinks: WikiPageRelations['entityBacklinks'] = [
      ...characters.map((entry) => ({
        entityType: 'CHARACTER' as const,
        entityId: entry.id,
        title: entry.name,
        excerpt: this.truncateExcerpt(entry.notes),
        updatedAt: entry.updatedAt,
      })),
      ...sessions.map((entry) => ({
        entityType: 'SESSION' as const,
        entityId: entry.id,
        title: entry.summary?.trim().length ? entry.summary : `Sessao ${entry.date.toISOString().slice(0, 10)}`,
        excerpt: this.truncateExcerpt(entry.narrativeLog) || this.truncateExcerpt(entry.privateGmNotes) || this.truncateExcerpt(entry.summary),
        updatedAt: entry.updatedAt,
      })),
      ...items.map((entry) => ({
        entityType: 'ITEM' as const,
        entityId: entry.id,
        title: entry.name,
        excerpt: this.truncateExcerpt(entry.description),
        updatedAt: entry.createdAt,
      })),
      ...creatures.map((entry) => ({
        entityType: 'CREATURE' as const,
        entityId: entry.id,
        title: entry.name,
        excerpt: this.truncateExcerpt(entry.description),
        updatedAt: entry.createdAt,
      })),
    ]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, input.limit);

    return backlinks;
  }

  private extractWikiLinkTitles(content: string): string[] {
    const titleMap = new Map<string, string>();

    const bracketMatches = content.matchAll(this.WIKI_LINK_PATTERN);
    for (const match of bracketMatches) {
      const title = match[1]?.trim();
      if (!title) {
        continue;
      }

      const normalizedTitle = this.normalizeWikiTitle(title);
      if (!titleMap.has(normalizedTitle)) {
        titleMap.set(normalizedTitle, title);
      }
    }

    const legacyMatches = content.matchAll(this.LEGACY_MENTION_PATTERN);
    for (const match of legacyMatches) {
      const title = match[1]?.trim();
      if (!title) {
        continue;
      }

      const normalizedTitle = this.normalizeWikiTitle(title);
      if (!titleMap.has(normalizedTitle)) {
        titleMap.set(normalizedTitle, title);
      }
    }

    return [...titleMap.values()];
  }

  private sortTree(nodes: WikiTreeNode[]): WikiTreeNode[] {
    nodes.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    for (const node of nodes) {
      this.sortTree(node.children);
    }
    return nodes;
  }

  private async resolveParentPageId(
    campaignId: string,
    parentPageId: string | null | undefined,
    client: PrismaClientLike,
    currentPageId?: string
  ): Promise<string | null | undefined> {
    if (parentPageId === undefined) {
      return undefined;
    }

    if (parentPageId === null) {
      return null;
    }

    if (currentPageId && parentPageId === currentPageId) {
      throw new AppError(400, 'A wiki page cannot be its own parent');
    }

    const parentPage = await client.wikiPage.findUnique({
      where: { id: parentPageId },
      select: {
        id: true,
        campaignId: true,
        parentPageId: true,
      },
    });

    if (!parentPage) {
      throw new AppError(404, 'Parent wiki page not found');
    }

    if (parentPage.campaignId !== campaignId) {
      throw new AppError(400, 'Parent wiki page must belong to the same campaign');
    }

    if (!currentPageId) {
      return parentPage.id;
    }

    let cursor: { id: string; campaignId: string; parentPageId: string | null } | null = parentPage;
    while (cursor) {
      if (cursor.id === currentPageId) {
        throw new AppError(400, 'Wiki hierarchy cycle detected');
      }

      if (!cursor.parentPageId) {
        break;
      }

      const nextCursor: { id: string; campaignId: string; parentPageId: string | null } | null =
        await client.wikiPage.findUnique({
        where: { id: cursor.parentPageId },
        select: {
          id: true,
          campaignId: true,
          parentPageId: true,
        },
      });

      cursor = nextCursor ?? null;
    }

    return parentPage.id;
  }

  private async getCampaignAccess(
    campaignId: string,
    userId: string,
    client: PrismaClientLike = prisma
  ): Promise<WikiAccess> {
    const campaign = await client.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
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

    const isGm =
      campaign.ownerId === userId || campaign.members.some((member) => member.role === 'GM');

    return {
      campaignId: campaign.id,
      isGm,
    };
  }

  private async validateParentPage(input: {
    campaignId: string;
    isGm: boolean;
    parentPageId?: string | null;
    currentPageId?: string;
    client: PrismaClientLike;
  }): Promise<string | null | undefined> {
    if (input.parentPageId === undefined) {
      return undefined;
    }

    if (input.parentPageId === null) {
      return null;
    }

    if (input.currentPageId && input.currentPageId === input.parentPageId) {
      throw new AppError(400, 'A wiki page cannot be parent of itself');
    }

    const parentPage = await input.client.wikiPage.findUnique({
      where: { id: input.parentPageId },
      select: {
        id: true,
        campaignId: true,
        isPublic: true,
      },
    });

    if (!parentPage || parentPage.campaignId !== input.campaignId) {
      throw new AppError(400, 'Parent wiki page must belong to the same campaign');
    }

    if (!input.isGm && !parentPage.isPublic) {
      throw new AppError(403, 'Only GMs can nest pages under private wiki pages');
    }

    if (input.currentPageId) {
      await this.assertNoHierarchyCycle(input.currentPageId, input.parentPageId, input.client);
    }

    return parentPage.id;
  }

  private async assertNoHierarchyCycle(
    pageId: string,
    candidateParentId: string,
    client: PrismaClientLike
  ): Promise<void> {
    let cursorId: string | null = candidateParentId;
    let guard = 0;

    while (cursorId) {
      if (cursorId === pageId) {
        throw new AppError(400, 'Invalid hierarchy: cannot assign a descendant as parent');
      }

      const cursor: { parentPageId: string | null } | null = await client.wikiPage.findUnique({
        where: { id: cursorId },
        select: { parentPageId: true },
      });

      cursorId = cursor?.parentPageId ?? null;
      guard += 1;

      if (guard > 200) {
        throw new AppError(400, 'Invalid hierarchy depth detected');
      }
    }
  }

  private async getPageWithAccess(
    wikiPageId: string,
    userId: string,
    client: PrismaClientLike = prisma
  ) {
    const page = await client.wikiPage.findUnique({
      where: { id: wikiPageId },
    });

    if (!page) {
      throw new AppError(404, 'Wiki page not found');
    }

    const access = await this.getCampaignAccess(page.campaignId, userId, client);

    if (!access.isGm && !page.isPublic) {
      throw new AppError(403, 'Only GMs can access private wiki pages');
    }

    const canEdit = access.isGm || page.createdBy === userId;

    return { page, access, canEdit };
  }

  async listPages(input: ListWikiPagesInput) {
    const access = await this.getCampaignAccess(input.campaignId, input.userId);

    const baseWhere = {
      campaignId: access.campaignId,
      ...(input.category ? { category: input.category } : {}),
      ...(input.tag ? { tags: { has: input.tag } } : {}),
      ...this.getVisibilityFilter(access),
    };

    const trimmedSearch = input.search?.trim();
    if (trimmedSearch && trimmedSearch.length > 0) {
      const rankedPageIds = await this.listRankedPageIdsByFullText({
        campaignId: access.campaignId,
        search: trimmedSearch,
        category: input.category,
        tag: input.tag,
        access,
        limit: input.limit,
      });

      if (rankedPageIds.length === 0) {
        return [];
      }

      const pages = await prisma.wikiPage.findMany({
        where: {
          ...baseWhere,
          id: {
            in: rankedPageIds,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
          _count: {
            select: {
              children: true,
            },
          },
        },
      });

      const pagesById = new Map(pages.map((page) => [page.id, page]));
      return rankedPageIds.map((id) => pagesById.get(id)).filter((page) => page !== undefined);
    }

    return prisma.wikiPage.findMany({
      where: baseWhere,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: input.limit,
    });
  }

  async getTree(campaignId: string, userId: string): Promise<WikiTreeNode[]> {
    const access = await this.getCampaignAccess(campaignId, userId);

    const pages = await prisma.wikiPage.findMany({
      where: {
        campaignId: access.campaignId,
        ...this.getVisibilityFilter(access),
      },
      select: {
        id: true,
        title: true,
        category: true,
        parentPageId: true,
        isPublic: true,
        updatedAt: true,
      },
      orderBy: [{ title: 'asc' }],
    });

    const nodeMap = new Map<string, WikiTreeNode>();
    for (const page of pages) {
      nodeMap.set(page.id, {
        id: page.id,
        title: page.title,
        category: page.category,
        parentPageId: page.parentPageId,
        isPublic: page.isPublic,
        updatedAt: page.updatedAt,
        children: [],
      });
    }

    const roots: WikiTreeNode[] = [];
    for (const page of pages) {
      const node = nodeMap.get(page.id)!;
      if (!page.parentPageId) {
        roots.push(node);
        continue;
      }

      const parentNode = nodeMap.get(page.parentPageId);
      if (!parentNode) {
        roots.push(node);
        continue;
      }

      parentNode.children.push(node);
    }

    return this.sortTree(roots);
  }

  async getPage(wikiPageId: string, userId: string) {
    const page = await prisma.wikiPage.findUnique({
      where: { id: wikiPageId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            category: true,
            updatedAt: true,
          },
          orderBy: {
            title: 'asc',
          },
        },
      },
    });

    if (!page) {
      throw new AppError(404, 'Wiki page not found');
    }

    const access = await this.getCampaignAccess(page.campaignId, userId);

    if (!access.isGm && !page.isPublic) {
      throw new AppError(403, 'Only GMs can access private wiki pages');
    }

    const linkedPageTitles = this.extractWikiLinkTitles(page.content);
    const titleSet = new Set(linkedPageTitles.map((title) => this.normalizeWikiTitle(title)));

    const candidateLinkedPages = await prisma.wikiPage.findMany({
      where: {
        campaignId: page.campaignId,
        id: { not: page.id },
        ...(access.isGm ? {} : { isPublic: true }),
      },
      select: {
        id: true,
        title: true,
      },
    });

    const linkedPages = candidateLinkedPages.filter((candidatePage) => {
      const normalizedCandidateTitle = this.normalizeWikiTitle(candidatePage.title);
      return titleSet.has(normalizedCandidateTitle);
    });

    const backlinks = await prisma.wikiPage.findMany({
      where: {
        campaignId: page.campaignId,
        id: { not: page.id },
        OR: [
          {
            content: {
              contains: `[[${page.title}]]`,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: `@${page.title}`,
              mode: 'insensitive',
            },
          },
        ],
        ...(access.isGm ? {} : { isPublic: true }),
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 25,
    });

    return {
      ...page,
      linkedPages,
      backlinks,
    };
  }

  getTemplates() {
    return this.WIKI_TEMPLATES.map((template) => ({
      key: template.key,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags,
      blockTypes: template.blocks.map((block) => block.blockType),
    }));
  }

  async createFromTemplate(input: CreateWikiFromTemplateInput) {
    return prisma.$transaction(async (tx) => {
      const template = this.WIKI_TEMPLATES.find((entry) => entry.key === input.templateKey);

      if (!template) {
        throw new AppError(404, 'Wiki template not found');
      }

      const access = await this.getCampaignAccess(input.campaignId, input.userId, tx);
      const parentPageId = await this.resolveParentPageId(
        input.campaignId,
        input.parentPageId,
        tx
      );

      if (!input.isPublic && !access.isGm) {
        throw new AppError(403, 'Only GMs can create private wiki pages');
      }

      const combinedTags = [...new Set([...template.tags, ...input.tags])];
      const markdown = template.blocks
        .map((block) => {
          if (block.blockType === 'TEXT') {
            return String(block.payload.content || '');
          }

          if (block.blockType === 'QUOTE') {
            return `> ${String(block.payload.content || '')}`;
          }

          return '';
        })
        .filter((entry) => entry.length > 0)
        .join('\n\n');

      const createdPage = await tx.wikiPage.create({
        data: {
          campaignId: input.campaignId,
          createdBy: input.userId,
          parentPageId: parentPageId ?? null,
          title: input.title,
          content: markdown || `# ${input.title}`,
          category: input.category ?? template.category,
          tags: combinedTags,
          isPublic: input.isPublic,
        },
      });

      if (template.blocks.length > 0) {
        await tx.wikiBlock.createMany({
          data: template.blocks.map((block, index) => ({
            wikiPageId: createdPage.id,
            blockType: block.blockType,
            sortOrder: index,
            payload: block.payload as Prisma.InputJsonValue,
          })),
        });
      }

      return tx.wikiPage.findUnique({
        where: { id: createdPage.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  }

  async getPageBlocks(wikiPageId: string, userId: string) {
    const { page } = await this.getPageWithAccess(wikiPageId, userId);

    const blocks = await prisma.wikiBlock.findMany({
      where: { wikiPageId: page.id },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        blockType: true,
        sortOrder: true,
        payload: true,
        updatedAt: true,
      },
    });

    if (blocks.length > 0) {
      return blocks;
    }

    // Backward compatibility for pages created before block editor support.
    return [
      {
        id: `legacy-${page.id}`,
        blockType: 'TEXT' as WikiBlockType,
        sortOrder: 0,
        payload: { content: page.content },
        updatedAt: page.updatedAt,
      },
    ];
  }

  async upsertPageBlocks(input: UpsertWikiBlocksInput) {
    return prisma.$transaction(async (tx) => {
      const { page, canEdit } = await this.getPageWithAccess(input.wikiPageId, input.userId, tx);

      if (!canEdit) {
        throw new AppError(403, 'You can only edit your own wiki pages unless you are GM');
      }

      await tx.wikiBlock.deleteMany({
        where: { wikiPageId: page.id },
      });

      if (input.blocks.length > 0) {
        await tx.wikiBlock.createMany({
          data: input.blocks.map((block, index) => ({
            wikiPageId: page.id,
            blockType: block.blockType,
            sortOrder: index,
            payload: block.payload as Prisma.InputJsonValue,
          })),
        });
      }

      const markdown = input.blocks
        .map((block) => {
          if (block.blockType === 'TEXT' || block.blockType === 'CALLOUT' || block.blockType === 'CODE') {
            return String(block.payload.content || '');
          }

          if (block.blockType === 'QUOTE') {
            return `> ${String(block.payload.content || '')}`;
          }

          if (block.blockType === 'CHECKLIST') {
            const items = Array.isArray(block.payload.items)
              ? block.payload.items.map((item) => {
                  if (!item || typeof item !== 'object') {
                    return '- [ ] item';
                  }

                  const checked = Boolean((item as Record<string, unknown>).checked);
                  const text = String((item as Record<string, unknown>).text || 'item');
                  return checked ? `- [x] ${text}` : `- [ ] ${text}`;
                })
              : [];

            return items.join('\n');
          }

          return '';
        })
        .filter((entry) => entry.length > 0)
        .join('\n\n');

      await tx.wikiPage.update({
        where: { id: page.id },
        data: {
          content: markdown || page.content,
        },
      });

      return tx.wikiBlock.findMany({
        where: { wikiPageId: page.id },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          blockType: true,
          sortOrder: true,
          payload: true,
          updatedAt: true,
        },
      });
    });
  }

  async addFavorite(wikiPageId: string, userId: string) {
    const { page } = await this.getPageWithAccess(wikiPageId, userId);

    await prisma.wikiFavorite.upsert({
      where: {
        wikiPageId_userId: {
          wikiPageId: page.id,
          userId,
        },
      },
      update: {},
      create: {
        wikiPageId: page.id,
        userId,
      },
    });
  }

  async removeFavorite(wikiPageId: string, userId: string) {
    const { page } = await this.getPageWithAccess(wikiPageId, userId);

    await prisma.wikiFavorite.deleteMany({
      where: {
        wikiPageId: page.id,
        userId,
      },
    });
  }

  async listFavorites(campaignId: string, userId: string) {
    await this.getCampaignAccess(campaignId, userId);

    return prisma.wikiFavorite.findMany({
      where: {
        userId,
        page: {
          campaignId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        page: {
          select: {
            id: true,
            title: true,
            category: true,
            isPublic: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async searchMentions(campaignId: string, userId: string, query: string, limit = 8) {
    const access = await this.getCampaignAccess(campaignId, userId);

    return prisma.wikiPage.findMany({
      where: {
        campaignId,
        title: {
          contains: query,
          mode: 'insensitive',
        },
        ...this.getVisibilityFilter(access),
      },
      select: {
        id: true,
        title: true,
        category: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: Math.min(Math.max(limit, 1), 20),
    });
  }

  async getPageRelations(wikiPageId: string, userId: string, limit = 8): Promise<WikiPageRelations> {
    const page = await this.getPage(wikiPageId, userId);
    const access = await this.getCampaignAccess(page.campaignId, userId);
    const visibilityFilter = this.getVisibilityFilter(access);
    const safeLimit = Math.min(Math.max(limit, 1), 30);

    const backlinks = await prisma.wikiPage.findMany({
      where: {
        campaignId: page.campaignId,
        id: { not: page.id },
        OR: [
          {
            content: {
              contains: `[[${page.title}]]`,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: `@${page.title}`,
              mode: 'insensitive',
            },
          },
        ],
        ...visibilityFilter,
      },
      select: {
        id: true,
        title: true,
        category: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: safeLimit,
    });

    const outgoingTitles = this.extractWikiLinkTitles(page.content);
    const outgoingLinks = outgoingTitles.length
      ? await prisma.wikiPage.findMany({
          where: {
            campaignId: page.campaignId,
            id: {
              not: page.id,
            },
            OR: outgoingTitles.map((title) => ({
              title: {
                equals: title,
                mode: 'insensitive',
              },
            })),
            ...visibilityFilter,
          },
          select: {
            id: true,
            title: true,
            category: true,
            updatedAt: true,
          },
          take: safeLimit,
        })
      : [];

    const relatedCandidates = page.tags.length
      ? await prisma.wikiPage.findMany({
          where: {
            campaignId: page.campaignId,
            id: { not: page.id },
            tags: {
              hasSome: page.tags,
            },
            ...visibilityFilter,
          },
          select: {
            id: true,
            title: true,
            category: true,
            tags: true,
            updatedAt: true,
          },
          take: safeLimit * 2,
        })
      : [];

    const relatedByTag = relatedCandidates
      .map((candidate) => {
        const sharedTags = candidate.tags.filter((tag) => page.tags.includes(tag));

        return {
          id: candidate.id,
          title: candidate.title,
          category: candidate.category,
          updatedAt: candidate.updatedAt,
          sharedTags,
          sharedTagsCount: sharedTags.length,
        };
      })
      .sort((a, b) => {
        if (a.sharedTagsCount !== b.sharedTagsCount) {
          return b.sharedTagsCount - a.sharedTagsCount;
        }

        return b.updatedAt.getTime() - a.updatedAt.getTime();
      })
      .slice(0, safeLimit);

    const parent = page.parent
      ? {
          id: page.parent.id,
          title: page.parent.title,
          category: page.parent.category,
        }
      : null;

    const [entityBacklinks, outgoingEntities] = await Promise.all([
      this.findEntityBacklinks({
        campaignId: page.campaignId,
        pageTitle: page.title,
        userId,
        limit: safeLimit,
      }),
      this.findOutgoingEntityLinks({
        campaignId: page.campaignId,
        content: page.content,
        userId,
        limit: safeLimit,
      }),
    ]);

    return {
      page: {
        id: page.id,
        title: page.title,
        category: page.category,
        tags: page.tags,
        parentPageId: page.parentPageId,
      },
      parent,
      children: page.children,
      backlinks,
      outgoingLinks,
      relatedByTag,
      entityBacklinks,
      outgoingEntities,
    };
  }

  async createPage(input: CreateWikiPageInput) {
    return prisma.$transaction(async (tx) => {
      const access = await this.getCampaignAccess(input.campaignId, input.userId, tx);

      if (!input.isPublic && !access.isGm) {
        throw new AppError(403, 'Only GMs can create private wiki pages');
      }

      const parentPageId = await this.validateParentPage({
        campaignId: input.campaignId,
        isGm: access.isGm,
        parentPageId: input.parentPageId,
        client: tx,
      });

      return tx.wikiPage.create({
        data: {
          campaignId: input.campaignId,
          parentPageId: parentPageId ?? null,
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags,
          createdBy: input.userId,
          isPublic: input.isPublic,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  }

  async updatePage(input: UpdateWikiPageInput) {
    return prisma.$transaction(async (tx) => {
      const page = await tx.wikiPage.findUnique({
        where: { id: input.wikiPageId },
      });

      if (!page) {
        throw new AppError(404, 'Wiki page not found');
      }

      const access = await this.getCampaignAccess(page.campaignId, input.userId, tx);
      const canEdit = access.isGm || page.createdBy === input.userId;

      if (!canEdit) {
        throw new AppError(403, 'You can only edit your own wiki pages unless you are GM');
      }

      if (input.isPublic === false && !access.isGm) {
        throw new AppError(403, 'Only GMs can make a wiki page private');
      }

      const resolvedParentPageId = await this.validateParentPage({
        campaignId: page.campaignId,
        isGm: access.isGm,
        parentPageId: input.parentPageId,
        currentPageId: page.id,
        client: tx,
      });

      const updateData: {
        title?: string;
        content?: string;
        category?: WikiCategory;
        tags?: string[];
        isPublic?: boolean;
        parentPageId?: string | null;
      } = {
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags,
        isPublic: input.isPublic,
      };

      if (resolvedParentPageId !== undefined) {
        updateData.parentPageId = resolvedParentPageId;
      }

      return tx.wikiPage.update({
        where: { id: input.wikiPageId },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      });
    });
  }

  async deletePage(wikiPageId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const page = await tx.wikiPage.findUnique({
        where: { id: wikiPageId },
      });

      if (!page) {
        throw new AppError(404, 'Wiki page not found');
      }

      const access = await this.getCampaignAccess(page.campaignId, userId, tx);
      const canDelete = access.isGm || page.createdBy === userId;
      if (!canDelete) {
        throw new AppError(403, 'You can only delete your own wiki pages unless you are GM');
      }

      await tx.wikiPage.delete({
        where: { id: wikiPageId },
      });
    });
  }

  async getPageTree(input: GetWikiTreeInput): Promise<WikiTreeNode[]> {
    const access = await this.getCampaignAccess(input.campaignId, input.userId);

    const pages = await prisma.wikiPage.findMany({
      where: {
        campaignId: access.campaignId,
        ...(access.isGm ? {} : { isPublic: true }),
      },
      select: {
        id: true,
        title: true,
        category: true,
        isPublic: true,
        parentPageId: true,
        updatedAt: true,
      },
      orderBy: [{ title: 'asc' }, { updatedAt: 'desc' }],
    });

    const nodesById = new Map<string, WikiTreeNode>();
    const roots: WikiTreeNode[] = [];

    for (const page of pages) {
      nodesById.set(page.id, {
        ...page,
        children: [],
      });
    }

    for (const node of nodesById.values()) {
      if (node.parentPageId) {
        const parentNode = nodesById.get(node.parentPageId);
        if (parentNode) {
          parentNode.children.push(node);
          continue;
        }
      }

      roots.push(node);
    }

    return roots;
  }

  async seedLegacyPages(input: SeedLegacyInput) {
    return prisma.$transaction(async (tx) => {
      const access = await this.getCampaignAccess(input.campaignId, input.userId, tx);

      if (!access.isGm) {
        throw new AppError(403, 'Only GMs can import legacy wiki content');
      }

      const sourceToPageId = new Map<string, string>();
      let created = 0;
      let skipped = 0;

      for (const entry of LEGACY_WIKI_SEED) {
        const existingPage = await tx.wikiPage.findFirst({
          where: {
            campaignId: input.campaignId,
            OR: [{ legacySource: entry.legacySource }, { title: entry.title }],
          },
          select: {
            id: true,
            legacySource: true,
          },
        });

        let parentPageId: string | null = null;
        if (entry.parentLegacySource) {
          parentPageId = sourceToPageId.get(entry.parentLegacySource) ?? null;

          if (!parentPageId) {
            const parentBySource = await tx.wikiPage.findFirst({
              where: {
                campaignId: input.campaignId,
                legacySource: entry.parentLegacySource,
              },
              select: { id: true },
            });

            parentPageId = parentBySource?.id ?? null;
          }
        }

        if (existingPage) {
          if (!existingPage.legacySource) {
            await tx.wikiPage.update({
              where: { id: existingPage.id },
              data: {
                legacySource: entry.legacySource,
                parentPageId,
              },
            });
          }

          sourceToPageId.set(entry.legacySource, existingPage.id);
          skipped += 1;
          continue;
        }

        const createdPage = await tx.wikiPage.create({
          data: {
            campaignId: input.campaignId,
            parentPageId,
            legacySource: entry.legacySource,
            title: entry.title,
            content: entry.content,
            category: entry.category,
            tags: entry.tags,
            createdBy: input.userId,
            isPublic: entry.isPublic,
          },
          select: { id: true },
        });

        sourceToPageId.set(entry.legacySource, createdPage.id);
        created += 1;
      }

      return {
        created,
        skipped,
        total: LEGACY_WIKI_SEED.length,
      };
    });
  }

  async bootstrapLegacyCanon(input: BootstrapLegacyInput) {
    return this.seedLegacyPages(input);
  }
}

