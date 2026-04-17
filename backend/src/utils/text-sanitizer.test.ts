import { containsLikelyMojibake, repairLikelyMojibake } from './text-sanitizer';

describe('text-sanitizer', () => {
  it('keeps valid UTF-8 text unchanged', () => {
    const result = repairLikelyMojibake('Descrição da campanha');

    expect(result).toEqual({
      status: 'unchanged',
      original: 'Descrição da campanha',
      value: 'Descrição da campanha',
    });
  });

  it('repairs latin1 mojibake safely', () => {
    const result = repairLikelyMojibake('DescriÃ§Ã£o da campanha');

    expect(result.status).toBe('repaired');
    expect(result.value).toBe('Descrição da campanha');
    expect(result.reason).toBe('latin1->utf8');
  });

  it('repairs cp437-style mojibake safely', () => {
    const result = repairLikelyMojibake('T├¡tulo da p├ígina');

    expect(result.status).toBe('repaired');
    expect(result.value).toBe('Título da página');
    expect(result.reason).toBe('cp437-map');
  });

  it('flags text with replacement characters for manual review', () => {
    const result = repairLikelyMojibake('Descri�ão da campanha');

    expect(result.status).toBe('flagged');
    expect(result.value).toBe('Descri�ão da campanha');
  });

  it('detects likely mojibake markers', () => {
    expect(containsLikelyMojibake('Conex├Áes da Página')).toBe(true);
    expect(containsLikelyMojibake('Conexões da Página')).toBe(false);
  });
});
