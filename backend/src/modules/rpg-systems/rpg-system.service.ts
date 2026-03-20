import { Prisma, RpgSystem } from '@prisma/client';
import { prisma } from '../../config/database';

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

interface RpgSystemSeedInput {
  name: string;
  slug: string;
  description: string;
  diceFormula: string;
  attributeSchema: Prisma.InputJsonValue;
  xpTable?: Prisma.InputJsonValue;
  hasSpellSlots?: boolean;
  hasSanity?: boolean;
  hasMana?: boolean;
  hasHeroPoints?: boolean;
}

const defaultSystems: RpgSystemSeedInput[] = [
  {
    name: 'D&D 5e',
    slug: 'dnd5e',
    description: 'Dungeons & Dragons 5a edicao',
    diceFormula: '1d20',
    attributeSchema: {
      primary: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
      range: [1, 30],
      modifierFormula: 'floor((value - 10) / 2)',
      savingThrows: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
      skills: [
        'Acrobatics',
        'Animal Handling',
        'Arcana',
        'Athletics',
        'Deception',
        'History',
        'Insight',
        'Intimidation',
        'Investigation',
        'Medicine',
        'Nature',
        'Perception',
        'Performance',
        'Persuasion',
        'Religion',
        'Sleight of Hand',
        'Stealth',
        'Survival',
      ],
    },
    xpTable: {
      1: 0,
      2: 300,
      3: 900,
      4: 2700,
      5: 6500,
      6: 14000,
      7: 23000,
      8: 34000,
      9: 48000,
      10: 64000,
      11: 85000,
      12: 100000,
      13: 120000,
      14: 140000,
      15: 165000,
      16: 195000,
      17: 225000,
      18: 265000,
      19: 305000,
      20: 355000,
    },
    hasSpellSlots: true,
  },
  {
    name: 'Pathfinder 2e',
    slug: 'pf2e',
    description: 'Pathfinder 2a edicao',
    diceFormula: '1d20',
    attributeSchema: {
      primary: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
      range: [1, 30],
      modifierFormula: 'floor((value - 10) / 2)',
      actionsPerTurn: 3,
      hasHeroPoints: true,
    },
    hasHeroPoints: true,
  },
  {
    name: 'Call of Cthulhu 7e',
    slug: 'coc7e',
    description: 'Call of Cthulhu 7a edicao',
    diceFormula: '1d100',
    attributeSchema: {
      primary: ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU'],
      range: [1, 100],
      modifierFormula: 'none',
      derivedStats: ['HP', 'MP', 'Sanity', 'Luck'],
      hasOccupation: true,
      hasMyths: true,
    },
    hasSanity: true,
  },
  {
    name: 'Tormenta20',
    slug: 'tormenta20',
    description: 'Sistema Tormenta20',
    diceFormula: '1d20',
    attributeSchema: {
      primary: ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'],
      range: [1, 30],
      modifierFormula: 'floor((value - 10) / 2)',
      hasMana: true,
      deities: ['Azgher', 'Megalokk', 'Marah', 'Tanna-Toh', 'Nimb'],
      races: ['Humano', 'Elfo', 'Anao', 'Dahllan', 'Golem', 'Lefou'],
    },
    hasMana: true,
  },
];

const normalizeSystemKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const systemAliasToSlug: Record<string, string> = {
  dnd: 'dnd5e',
  dnd5e: 'dnd5e',
  dungeonsdragons5e: 'dnd5e',
  pf2e: 'pf2e',
  pathfinder2e: 'pf2e',
  pathfinder: 'pf2e',
  coc: 'coc7e',
  coc7e: 'coc7e',
  callofcthulhu7e: 'coc7e',
  callofcthulhu: 'coc7e',
  t20: 'tormenta20',
  tormenta20: 'tormenta20',
};

const resolveSlugFromInput = (input: string): string => {
  const normalized = normalizeSystemKey(input);
  return systemAliasToSlug[normalized] || normalized;
};

export class RpgSystemService {
  async ensureDefaultSystems(): Promise<void> {
    await prisma.$transaction(
      defaultSystems.map((systemSeed) =>
        prisma.rpgSystem.upsert({
          where: { slug: systemSeed.slug },
          create: {
            ...systemSeed,
          },
          update: {
            name: systemSeed.name,
            description: systemSeed.description,
            diceFormula: systemSeed.diceFormula,
            attributeSchema: systemSeed.attributeSchema,
            xpTable: systemSeed.xpTable ?? Prisma.DbNull,
            hasSpellSlots: systemSeed.hasSpellSlots ?? false,
            hasSanity: systemSeed.hasSanity ?? false,
            hasMana: systemSeed.hasMana ?? false,
            hasHeroPoints: systemSeed.hasHeroPoints ?? false,
          },
        })
      )
    );
  }

  async getSystems() {
    return prisma.rpgSystem.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async resolveSystemFromInput(
    input: string,
    client: PrismaClientLike = prisma
  ): Promise<RpgSystem | null> {
    const slug = resolveSlugFromInput(input);

    return client.rpgSystem.findFirst({
      where: {
        OR: [{ slug }, { name: { equals: input, mode: 'insensitive' } }],
      },
    });
  }
}
