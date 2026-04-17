declare const describe: any;
declare const expect: any;
declare const it: any;

import { STARTER_WIKI_PACK } from './wiki-starter-content';

describe('wiki-starter-content', () => {
  it('mantem starter sources unicos e pais validos', () => {
    const sources = STARTER_WIKI_PACK.map((entry) => entry.starterSource);
    const uniqueSources = new Set(sources);

    expect(uniqueSources.size).toBe(sources.length);

    for (const entry of STARTER_WIKI_PACK) {
      if (!entry.parentStarterSource) {
        continue;
      }

      expect(uniqueSources.has(entry.parentStarterSource)).toBe(true);
    }
  });

  it('inclui paginas de memoria, playbook e template para a mesa viva', () => {
    const titles = STARTER_WIKI_PACK.map((entry) => entry.title);

    expect(titles).toContain('Memory Graph - Eixos do Legado');
    expect(titles).toContain('Playbook - Biblioteca Silente');
    expect(titles).toContain('Template - Briefing de Encontro');
  });
});
