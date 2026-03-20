import { AppError } from './error-handler';

interface DiceParserContext {
  attributes?: Record<string, unknown>;
  modifierFormula?: string;
}

export interface DiceParserResult {
  normalizedFormula: string;
  result: number;
  breakdown: {
    rolledDice: number[];
    keptDice: number[];
    droppedDice: number[];
    baseTotal: number;
    modifier: number;
    modifierSource: string | null;
  };
}

const DICE_FORMULA_REGEX = /^(\d{1,3})d(\d{1,4})(k[hl]\d{1,3})?((?:[+-]\d+)|(?:[+-][a-z]{2,10}))?$/i;

const normalizeNamedFormula = (formula: string): string => {
  const normalized = formula.trim().toLowerCase();
  if (normalized === 'advantage') {
    return '2d20kh1';
  }
  if (normalized === 'disadvantage') {
    return '2d20kl1';
  }
  return formula.trim();
};

const rollDie = (sides: number): number => Math.floor(Math.random() * sides) + 1;

const parseAttributeModifier = (
  token: string,
  context?: DiceParserContext
): { modifier: number; source: string } => {
  const signal = token.startsWith('-') ? -1 : 1;
  const attrKey = token.replace(/^[+-]/, '').toUpperCase();

  if (!context?.attributes) {
    throw new AppError(400, `Formula uses attribute modifier "${attrKey}" without character context`);
  }

  const raw = context.attributes[attrKey];
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    throw new AppError(400, `Attribute "${attrKey}" not found or invalid for formula modifier`);
  }

  const modifierFormula = context.modifierFormula?.toLowerCase() ?? '';
  const baseModifier =
    modifierFormula === 'none' ? raw : Math.floor((raw - 10) / 2);

  return {
    modifier: baseModifier * signal,
    source: attrKey,
  };
};

const resolveModifier = (
  modifierToken: string | undefined,
  context?: DiceParserContext
): { modifier: number; source: string | null } => {
  if (!modifierToken) {
    return { modifier: 0, source: null };
  }

  if (/^[+-]\d+$/i.test(modifierToken)) {
    return { modifier: Number(modifierToken), source: 'flat' };
  }

  if (/^[+-][a-z]{2,10}$/i.test(modifierToken)) {
    const fromAttribute = parseAttributeModifier(modifierToken, context);
    return { modifier: fromAttribute.modifier, source: fromAttribute.source };
  }

  throw new AppError(400, `Invalid modifier format in formula: ${modifierToken}`);
};

export const parseAndRollDice = (
  formulaInput: string,
  context?: DiceParserContext
): DiceParserResult => {
  const normalizedFormula = normalizeNamedFormula(formulaInput);
  const match = normalizedFormula.match(DICE_FORMULA_REGEX);

  if (!match) {
    throw new AppError(
      400,
      'Unsupported dice formula. Supported: 2d6+3, 4d6kh3, 1d100, advantage, disadvantage, 1d20+STR'
    );
  }

  const [, countRaw, sidesRaw, keepRaw, modifierRaw] = match;
  const diceCount = Number(countRaw);
  const diceSides = Number(sidesRaw);

  if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > 100) {
    throw new AppError(400, 'Dice count must be between 1 and 100');
  }

  if (!Number.isInteger(diceSides) || diceSides < 2 || diceSides > 1000) {
    throw new AppError(400, 'Dice sides must be between 2 and 1000');
  }

  const rolledDice = Array.from({ length: diceCount }, () => rollDie(diceSides));
  let keptDice = [...rolledDice];
  let droppedDice: number[] = [];

  if (keepRaw) {
    const keepType = keepRaw.slice(0, 2).toLowerCase();
    const keepCount = Number(keepRaw.slice(2));

    if (!Number.isInteger(keepCount) || keepCount < 1 || keepCount > diceCount) {
      throw new AppError(400, 'Keep count must be between 1 and dice count');
    }

    const sorted = [...rolledDice].sort((a, b) => a - b);
    if (keepType === 'kh') {
      keptDice = sorted.slice(-keepCount);
      droppedDice = sorted.slice(0, Math.max(0, sorted.length - keepCount));
    } else if (keepType === 'kl') {
      keptDice = sorted.slice(0, keepCount);
      droppedDice = sorted.slice(keepCount);
    } else {
      throw new AppError(400, `Unsupported keep modifier "${keepType}"`);
    }
  }

  const baseTotal = keptDice.reduce((total, value) => total + value, 0);
  const { modifier, source } = resolveModifier(modifierRaw, context);
  const result = baseTotal + modifier;

  return {
    normalizedFormula,
    result,
    breakdown: {
      rolledDice,
      keptDice,
      droppedDice,
      baseTotal,
      modifier,
      modifierSource: source,
    },
  };
};

