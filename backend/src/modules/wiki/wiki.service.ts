import { Prisma, WikiCategory } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';
import { WikiBacklinksService } from './wiki-backlinks.service';

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
  parentId?: string | null;
}

interface CreateWikiPageInput {
  campaignId: string;
  userId: string;
  title: string;
  content: string;
  category: WikiCategory;
  tags: string[];
  isPublic: boolean;
  parentId?: string;
  icon?: string;
  coverImage?: string;
}

interface UpdateWikiPageInput {
  userId: string;
  wikiPageId: string;
  title?: string;
  content?: string;
  category?: WikiCategory;
  tags?: string[];
  isPublic?: boolean;
  parentId?: string | null;
  icon?: string;
  coverImage?: string;
  position?: number;
  isFavorite?: boolean;
}

interface WikiTreeNode {
  id: string;
  title: string;
  icon: string | null;
  category: WikiCategory;
  isPublic: boolean;
  position: number;
  isFavorite: boolean;
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

export class WikiService {
  private backlinksService = new WikiBacklinksService();

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

  async listPages(input: ListWikiPagesInput) {
    const access = await this.getCampaignAccess(input.campaignId, input.userId);

    return prisma.wikiPage.findMany({
      where: {
        campaignId: access.campaignId,
        ...(input.category ? { category: input.category } : {}),
        ...(input.tag ? { tags: { has: input.tag } } : {}),
        ...buildSearchFilter(input.search),
        ...(access.isGm ? {} : { isPublic: true }),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { children: true, blocks: true },
        },
      },
      orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
      take: input.limit,
    });
  }

  async getPageTree(campaignId: string, userId: string): Promise<WikiTreeNode[]> {
    const access = await this.getCampaignAccess(campaignId, userId);

    const allPages = await prisma.wikiPage.findMany({
      where: {
        campaignId: access.campaignId,
        ...(access.isGm ? {} : { isPublic: true }),
      },
      select: {
        id: true,
        title: true,
        icon: true,
        category: true,
        isPublic: true,
        position: true,
        isFavorite: true,
        parentId: true,
      },
      orderBy: [{ position: 'asc' }, { title: 'asc' }],
    });

    // Build tree structure
    const pageMap = new Map<string, WikiTreeNode>();
    const rootPages: WikiTreeNode[] = [];

    // First pass: create nodes
    for (const page of allPages) {
      pageMap.set(page.id, {
        id: page.id,
        title: page.title,
        icon: page.icon,
        category: page.category,
        isPublic: page.isPublic,
        position: page.position,
        isFavorite: page.isFavorite,
        children: [],
      });
    }

    // Second pass: build hierarchy
    for (const page of allPages) {
      const node = pageMap.get(page.id)!;
      if (page.parentId && pageMap.has(page.parentId)) {
        pageMap.get(page.parentId)!.children.push(node);
      } else {
        rootPages.push(node);
      }
    }

    return rootPages;
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
            icon: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            icon: true,
            category: true,
          },
          orderBy: { position: 'asc' },
        },
        blocks: {
          orderBy: { position: 'asc' },
        },
        incomingLinks: {
          include: {
            sourcePage: {
              select: {
                id: true,
                title: true,
                icon: true,
                category: true,
              },
            },
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

    return page;
  }

  async createPage(input: CreateWikiPageInput) {
    return prisma.$transaction(async (tx) => {
      const access = await this.getCampaignAccess(input.campaignId, input.userId, tx);

      if (!input.isPublic && !access.isGm) {
        throw new AppError(403, 'Only GMs can create private wiki pages');
      }

      // Get max position for new page
      const maxPositionPage = await tx.wikiPage.findFirst({
        where: {
          campaignId: input.campaignId,
          parentId: input.parentId || null,
        },
        orderBy: { position: 'desc' },
      });
      const position = (maxPositionPage?.position ?? -1) + 1;

      const page = await tx.wikiPage.create({
        data: {
          campaignId: input.campaignId,
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags,
          createdBy: input.userId,
          isPublic: input.isPublic,
          parentId: input.parentId || null,
          icon: input.icon,
          coverImage: input.coverImage,
          position,
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

      // Update backlinks
      await this.backlinksService.updateBacklinks(page.id, input.campaignId, input.content);

      return page;
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

      const updatedPage = await tx.wikiPage.update({
        where: { id: input.wikiPageId },
        data: {
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags,
          isPublic: input.isPublic,
          parentId: input.parentId,
          icon: input.icon,
          coverImage: input.coverImage,
          position: input.position,
          isFavorite: input.isFavorite,
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

      // Update backlinks if content changed
      if (input.content !== undefined) {
        await this.backlinksService.updateBacklinks(
          updatedPage.id,
          page.campaignId,
          input.content
        );
      }

      return updatedPage;
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

      // Move children to parent or root
      await tx.wikiPage.updateMany({
        where: { parentId: wikiPageId },
        data: { parentId: page.parentId },
      });

      await tx.wikiPage.delete({
        where: { id: wikiPageId },
      });
    });
  }

  async movePage(wikiPageId: string, userId: string, newParentId: string | null, newPosition: number) {
    const page = await prisma.wikiPage.findUnique({
      where: { id: wikiPageId },
    });

    if (!page) {
      throw new AppError(404, 'Wiki page not found');
    }

    const access = await this.getCampaignAccess(page.campaignId, userId);
    if (!access.isGm && page.createdBy !== userId) {
      throw new AppError(403, 'You can only move your own wiki pages unless you are GM');
    }

    // Prevent circular reference
    if (newParentId) {
      let currentParent = newParentId;
      while (currentParent) {
        if (currentParent === wikiPageId) {
          throw new AppError(400, 'Cannot move page into its own descendant');
        }
        const parent = await prisma.wikiPage.findUnique({
          where: { id: currentParent },
          select: { parentId: true },
        });
        currentParent = parent?.parentId || '';
      }
    }

    return prisma.wikiPage.update({
      where: { id: wikiPageId },
      data: {
        parentId: newParentId,
        position: newPosition,
      },
    });
  }

  async toggleFavorite(wikiPageId: string, userId: string) {
    const page = await prisma.wikiPage.findUnique({
      where: { id: wikiPageId },
    });

    if (!page) {
      throw new AppError(404, 'Wiki page not found');
    }

    await this.getCampaignAccess(page.campaignId, userId);

    return prisma.wikiPage.update({
      where: { id: wikiPageId },
      data: {
        isFavorite: !page.isFavorite,
      },
    });
  }

  async getFavorites(campaignId: string, userId: string) {
    const access = await this.getCampaignAccess(campaignId, userId);

    return prisma.wikiPage.findMany({
      where: {
        campaignId: access.campaignId,
        isFavorite: true,
        ...(access.isGm ? {} : { isPublic: true }),
      },
      select: {
        id: true,
        title: true,
        icon: true,
        category: true,
      },
      orderBy: { title: 'asc' },
    });
  }
}
