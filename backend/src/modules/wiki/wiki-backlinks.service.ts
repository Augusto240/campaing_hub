import { prisma } from '../../config/database';

interface ParsedLink {
  title: string;
  context: string;
}

export class WikiBacklinksService {
  // Regex to find wiki links like [[Page Title]] or @Page Title
  private readonly LINK_REGEX = /\[\[([^\]]+)\]\]|@([^\s\n,.:;!?]+(?:\s[^\s\n,.:;!?]+)*)/g;

  parseLinksFromContent(content: string): ParsedLink[] {
    const links: ParsedLink[] = [];
    let match;

    while ((match = this.LINK_REGEX.exec(content)) !== null) {
      const title = match[1] || match[2];
      const startIndex = Math.max(0, match.index - 50);
      const endIndex = Math.min(content.length, match.index + match[0].length + 50);
      const context = content.substring(startIndex, endIndex);

      links.push({ title: title.trim(), context });
    }

    return links;
  }

  async updateBacklinks(sourcePageId: string, campaignId: string, content: string) {
    const parsedLinks = this.parseLinksFromContent(content);

    // Delete existing backlinks from this source
    await prisma.wikiBacklink.deleteMany({
      where: { sourcePageId },
    });

    if (parsedLinks.length === 0) return;

    // Find target pages by title
    const titles = parsedLinks.map((l) => l.title.toLowerCase());
    const targetPages = await prisma.wikiPage.findMany({
      where: {
        campaignId,
        title: {
          in: titles,
          mode: 'insensitive',
        },
      },
      select: { id: true, title: true },
    });

    // Create backlinks
    const backlinksToCreate = parsedLinks
      .map((link) => {
        const target = targetPages.find(
          (p) => p.title.toLowerCase() === link.title.toLowerCase()
        );
        if (!target || target.id === sourcePageId) return null;

        return {
          sourcePageId,
          targetPageId: target.id,
          context: link.context,
        };
      })
      .filter(Boolean) as { sourcePageId: string; targetPageId: string; context: string }[];

    // Remove duplicates
    const uniqueBacklinks = backlinksToCreate.filter(
      (link, index, self) =>
        index === self.findIndex((l) => l.targetPageId === link.targetPageId)
    );

    if (uniqueBacklinks.length > 0) {
      await prisma.wikiBacklink.createMany({
        data: uniqueBacklinks,
        skipDuplicates: true,
      });
    }
  }

  async getBacklinksForPage(pageId: string) {
    return prisma.wikiBacklink.findMany({
      where: { targetPageId: pageId },
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
    });
  }

  async getOutgoingLinks(pageId: string) {
    return prisma.wikiBacklink.findMany({
      where: { sourcePageId: pageId },
      include: {
        targetPage: {
          select: {
            id: true,
            title: true,
            icon: true,
            category: true,
          },
        },
      },
    });
  }
}
