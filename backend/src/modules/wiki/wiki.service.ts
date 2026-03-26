import { Prisma, WikiCategory } from '@prisma/client';
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

  async listPages(input: ListWikiPagesInput) {
    const access = await this.getCampaignAccess(input.campaignId, input.userId);

    return prisma.wikiPage.findMany({
      where: {
        campaignId: access.campaignId,
        ...(input.category ? { category: input.category } : {}),
        ...(input.tag ? { tags: { has: input.tag } } : {}),
        ...buildSearchFilter(input.search),
        ...(access.isGm ? {} : { isPublic: true }),
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
      orderBy: { updatedAt: 'desc' },
      take: input.limit,
    });
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
}

