import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

interface SearchOptions {
  campaignId: string;
  query: string;
  types?: ('wiki' | 'character' | 'session' | 'creature' | 'item')[];
  limit?: number;
  offset?: number;
}

interface SearchResult {
  type: 'wiki' | 'character' | 'session' | 'creature' | 'item';
  id: string;
  title: string;
  snippet: string;
  extra?: Record<string, unknown>;
}

export class SearchService {
  async fullTextSearch(options: SearchOptions): Promise<SearchResult[]> {
    const { campaignId, query, types, limit = 20, offset = 0 } = options;
    const results: SearchResult[] = [];
    const searchTypes = types || ['wiki', 'character', 'session', 'creature', 'item'];

    const searchPattern = `%${query}%`;

    // Search wiki pages
    if (searchTypes.includes('wiki')) {
      const wikiResults = await prisma.wikiPage.findMany({
        where: {
          campaignId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
        },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          icon: true,
        },
        take: Math.ceil(limit / searchTypes.length),
      });

      results.push(
        ...wikiResults.map((p) => ({
          type: 'wiki' as const,
          id: p.id,
          title: p.title,
          snippet: this.createSnippet(p.content, query),
          extra: { category: p.category, icon: p.icon },
        }))
      );
    }

    // Search characters
    if (searchTypes.includes('character')) {
      const characterResults = await prisma.character.findMany({
        where: {
          campaignId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { class: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          class: true,
          level: true,
          notes: true,
        },
        take: Math.ceil(limit / searchTypes.length),
      });

      results.push(
        ...characterResults.map((c) => ({
          type: 'character' as const,
          id: c.id,
          title: c.name,
          snippet: `Level ${c.level} ${c.class}`,
          extra: { class: c.class, level: c.level },
        }))
      );
    }

    // Search sessions
    if (searchTypes.includes('session')) {
      const sessionResults = await prisma.session.findMany({
        where: {
          campaignId,
          OR: [
            { summary: { contains: query, mode: 'insensitive' } },
            { narrativeLog: { contains: query, mode: 'insensitive' } },
            { highlights: { hasSome: [query] } },
          ],
        },
        select: {
          id: true,
          date: true,
          summary: true,
          highlights: true,
        },
        take: Math.ceil(limit / searchTypes.length),
      });

      results.push(
        ...sessionResults.map((s) => ({
          type: 'session' as const,
          id: s.id,
          title: `Session ${s.date.toLocaleDateString()}`,
          snippet: s.summary ? this.createSnippet(s.summary, query) : '',
          extra: { date: s.date },
        }))
      );
    }

    return results.slice(offset, offset + limit);
  }

  async searchWikiPages(campaignId: string, query: string) {
    return prisma.wikiPage.findMany({
      where: {
        campaignId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        icon: true,
        category: true,
      },
      take: 10,
    });
  }

  async getRecentPages(campaignId: string, limit: number = 10) {
    return prisma.wikiPage.findMany({
      where: { campaignId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        icon: true,
        category: true,
        updatedAt: true,
      },
      take: limit,
    });
  }

  private createSnippet(content: string, query: string, length: number = 150): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) {
      return content.substring(0, length) + (content.length > length ? '...' : '');
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 100);
    let snippet = content.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet += '...';

    return snippet;
  }
}
