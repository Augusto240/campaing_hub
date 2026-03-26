import { SpellSchool, MagicType, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';

// ==== SPELL INTERFACES ====
interface CreateSpellInput {
  systemId: string;
  name: string;
  level: number;
  school: SpellSchool;
  magicType?: MagicType;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  higherLevels?: string;
  ritual?: boolean;
  concentration?: boolean;
  classes?: string[];
  source?: string;
  isHomebrew?: boolean;
  createdBy?: string;
}

interface SpellFilters {
  systemId: string;
  level?: number;
  school?: SpellSchool;
  class?: string;
  ritual?: boolean;
  concentration?: boolean;
  search?: string;
}

// ==== CLASS INTERFACES ====
interface CreateClassInput {
  systemId: string;
  name: string;
  description: string;
  hitDie: string;
  primaryAbility: string;
  savingThrows?: string[];
  skills?: string[];
  equipment?: unknown;
  features: unknown;
  subclasses?: unknown;
  spellcasting?: unknown;
  source?: string;
  isHomebrew?: boolean;
  createdBy?: string;
}

// ==== ANCESTRY INTERFACES ====
interface CreateAncestryInput {
  systemId: string;
  name: string;
  description: string;
  speed?: number;
  size?: string;
  traits: unknown;
  languages?: string[];
  subraces?: unknown;
  source?: string;
  isHomebrew?: boolean;
  createdBy?: string;
}

// ==== CONDITION INTERFACES ====
interface CreateConditionInput {
  systemId: string;
  name: string;
  description: string;
  effects: unknown;
  icon?: string;
  color?: string;
  source?: string;
}

// ==== BACKGROUND INTERFACES ====
interface CreateBackgroundInput {
  systemId: string;
  name: string;
  description: string;
  skillProficiencies?: string[];
  toolProficiencies?: string[];
  languages?: number;
  equipment?: unknown;
  feature: unknown;
  suggestedCharacteristics?: unknown;
  source?: string;
  isHomebrew?: boolean;
  createdBy?: string;
}

// ==== FEAT INTERFACES ====
interface CreateFeatInput {
  systemId: string;
  name: string;
  description: string;
  prerequisites?: string;
  benefits: unknown;
  source?: string;
  isHomebrew?: boolean;
  createdBy?: string;
}

export class CompendiumService {
  // ==== SPELLS ====

  async listSpells(filters: SpellFilters) {
    const where: Prisma.SpellWhereInput = {
      systemId: filters.systemId,
    };

    if (filters.level !== undefined) where.level = filters.level;
    if (filters.school) where.school = filters.school;
    if (filters.ritual !== undefined) where.ritual = filters.ritual;
    if (filters.concentration !== undefined) where.concentration = filters.concentration;
    if (filters.class) where.classes = { has: filters.class };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.spell.findMany({
      where,
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
  }

  async getSpell(spellId: string) {
    const spell = await prisma.spell.findUnique({
      where: { id: spellId },
    });

    if (!spell) {
      throw new AppError(404, 'Spell not found');
    }

    return spell;
  }

  async createSpell(input: CreateSpellInput) {
    return prisma.spell.create({
      data: {
        systemId: input.systemId,
        name: input.name,
        level: input.level,
        school: input.school,
        magicType: input.magicType ?? 'ARCANE',
        castingTime: input.castingTime,
        range: input.range,
        components: input.components,
        duration: input.duration,
        description: input.description,
        higherLevels: input.higherLevels,
        ritual: input.ritual ?? false,
        concentration: input.concentration ?? false,
        classes: input.classes ?? [],
        source: input.source,
        isHomebrew: input.isHomebrew ?? false,
        createdBy: input.createdBy,
      },
    });
  }

  async updateSpell(spellId: string, data: Partial<CreateSpellInput>) {
    return prisma.spell.update({
      where: { id: spellId },
      data,
    });
  }

  async deleteSpell(spellId: string) {
    await prisma.spell.delete({
      where: { id: spellId },
    });
  }

  // ==== CHARACTER CLASSES ====

  async listClasses(systemId: string, search?: string) {
    const where: Prisma.CharacterClassWhereInput = { systemId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.characterClass.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getClass(classId: string) {
    const charClass = await prisma.characterClass.findUnique({
      where: { id: classId },
    });

    if (!charClass) {
      throw new AppError(404, 'Class not found');
    }

    return charClass;
  }

  async createClass(input: CreateClassInput) {
    return prisma.characterClass.create({
      data: {
        systemId: input.systemId,
        name: input.name,
        description: input.description,
        hitDie: input.hitDie,
        primaryAbility: input.primaryAbility,
        savingThrows: input.savingThrows ?? [],
        skills: input.skills ?? [],
        equipment: input.equipment as Prisma.InputJsonValue,
        features: input.features as Prisma.InputJsonValue,
        subclasses: input.subclasses as Prisma.InputJsonValue,
        spellcasting: input.spellcasting as Prisma.InputJsonValue,
        source: input.source,
        isHomebrew: input.isHomebrew ?? false,
        createdBy: input.createdBy,
      },
    });
  }

  // ==== ANCESTRIES / RACES ====

  async listAncestries(systemId: string, search?: string) {
    const where: Prisma.AncestryWhereInput = { systemId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.ancestry.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getAncestry(ancestryId: string) {
    const ancestry = await prisma.ancestry.findUnique({
      where: { id: ancestryId },
    });

    if (!ancestry) {
      throw new AppError(404, 'Ancestry not found');
    }

    return ancestry;
  }

  async createAncestry(input: CreateAncestryInput) {
    return prisma.ancestry.create({
      data: {
        systemId: input.systemId,
        name: input.name,
        description: input.description,
        speed: input.speed ?? 30,
        size: input.size ?? 'Medium',
        traits: input.traits as Prisma.InputJsonValue,
        languages: input.languages ?? [],
        subraces: input.subraces as Prisma.InputJsonValue,
        source: input.source,
        isHomebrew: input.isHomebrew ?? false,
        createdBy: input.createdBy,
      },
    });
  }

  // ==== CONDITIONS ====

  async listConditions(systemId: string) {
    return prisma.condition.findMany({
      where: { systemId },
      orderBy: { name: 'asc' },
    });
  }

  async getCondition(conditionId: string) {
    const condition = await prisma.condition.findUnique({
      where: { id: conditionId },
    });

    if (!condition) {
      throw new AppError(404, 'Condition not found');
    }

    return condition;
  }

  async createCondition(input: CreateConditionInput) {
    return prisma.condition.create({
      data: {
        systemId: input.systemId,
        name: input.name,
        description: input.description,
        effects: input.effects as Prisma.InputJsonValue,
        icon: input.icon,
        color: input.color ?? '#ff0000',
        source: input.source,
      },
    });
  }

  // ==== BACKGROUNDS ====

  async listBackgrounds(systemId: string, search?: string) {
    const where: Prisma.BackgroundWhereInput = { systemId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.background.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getBackground(backgroundId: string) {
    const background = await prisma.background.findUnique({
      where: { id: backgroundId },
    });

    if (!background) {
      throw new AppError(404, 'Background not found');
    }

    return background;
  }

  async createBackground(input: CreateBackgroundInput) {
    return prisma.background.create({
      data: {
        systemId: input.systemId,
        name: input.name,
        description: input.description,
        skillProficiencies: input.skillProficiencies ?? [],
        toolProficiencies: input.toolProficiencies ?? [],
        languages: input.languages ?? 0,
        equipment: input.equipment as Prisma.InputJsonValue,
        feature: input.feature as Prisma.InputJsonValue,
        suggestedCharacteristics: input.suggestedCharacteristics as Prisma.InputJsonValue,
        source: input.source,
        isHomebrew: input.isHomebrew ?? false,
        createdBy: input.createdBy,
      },
    });
  }

  // ==== FEATS ====

  async listFeats(systemId: string, search?: string) {
    const where: Prisma.FeatWhereInput = { systemId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.feat.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getFeat(featId: string) {
    const feat = await prisma.feat.findUnique({
      where: { id: featId },
    });

    if (!feat) {
      throw new AppError(404, 'Feat not found');
    }

    return feat;
  }

  async createFeat(input: CreateFeatInput) {
    return prisma.feat.create({
      data: {
        systemId: input.systemId,
        name: input.name,
        description: input.description,
        prerequisites: input.prerequisites,
        benefits: input.benefits as Prisma.InputJsonValue,
        source: input.source,
        isHomebrew: input.isHomebrew ?? false,
        createdBy: input.createdBy,
      },
    });
  }
}
