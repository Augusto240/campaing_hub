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
});
