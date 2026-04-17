declare const describe: any;
declare const expect: any;
declare const it: any;

import {
  filterCompendiumEntries,
  getCompendiumKindTotals,
  listAvailableCompendiumKinds,
} from './compendium.data';

describe('compendium.data', () => {
  it('retorna tipos disponiveis do compendio', () => {
    expect(listAvailableCompendiumKinds()).toEqual(['BESTIARY', 'SPELL', 'ITEM', 'CLASS']);
  });

  it('filtra entradas por sistema e tipo', () => {
    const entries = filterCompendiumEntries({
      systemSlug: 'dnd5e',
      kind: 'SPELL',
      limit: 20,
    });

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.systemSlug === 'dnd5e' && entry.kind === 'SPELL')).toBe(true);
  });

  it('filtra por busca textual sem diferenciar maiusculas', () => {
    const entries = filterCompendiumEntries({
      systemSlug: 'tormenta20',
      search: 'BOLA de fogo',
      limit: 20,
    });

    expect(entries.some((entry) => entry.name === 'Bola de Fogo')).toBe(true);
  });

  it('retorna totais por tipo para um sistema', () => {
    const totals = getCompendiumKindTotals('coc7e');

    expect(totals.BESTIARY).toBeGreaterThan(0);
    expect(totals.ITEM).toBeGreaterThan(0);
    expect(totals.SPELL).toBeGreaterThan(0);
    expect(totals.CLASS).toBeGreaterThan(0);
  });

  it('inclui referencias rapidas de mesa no compendio dnd5e', () => {
    const entries = filterCompendiumEntries({
      systemSlug: 'dnd5e',
      search: 'opportunity attack',
      limit: 20,
    });

    expect(entries.some((entry) => entry.name === 'Quick Rule - Opportunity Attack')).toBe(true);
  });

  it('mantem entradas legado e investigativas prontas para a wiki viva', () => {
    const legacyEntries = filterCompendiumEntries({
      systemSlug: 'dnd5e',
      search: 'frostborne',
      limit: 20,
    });

    const utilityEntries = filterCompendiumEntries({
      systemSlug: 'dnd5e',
      search: 'detect magic',
      limit: 20,
    });

    expect(legacyEntries.some((entry) => entry.name === 'Frostborne Ember Ray')).toBe(true);
    expect(legacyEntries.some((entry) => entry.name === 'Frostborne Star Compass')).toBe(true);
    expect(utilityEntries.some((entry) => entry.name === 'Detect Magic')).toBe(true);
  });
});
