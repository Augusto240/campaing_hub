export type CompendiumKind = 'BESTIARY' | 'SPELL' | 'ITEM' | 'CLASS';

export type CompendiumSource = 'SRD' | 'OGL' | 'LEGACY';

export interface CompendiumEntry {
  id: string;
  systemSlug: string;
  kind: CompendiumKind;
  name: string;
  summary: string;
  tags: string[];
  source: CompendiumSource;
  payload: Record<string, unknown>;
}

export interface FilterCompendiumInput {
  systemSlug: string;
  kind?: CompendiumKind;
  search?: string;
  limit: number;
}

const ENTRIES: CompendiumEntry[] = [
  {
    id: 'dnd5e-class-wizard',
    systemSlug: 'dnd5e',
    kind: 'CLASS',
    name: 'Wizard',
    summary: 'Conjurador arcano versatil com foco em grimorios e escolas de magia.',
    tags: ['arcane', 'intelligence', 'caster'],
    source: 'SRD',
    payload: { hitDie: 'd6', primaryAbility: 'INT' },
  },
  {
    id: 'dnd5e-spell-fireball',
    systemSlug: 'dnd5e',
    kind: 'SPELL',
    name: 'Fireball',
    summary: 'Explosao de fogo em area com alto dano e impacto tatico.',
    tags: ['evocation', 'aoe', 'damage'],
    source: 'SRD',
    payload: { level: 3, school: 'Evocation', range: '150 feet' },
  },
  {
    id: 'dnd5e-item-healing-potion',
    systemSlug: 'dnd5e',
    kind: 'ITEM',
    name: 'Potion of Healing',
    summary: 'Pocao comum para recuperacao rapida de pontos de vida.',
    tags: ['consumable', 'healing'],
    source: 'SRD',
    payload: { rarity: 'Common', effect: '2d4+2 HP' },
  },
  {
    id: 'dnd5e-bestiary-goblin',
    systemSlug: 'dnd5e',
    kind: 'BESTIARY',
    name: 'Goblin',
    summary: 'Humanoide pequeno, oportunista e perigoso em grupos.',
    tags: ['humanoid', 'low-cr'],
    source: 'SRD',
    payload: { cr: '1/4', xp: 50 },
  },
  {
    id: 'coc7e-class-investigator',
    systemSlug: 'coc7e',
    kind: 'CLASS',
    name: 'Investigator Archetype',
    summary: 'Perfil narrativo para investigadores enfrentando o horror cosmico.',
    tags: ['investigation', 'horror'],
    source: 'OGL',
    payload: { sanityFocus: true },
  },
  {
    id: 'coc7e-spell-elder-sign',
    systemSlug: 'coc7e',
    kind: 'SPELL',
    name: 'Elder Sign',
    summary: 'Ritual de protecao contra entidades do Mythos.',
    tags: ['ritual', 'ward', 'mythos'],
    source: 'OGL',
    payload: { cost: 'Sanity + POW', castTime: 'Hours' },
  },
  {
    id: 'coc7e-item-mythos-tome',
    systemSlug: 'coc7e',
    kind: 'ITEM',
    name: 'Mythos Tome',
    summary: 'Compendio proibido que concede conhecimento e cobra sanidade.',
    tags: ['book', 'mythos', 'sanity'],
    source: 'OGL',
    payload: { skillGain: 'Cthulhu Mythos', sanityLoss: '1d6' },
  },
  {
    id: 'coc7e-bestiary-deep-one',
    systemSlug: 'coc7e',
    kind: 'BESTIARY',
    name: 'Deep One',
    summary: 'Criatura anfibia ancestral serva de cultos marinhos.',
    tags: ['mythos', 'amphibious'],
    source: 'OGL',
    payload: { threat: 'Major', sanityLoss: '1d6/1d20' },
  },
  {
    id: 'tormenta20-class-arcanista',
    systemSlug: 'tormenta20',
    kind: 'CLASS',
    name: 'Arcanista',
    summary: 'Especialista em magias com alto teto de poder arcano.',
    tags: ['mana', 'arcano'],
    source: 'OGL',
    payload: { primaryAbility: 'INT', resource: 'Mana' },
  },
  {
    id: 'tormenta20-spell-bola-de-fogo',
    systemSlug: 'tormenta20',
    kind: 'SPELL',
    name: 'Bola de Fogo',
    summary: 'Magia ofensiva classica com dano em area.',
    tags: ['fogo', 'area', 'mana'],
    source: 'OGL',
    payload: { circle: 2, cost: 3 },
  },
  {
    id: 'tormenta20-item-pocao-mana',
    systemSlug: 'tormenta20',
    kind: 'ITEM',
    name: 'Pocao de Mana',
    summary: 'Recupera mana de conjuradores durante a aventura.',
    tags: ['mana', 'consumable'],
    source: 'OGL',
    payload: { effect: 'Recupera 1d6 PM' },
  },
  {
    id: 'tormenta20-bestiary-troll',
    systemSlug: 'tormenta20',
    kind: 'BESTIARY',
    name: 'Troll',
    summary: 'Monstro robusto com regeneracao perigosa.',
    tags: ['brute', 'regeneration'],
    source: 'OGL',
    payload: { nd: '7', role: 'Brutamontes' },
  },
];

const normalize = (value: string): string => value.trim().toLowerCase();

export const listAvailableCompendiumKinds = (): CompendiumKind[] => {
  return ['BESTIARY', 'SPELL', 'ITEM', 'CLASS'];
};

export const filterCompendiumEntries = (input: FilterCompendiumInput): CompendiumEntry[] => {
  const normalizedSearch = input.search ? normalize(input.search) : '';

  const bySystem = ENTRIES.filter((entry) => entry.systemSlug === input.systemSlug);
  const byKind = input.kind ? bySystem.filter((entry) => entry.kind === input.kind) : bySystem;
  const bySearch = normalizedSearch
    ? byKind.filter((entry) => {
        const haystack = `${entry.name} ${entry.summary} ${entry.tags.join(' ')}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : byKind;

  return bySearch.slice(0, input.limit);
};

export const getCompendiumKindTotals = (systemSlug: string): Record<CompendiumKind, number> => {
  const systemEntries = ENTRIES.filter((entry) => entry.systemSlug === systemSlug);

  return {
    BESTIARY: systemEntries.filter((entry) => entry.kind === 'BESTIARY').length,
    SPELL: systemEntries.filter((entry) => entry.kind === 'SPELL').length,
    ITEM: systemEntries.filter((entry) => entry.kind === 'ITEM').length,
    CLASS: systemEntries.filter((entry) => entry.kind === 'CLASS').length,
  };
};
