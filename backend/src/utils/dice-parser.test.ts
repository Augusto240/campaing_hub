import { parseAndRollDice } from './dice-parser';

describe('dice-parser', () => {
  it('should parse and roll a basic formula', () => {
    const rolled = parseAndRollDice('2d6+3');

    expect(rolled.normalizedFormula).toBe('2d6+3');
    expect(rolled.result).toBeGreaterThanOrEqual(5);
    expect(rolled.result).toBeLessThanOrEqual(15);
    expect(rolled.breakdown.rolledDice).toHaveLength(2);
  });

  it('should support advantage alias', () => {
    const rolled = parseAndRollDice('advantage');

    expect(rolled.normalizedFormula).toBe('2d20kh1');
    expect(rolled.breakdown.keptDice).toHaveLength(1);
    expect(rolled.breakdown.droppedDice).toHaveLength(1);
  });

  it('should resolve attribute modifier from context', () => {
    const rolled = parseAndRollDice('1d20+STR', {
      attributes: { STR: 16 },
      modifierFormula: 'floor((value - 10) / 2)',
    });

    expect(rolled.breakdown.modifier).toBe(3);
    expect(rolled.result).toBeGreaterThanOrEqual(4);
    expect(rolled.result).toBeLessThanOrEqual(23);
  });

  it('should throw on unsupported formula', () => {
    expect(() => parseAndRollDice('2x6+1')).toThrow('Unsupported dice formula');
  });
});

