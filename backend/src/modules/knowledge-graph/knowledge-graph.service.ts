import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';
import { filterCompendiumEntries } from '../compendium/compendium.data';

export type KnowledgeGraphNodeType =
  | 'WIKI_PAGE'
  | 'CHARACTER'
  | 'SESSION'
  | 'ITEM'
  | 'CREATURE'
  | 'COMPENDIUM_ENTRY';

export type KnowledgeGraphEdgeType =
  | 'WIKI_LINK'
  | 'WIKI_MENTION'
  | 'SESSION_COMBATANT'
  | 'CHARACTER_ITEM'
  | 'COMPENDIUM_REFERENCE';

export interface KnowledgeGraphNode {
  id: string;
  type: KnowledgeGraphNodeType;
  label: string;
  legacyAnchor: boolean;
  metadata: {
    campaignId: string;
    sourceId: string;
    category?: string;
    tags?: string[];
    updatedAt?: string;
  };
}

export interface KnowledgeGraphEdge {
  id: string;
  type: KnowledgeGraphEdgeType;
  source: string;
  target: string;
  weight: number;
  metadata: {
    reason: string;
  };
}

export interface CampaignKnowledgeGraph {
  campaignId: string;
  generatedAt: string;
  stats: {
    nodes: number;
    edges: number;
    legacyAnchors: number;
  };
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
const LEGACY_MENTION_PATTERN = /@([^\n@#.,;:!?()[\]{}]{2,80})/g;

const normalize = (value: string): string => value.trim().toLowerCase();

const toNodeId = (type: KnowledgeGraphNodeType, sourceId: string): string =>
  `${type.toLowerCase()}:${sourceId}`;

const hasLegacyCanonMarker = (value: string | null | undefined): boolean => {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return (
    normalized.includes('augustus frostborne') ||
    normalized.includes('satoru naitokira') ||
    normalized.includes('canon 2023')
  );
};

const extractWikiMentions = (content: string): string[] => {
  const references = new Map<string, string>();

  const bracketMatches = content.matchAll(WIKI_LINK_PATTERN);
  for (const match of bracketMatches) {
    const title = match[1]?.trim();
    if (!title) {
      continue;
    }

    const key = normalize(title);
    if (!references.has(key)) {
      references.set(key, title);
    }
  }

  const mentionMatches = content.matchAll(LEGACY_MENTION_PATTERN);
  for (const match of mentionMatches) {
    const title = match[1]?.trim();
    if (!title) {
      continue;
    }

    const key = normalize(title);
    if (!references.has(key)) {
      references.set(key, title);
    }
  }

  return [...references.values()];
};

const parseInventoryNames = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => !!entry && typeof entry === 'object')
    .map((entry) => {
      const record = entry as { name?: unknown };
      return typeof record.name === 'string' ? record.name.trim() : '';
    })
    .filter((name) => name.length > 0);
};

export class KnowledgeGraphService {
  private async resolveCampaignContext(campaignId: string, userId: string) {
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
            id: true,
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
      systemSlug: campaign.systemTemplate?.slug ?? campaign.system,
      isOwner: campaign.ownerId === userId,
    };
  }

