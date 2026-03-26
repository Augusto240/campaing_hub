import { WikiBlockType, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';

interface CreateBlockInput {
  pageId: string;
  type: WikiBlockType;
  content: Record<string, unknown>;
  position?: number;
  indent?: number;
  isChecked?: boolean;
}

interface UpdateBlockInput {
  blockId: string;
  type?: WikiBlockType;
  content?: Record<string, unknown>;
  position?: number;
  indent?: number;
  isChecked?: boolean;
}

interface ReorderBlocksInput {
  pageId: string;
  blockIds: string[];
}

export class WikiBlocksService {
  async getBlocksByPage(pageId: string) {
    return prisma.wikiBlock.findMany({
      where: { pageId },
      orderBy: { position: 'asc' },
    });
  }

  async createBlock(input: CreateBlockInput) {
    const page = await prisma.wikiPage.findUnique({
      where: { id: input.pageId },
    });

    if (!page) {
      throw new AppError(404, 'Wiki page not found');
    }

    // Get max position if not specified
    let position = input.position;
    if (position === undefined) {
      const maxBlock = await prisma.wikiBlock.findFirst({
        where: { pageId: input.pageId },
        orderBy: { position: 'desc' },
      });
      position = (maxBlock?.position ?? -1) + 1;
    }

    return prisma.wikiBlock.create({
      data: {
        pageId: input.pageId,
        type: input.type,
        content: input.content as Prisma.InputJsonValue,
        position,
        indent: input.indent ?? 0,
        isChecked: input.isChecked,
      },
    });
  }

  async updateBlock(input: UpdateBlockInput) {
    const block = await prisma.wikiBlock.findUnique({
      where: { id: input.blockId },
    });

    if (!block) {
      throw new AppError(404, 'Block not found');
    }

    return prisma.wikiBlock.update({
      where: { id: input.blockId },
      data: {
        type: input.type,
        content: input.content as Prisma.InputJsonValue,
        position: input.position,
        indent: input.indent,
        isChecked: input.isChecked,
      },
    });
  }

  async deleteBlock(blockId: string) {
    const block = await prisma.wikiBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new AppError(404, 'Block not found');
    }

    await prisma.wikiBlock.delete({
      where: { id: blockId },
    });
  }

  async reorderBlocks(input: ReorderBlocksInput) {
    const updates = input.blockIds.map((id, index) =>
      prisma.wikiBlock.update({
        where: { id },
        data: { position: index },
      })
    );

    await prisma.$transaction(updates);
  }

  async duplicateBlock(blockId: string) {
    const block = await prisma.wikiBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new AppError(404, 'Block not found');
    }

    // Shift positions of blocks after this one
    await prisma.wikiBlock.updateMany({
      where: {
        pageId: block.pageId,
        position: { gt: block.position },
      },
      data: {
        position: { increment: 1 },
      },
    });

    return prisma.wikiBlock.create({
      data: {
        pageId: block.pageId,
        type: block.type,
        content: block.content as Prisma.InputJsonValue,
        position: block.position + 1,
        indent: block.indent,
        isChecked: block.isChecked,
      },
    });
  }
}
