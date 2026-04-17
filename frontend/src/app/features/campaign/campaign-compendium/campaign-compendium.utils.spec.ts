import { CompendiumEntry } from '../../../core/types';
import {
  getKnowledgePresenceScore,
  sortKnowledgeEntriesByPresence,
} from './campaign-compendium.utils';

const buildEntry = (
  name: string,
  overrides?: Partial<CompendiumEntry['links']>
): CompendiumEntry => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  systemSlug: 'dnd5e',
  kind: 'SPELL',
  name,
  summary: `${name} summary`,
  tags: ['legacy'],
  source: 'LEGACY',
  payload: {},
  links: {
    usedInSessions: [],
    usedAsCombatantCount: 0,
    linkedCharacters: [],
    referencedInWiki: [],
    ...overrides,
  },
});

describe('campaign-compendium.utils', () => {
  it('calcula score de presenca com peso maior para sessoes', () => {
    const entry = buildEntry('Frostborne Ember Ray', {
      usedInSessions: ['session-1', 'session-2'],
      linkedCharacters: [{ characterId: 'char-1', characterName: 'Augustus' }],
      referencedInWiki: [
        { wikiPageId: 'page-1', title: 'Pagina 1', updatedAt: new Date().toISOString() },
      ],
      usedAsCombatantCount: 1,
    });

    expect(getKnowledgePresenceScore(entry)).toBe(11);
  });

  it('ordena entradas por presenca e desempata por nome', () => {
    const sorted = sortKnowledgeEntriesByPresence([
      buildEntry('Zeta Ward'),
      buildEntry('Arcane Route', {
        usedInSessions: ['session-1'],
      }),
      buildEntry('Amber Sigil', {
        usedInSessions: ['session-1'],
      }),
    ]);

    expect(sorted.map((entry) => entry.name)).toEqual([
      'Amber Sigil',
      'Arcane Route',
      'Zeta Ward',
    ]);
  });
});
