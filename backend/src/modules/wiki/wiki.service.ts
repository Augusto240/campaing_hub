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
  parentPageId?: string | null;
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
  parentPageId?: string | null;
}

interface GetWikiTreeInput {
  campaignId: string;
  userId: string;
}

interface SeedLegacyInput {
  campaignId: string;
  userId: string;
}

interface WikiTreeNode {
  id: string;
  title: string;
  category: WikiCategory;
  isPublic: boolean;
  parentPageId: string | null;
  updatedAt: Date;
  children: WikiTreeNode[];
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
}

const buildSearchFilter = (search?: string) =>
  search && search.trim().length > 0
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { content: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

const internalLinkRegex = /@([^\n@#.,;:!?()[\]{}]{2,80})/g;

const extractMentionedPageTitles = (content: string): string[] => {
  const mentions = new Set<string>();
  const matches = content.matchAll(internalLinkRegex);

  for (const match of matches) {
    const title = match[1]?.trim();
    if (title) {
      mentions.add(title);
    }
  }

  return [...mentions];
};

export class WikiService {
  private readonly WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

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

  private extractWikiLinkTitles(content: string): string[] {
    const matches = content.matchAll(this.WIKI_LINK_PATTERN);
    const titleSet = new Set<string>();

    for (const match of matches) {
      const title = match[1]?.trim();
      if (title) {
        titleSet.add(title);
      }
    }

    return [...titleSet];
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

<<<<<<< HEAD
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
=======
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
>>>>>>> bd47dd9da94ef8cb6fed9c2db135d6dcdeef18bd
  }

  async listPages(input: ListWikiPagesInput) {
    const access = await this.getCampaignAccess(input.campaignId, input.userId);

    return prisma.wikiPage.findMany({
      where: {
        campaignId: access.campaignId,
        ...(input.category ? { category: input.category } : {}),
        ...(input.tag ? { tags: { has: input.tag } } : {}),
        ...buildSearchFilter(input.search),
        ...this.getVisibilityFilter(access),
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

    const mentionedPageTitles = extractMentionedPageTitles(page.content);
    const titleSet = new Set(mentionedPageTitles.map((title) => title.toLowerCase()));

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

    const linkedPages = candidateLinkedPages.filter((candidatePage) =>
      titleSet.has(candidatePage.title.toLowerCase())
    );

    const backlinks = await prisma.wikiPage.findMany({
      where: {
        campaignId: page.campaignId,
        id: { not: page.id },
        content: {
          contains: `@${page.title}`,
          mode: 'insensitive',
        },
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
        content: {
          contains: `[[${page.title}]]`,
          mode: 'insensitive',
        },
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
    };
  }

  async createPage(input: CreateWikiPageInput) {
    return prisma.$transaction(async (tx) => {
      const access = await this.getCampaignAccess(input.campaignId, input.userId, tx);
      const parentPageId = await this.resolveParentPageId(
        input.campaignId,
        input.parentPageId,
        tx
      );

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

<<<<<<< HEAD
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
=======
      const resolvedParentPageId = await this.resolveParentPageId(
        page.campaignId,
        input.parentPageId,
        tx,
        page.id
      );

      return tx.wikiPage.update({
        where: { id: input.wikiPageId },
        data: {
          ...(resolvedParentPageId !== undefined ? { parentPageId: resolvedParentPageId } : {}),
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags,
          isPublic: input.isPublic,
        },
>>>>>>> bd47dd9da94ef8cb6fed9c2db135d6dcdeef18bd
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

<<<<<<< HEAD
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
=======
  async bootstrapLegacyCanon(input: BootstrapLegacyInput) {
>>>>>>> bd47dd9da94ef8cb6fed9c2db135d6dcdeef18bd
    return prisma.$transaction(async (tx) => {
      const access = await this.getCampaignAccess(input.campaignId, input.userId, tx);

      if (!access.isGm) {
<<<<<<< HEAD
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
=======
        throw new AppError(403, 'Only GMs can import legacy canon content');
      }

      const legacyPages = [
        {
          title: 'Canon 2023 - Augustus Frostborne',
          category: 'LORE' as WikiCategory,
          tags: ['legacy-2023', 'augustus-frostborne', 'canon', 'personagem'],
          isPublic: true,
          content: `# Augustus Frostborne\n\n## Origem Canonica (2023)\nAugustus nasceu como humano com talento excepcional para magia em uma sociedade anti-magia.\nEle manteve seus dons em segredo por anos, carregando um colar de estrela azul e um grimorio antigo encontrado na floresta.\n\n## Marco Narrativo\nDurante um incendio na vila, Augustus usou magia para salvar casas e feridos.\nMesmo agindo para proteger todos, foi expulso por medo e preconceito.\nEsse exilio marca o inicio dos diarios e da jornada em terras desconhecidas.\n\n## Traços Canônicos\n- Classe: Mago\n- Antecedente: Sabio\n- Especialidade: Astronomo\n- Pericias: Investigacao, Medicina, Arcanismo, Historia\n- Idiomas: Comum e Elfico\n\n## Arquivos de origem\n- PROJETO-SITE-RPG--main/Augustus Frostborne/historia.html\n- PROJETO-SITE-RPG--main/Augustus Frostborne/dados.html\n\n## Observacao de legado\nEsta pagina preserva o texto base de 2023 e pode ser expandida com eventos de campanha, relacoes e linhas do tempo.`,
        },
        {
          title: 'Canon 2023 - Satoru Naitokira',
          category: 'LORE' as WikiCategory,
          tags: ['legacy-2023', 'satoru-naitokira', 'canon', 'personagem'],
          isPublic: true,
          content: `# Satoru Naitokira\n\n## Origem Canonica (2023)\nSatoru integra o nucleo fundacional do projeto ao lado de Augustus.\nA estrutura visual e narrativa dele no prototipo estabelece o tom dark fantasy pessoal do Campaign Hub.\n\n## Uso recomendado na Wiki Viva\n- Linha do tempo pessoal de sessoes\n- Relacoes com faccoes e locais\n- Diario de evolucao e motivacoes\n- Vinculos com eventos de campanha\n\n## Arquivos de origem\n- PROJETO-SITE-RPG--main/Satoru Naitokira/index.html\n- PROJETO-SITE-RPG--main/Satoru Naitokira/dados.html\n- PROJETO-SITE-RPG--main/Satoru Naitokira/criador.html\n\n## Observacao de legado\nA base visual e tematica de Satoru deve continuar como referencia estetica no sistema inteiro.`,
        },
        {
          title: 'Canon 2023 - Augustus Frostborne (Criador)',
          category: 'LORE' as WikiCategory,
          tags: ['legacy-2023', 'augustus-frostborne', 'criador', 'canon'],
          isPublic: true,
          content: `# Augustus Frostborne - Registro de Criacao\n\n## Fonte original\n- PROJETO-SITE-RPG--main/Augustus Frostborne/criador.html\n\n## Notas de identidade\n- Mantem o tom magico melancolico do projeto original\n- Referencia visual principal para paginas de personagem\n\n## Conexoes recomendadas\n- [[Canon 2023 - Augustus Frostborne]]\n- [[Canon 2023 - Galeria Dark Fantasy]]`,
        },
        {
          title: 'Canon 2023 - Satoru Naitokira (Background)',
          category: 'LORE' as WikiCategory,
          tags: ['legacy-2023', 'satoru-naitokira', 'background', 'canon'],
          isPublic: true,
          content: `# Satoru Naitokira - Background\n\n## Fonte original\n- PROJETO-SITE-RPG--main/Satoru Naitokira/background.html\n\n## Notas de campanha\nEste documento amplia o contexto do personagem para uso em cronicas, linha do tempo e relacoes com faccoes.\n\n## Conexoes recomendadas\n- [[Canon 2023 - Satoru Naitokira]]\n- [[Canon 2023 - Galeria Dark Fantasy]]`,
        },
        {
          title: 'Canon 2023 - Rolador 4d6 Drop Lowest',
          category: 'HOUSE_RULE' as WikiCategory,
          tags: ['legacy-2023', 'dice', '4d6', 'atributos'],
          isPublic: true,
          content: `# Rolador 4d6 (Drop Lowest)\n\n## Algoritmo original\n1. Rola 4 dados d6\n2. Ordena os resultados\n3. Remove o menor\n4. Soma os 3 maiores\n5. Repete 6 vezes para gerar atributos\n\n## Formula de referencia\n- Atributo: 4d6kh3\n- Bloco completo: repetir 6 vezes\n\n## Arquivo de origem\n- PROJETO-SITE-RPG--main/4d6.js\n\n## Nota de preservacao\nO algoritmo original em JavaScript puro permanece como patrimonio tecnico do projeto.`,
        },
        {
          title: 'Canon 2023 - Galeria Dark Fantasy',
          category: 'LORE' as WikiCategory,
          tags: ['legacy-2023', 'galeria', 'artes', 'atmosfera'],
          isPublic: true,
          content: `# Galeria Dark Fantasy\n\n## Curadoria original\nA galeria do prototipo de 2023 define a atmosfera medieval/dark fantasy da plataforma.\n\n## Diretriz artistica\n- Taverna, vilas, ruinas e florestas sombrias\n- Contraste de luz quente e sombra fria\n- Herois em jornada e criaturas de ameaca elevada\n\n## Uso no sistema atual\n- Capas de campanha\n- Planos de fundo da wiki\n- Cenas de sessao e handouts para mesa virtual\n\n## Fonte de origem\n- PROJETO-SITE-RPG--main/artes rpg/\n\n## Observacao\nToda nova tela deve respeitar a identidade visual estabelecida no legado.`,
        },
      ];

      const existing = await tx.wikiPage.findMany({
        where: {
          campaignId: input.campaignId,
          title: { in: legacyPages.map((page) => page.title) },
        },
        select: { id: true, title: true },
      });

      const existingTitles = new Set(existing.map((page) => page.title));

      const toCreate = legacyPages.filter((page) => !existingTitles.has(page.title));

      const createdPages = [];
      for (const page of toCreate) {
        const created = await tx.wikiPage.create({
          data: {
            campaignId: input.campaignId,
            createdBy: input.userId,
            title: page.title,
            content: page.content,
            category: page.category,
            tags: page.tags,
            isPublic: page.isPublic,
          },
          select: {
            id: true,
            title: true,
            category: true,
          },
        });
        createdPages.push(created);
      }

      return {
        createdCount: createdPages.length,
        skippedCount: legacyPages.length - createdPages.length,
        createdPages,
>>>>>>> bd47dd9da94ef8cb6fed9c2db135d6dcdeef18bd
      };
    });
  }
}