  async buildCampaignGraph(campaignId: string, userId: string, limit = 140): Promise<CampaignKnowledgeGraph> {
    const context = await this.resolveCampaignContext(campaignId, userId);
    const safeLimit = Math.min(Math.max(limit, 20), 500);

    const [wikiPages, characters, sessions, items, creatures, combatants] = await Promise.all([
      prisma.wikiPage.findMany({
        where: {
          campaignId: context.campaignId,
        },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          tags: true,
          legacySource: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: Math.min(safeLimit, 220),
      }),
      prisma.character.findMany({
        where: {
          campaignId: context.campaignId,
        },
        select: {
          id: true,
          name: true,
          notes: true,
          inventory: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: Math.min(safeLimit, 220),
      }),
      prisma.session.findMany({
        where: {
          campaignId: context.campaignId,
        },
        select: {
          id: true,
          date: true,
          summary: true,
          narrativeLog: true,
          updatedAt: true,
        },
        orderBy: {
          date: 'desc',
        },
        take: Math.min(safeLimit, 220),
      }),
      prisma.item.findMany({
        where: {
          systemTemplate: {
            campaigns: {
              some: {
                id: context.campaignId,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
        take: Math.min(Math.floor(safeLimit / 2), 120),
      }),
      prisma.creature.findMany({
        where: {
          OR: [
            {
              systemTemplate: {
                campaigns: {
                  some: {
                    id: context.campaignId,
                  },
                },
              },
              isPublic: true,
            },
            {
              createdBy: userId,
            },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Math.min(Math.floor(safeLimit / 2), 120),
      }),
      prisma.combatant.findMany({
        where: {
          encounter: {
            session: {
              campaignId: context.campaignId,
            },
          },
          characterId: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          characterId: true,
          encounter: {
            select: {
              sessionId: true,
            },
          },
        },
        take: Math.min(safeLimit, 260),
      }),
    ]);

    const compendiumEntries = filterCompendiumEntries({
      systemSlug: context.systemSlug,
      limit: Math.min(Math.floor(safeLimit / 2), 80),
    });

    const nodes: KnowledgeGraphNode[] = [];
    const edges: KnowledgeGraphEdge[] = [];

    const seenNode = new Set<string>();
    const seenEdge = new Set<string>();

    const addNode = (node: KnowledgeGraphNode) => {
      if (seenNode.has(node.id)) {
        return;
      }

      seenNode.add(node.id);
      nodes.push(node);
    };

    const addEdge = (edge: Omit<KnowledgeGraphEdge, 'id'>) => {
      const id = `${edge.type}:${edge.source}->${edge.target}`;
      if (seenEdge.has(id)) {
        return;
      }

      seenEdge.add(id);
      edges.push({
        id,
        ...edge,
      });
    };

    const titleIndex = new Map<string, KnowledgeGraphNode>();

    for (const page of wikiPages) {
      const node: KnowledgeGraphNode = {
        id: toNodeId('WIKI_PAGE', page.id),
        type: 'WIKI_PAGE',
        label: page.title,
        legacyAnchor: Boolean(page.legacySource) || hasLegacyCanonMarker(`${page.title} ${page.content}`),
        metadata: {
          campaignId: context.campaignId,
          sourceId: page.id,
          category: page.category,
          tags: page.tags,
          updatedAt: page.updatedAt.toISOString(),
        },
      };

      addNode(node);
      titleIndex.set(normalize(page.title), node);
    }

    for (const character of characters) {
      const node: KnowledgeGraphNode = {
        id: toNodeId('CHARACTER', character.id),
        type: 'CHARACTER',
        label: character.name,
        legacyAnchor: hasLegacyCanonMarker(`${character.name} ${character.notes ?? ''}`),
        metadata: {
          campaignId: context.campaignId,
          sourceId: character.id,
          category: 'character',
          updatedAt: character.updatedAt.toISOString(),
        },
      };

      addNode(node);
      titleIndex.set(normalize(character.name), node);
    }

    for (const session of sessions) {
      const label = session.summary?.trim().length
        ? session.summary
        : `Sessao ${session.date.toISOString().slice(0, 10)}`;

      const node: KnowledgeGraphNode = {
        id: toNodeId('SESSION', session.id),
        type: 'SESSION',
        label,
        legacyAnchor: hasLegacyCanonMarker(`${session.summary ?? ''} ${session.narrativeLog ?? ''}`),
        metadata: {
          campaignId: context.campaignId,
          sourceId: session.id,
          category: 'session',
          updatedAt: session.updatedAt.toISOString(),
        },
      };

      addNode(node);
      titleIndex.set(normalize(label), node);
    }

    for (const item of items) {
      const node: KnowledgeGraphNode = {
        id: toNodeId('ITEM', item.id),
        type: 'ITEM',
        label: item.name,
        legacyAnchor: hasLegacyCanonMarker(`${item.name} ${item.description ?? ''}`),
        metadata: {
          campaignId: context.campaignId,
          sourceId: item.id,
          category: 'item',
        },
      };

      addNode(node);
      titleIndex.set(normalize(item.name), node);
    }

    for (const creature of creatures) {
      const node: KnowledgeGraphNode = {
        id: toNodeId('CREATURE', creature.id),
        type: 'CREATURE',
        label: creature.name,
        legacyAnchor: hasLegacyCanonMarker(`${creature.name} ${creature.description ?? ''}`),
        metadata: {
          campaignId: context.campaignId,
          sourceId: creature.id,
          category: 'creature',
          updatedAt: creature.createdAt.toISOString(),
        },
      };

      addNode(node);
      titleIndex.set(normalize(creature.name), node);
    }

    for (const entry of compendiumEntries) {
      const node: KnowledgeGraphNode = {
        id: toNodeId('COMPENDIUM_ENTRY', entry.id),
        type: 'COMPENDIUM_ENTRY',
        label: entry.name,
        legacyAnchor: false,
        metadata: {
          campaignId: context.campaignId,
          sourceId: entry.id,
          category: entry.kind,
          tags: entry.tags,
        },
      };

      addNode(node);

      const linkedTarget = titleIndex.get(normalize(entry.name));
      if (linkedTarget) {
        addEdge({
          type: 'COMPENDIUM_REFERENCE',
          source: node.id,
          target: linkedTarget.id,
          weight: 0.85,
          metadata: {
            reason: 'Nome equivalente no compendium e entidade da campanha',
          },
        });
      }
    }

    for (const page of wikiPages) {
      const sourceNodeId = toNodeId('WIKI_PAGE', page.id);
      const references = extractWikiMentions(page.content);

      for (const reference of references) {
        const target = titleIndex.get(normalize(reference));
        if (!target) {
          continue;
        }

        addEdge({
          type: target.type === 'WIKI_PAGE' ? 'WIKI_LINK' : 'WIKI_MENTION',
          source: sourceNodeId,
          target: target.id,
          weight: 1,
          metadata: {
            reason: `Referencia encontrada em conteudo wiki: ${reference}`,
          },
        });
      }
    }

    const sessionNodeById = new Map<string, string>();
    for (const session of sessions) {
      sessionNodeById.set(session.id, toNodeId('SESSION', session.id));
    }

    for (const combatant of combatants) {
      if (!combatant.characterId) {
        continue;
      }

      const source = sessionNodeById.get(combatant.encounter.sessionId);
      if (!source) {
        continue;
      }

      const target = toNodeId('CHARACTER', combatant.characterId);
      if (!seenNode.has(target)) {
        continue;
      }

      addEdge({
        type: 'SESSION_COMBATANT',
        source,
        target,
        weight: 0.9,
        metadata: {
          reason: `Combatente ${combatant.name} usado no encontro`,
        },
      });
    }

    const itemNodeByName = new Map<string, string>();
    for (const item of items) {
      itemNodeByName.set(normalize(item.name), toNodeId('ITEM', item.id));
    }

    for (const character of characters) {
      const inventoryNames = parseInventoryNames(character.inventory);
      for (const itemName of inventoryNames) {
        const target = itemNodeByName.get(normalize(itemName));
        if (!target) {
          continue;
        }

        addEdge({
          type: 'CHARACTER_ITEM',
          source: toNodeId('CHARACTER', character.id),
          target,
          weight: 0.75,
          metadata: {
            reason: `Item de inventario: ${itemName}`,
          },
        });
      }
    }

    const trimmedNodes = nodes.slice(0, safeLimit);
    const trimmedNodeIds = new Set(trimmedNodes.map((node) => node.id));
    const trimmedEdges = edges
      .filter((edge) => trimmedNodeIds.has(edge.source) && trimmedNodeIds.has(edge.target))
      .slice(0, safeLimit * 3);

    return {
      campaignId: context.campaignId,
      generatedAt: new Date().toISOString(),
      stats: {
        nodes: trimmedNodes.length,
        edges: trimmedEdges.length,
        legacyAnchors: trimmedNodes.filter((node) => node.legacyAnchor).length,
      },
      nodes: trimmedNodes,
      edges: trimmedEdges,
    };
  }
}
