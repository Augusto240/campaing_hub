import {
  cleanDatabase,
  createTestUser,
  disconnectDatabase,
  prisma,
} from './setup';

describe('Creature Compendium Integration', () => {
  let creatorId: string;

  const ensureSystem = async (slug: string, name: string): Promise<string> => {
    const system = await prisma.rpgSystem.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name,
        description: `${name} test system`,
        diceFormula: '1d20+mod',
        attributeSchema: { attributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] },
      },
      select: { id: true },
    });

    return system.id;
  };

  beforeEach(async () => {
    await cleanDatabase();
    const creator = await createTestUser(`creator-${Date.now()}@test.com`, 'Compendium Creator');
    creatorId = creator.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('Creature CRUD', () => {
    it('should create a creature with stats and abilities', async () => {
      const systemId = await ensureSystem('dnd5e', 'Dungeons & Dragons 5e');

      const creature = await prisma.creature.create({
        data: {
          name: 'Goblin',
          systemId,
          createdBy: creatorId,
          creatureType: 'humanoid',
          stats: {
            hp: 7,
            ac: 15,
            speed: '30 ft',
            attributes: { STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 8, CHA: 8 },
          },
          abilities: [
            { name: 'Nimble Escape', description: 'Disengage or Hide as bonus action' },
          ],
          loot: [
            { name: 'Scimitar', chance: 50 },
            { name: '1d6 gold', chance: 80 },
          ],
          xpReward: 50,
        },
      });

      expect(creature.name).toBe('Goblin');
      expect(creature.creatureType).toBe('humanoid');
      expect(creature.xpReward).toBe(50);
      expect((creature.stats as Record<string, unknown>)['hp']).toBe(7);
      expect((creature.abilities as Array<Record<string, string>>)[0].name).toBe('Nimble Escape');
    });

    it('should filter creatures by systemId', async () => {
      const dndId = await ensureSystem('dnd5e', 'Dungeons & Dragons 5e');
      const cocId = await ensureSystem('coc7e', 'Call of Cthulhu 7e');

      await prisma.creature.createMany({
        data: [
          {
            name: 'Orc',
            systemId: dndId,
            createdBy: creatorId,
            creatureType: 'humanoid',
            stats: { hp: 15 },
            abilities: [{ name: 'Axe Swing', description: 'Melee attack' }],
            xpReward: 100,
          },
          {
            name: 'Dragon',
            systemId: dndId,
            createdBy: creatorId,
            creatureType: 'dragon',
            stats: { hp: 200 },
            abilities: [{ name: 'Fire Breath', description: 'Cone of fire' }],
            xpReward: 5000,
          },
          {
            name: 'Deep One',
            systemId: cocId,
            createdBy: creatorId,
            creatureType: 'mythos',
            stats: { hp: 12 },
            abilities: [{ name: 'Claw', description: 'Savage strike' }],
            xpReward: 0,
          },
        ],
      });

      const dndCreatures = await prisma.creature.findMany({
        where: { systemId: dndId },
      });

      const cocCreatures = await prisma.creature.findMany({
        where: { systemId: cocId },
      });

      expect(dndCreatures.length).toBe(2);
      expect(cocCreatures.length).toBe(1);
      expect(cocCreatures[0].name).toBe('Deep One');
    });

    it('should filter creatures by creatureType', async () => {
      const systemId = await ensureSystem('dnd5e', 'Dungeons & Dragons 5e');

      await prisma.creature.createMany({
        data: [
          {
            name: 'Red Dragon',
            systemId,
            createdBy: creatorId,
            creatureType: 'dragon',
            stats: { hp: 250 },
            abilities: [{ name: 'Inferno', description: 'Massive fire blast' }],
            xpReward: 10000,
          },
          {
            name: 'Blue Dragon',
            systemId,
            createdBy: creatorId,
            creatureType: 'dragon',
            stats: { hp: 210 },
            abilities: [{ name: 'Lightning Breath', description: 'Lightning line' }],
            xpReward: 8000,
          },
          {
            name: 'Zombie',
            systemId,
            createdBy: creatorId,
            creatureType: 'undead',
            stats: { hp: 22 },
            abilities: [{ name: 'Undead Fortitude', description: 'Chance to resist death' }],
            xpReward: 50,
          },
        ],
      });

      const dragons = await prisma.creature.findMany({
        where: { creatureType: 'dragon' },
      });

      const undead = await prisma.creature.findMany({
        where: { creatureType: 'undead' },
      });

      expect(dragons.length).toBe(2);
      expect(undead.length).toBe(1);
    });

    it('should search creatures by name (case insensitive)', async () => {
      const systemId = await ensureSystem('dnd5e', 'Dungeons & Dragons 5e');

      await prisma.creature.createMany({
        data: [
          {
            name: 'Goblin Boss',
            systemId,
            createdBy: creatorId,
            creatureType: 'humanoid',
            stats: { hp: 21 },
            abilities: [{ name: 'Command', description: 'Boosts nearby allies' }],
            xpReward: 200,
          },
          {
            name: 'Hobgoblin',
            systemId,
            createdBy: creatorId,
            creatureType: 'humanoid',
            stats: { hp: 11 },
            abilities: [{ name: 'Martial Advantage', description: 'Extra tactical damage' }],
            xpReward: 100,
          },
          {
            name: 'Orc',
            systemId,
            createdBy: creatorId,
            creatureType: 'humanoid',
            stats: { hp: 15 },
            abilities: [{ name: 'Aggressive', description: 'Advance quickly toward target' }],
            xpReward: 100,
          },
        ],
      });

      const results = await prisma.creature.findMany({
        where: {
          name: { contains: 'goblin', mode: 'insensitive' },
        },
      });

      expect(results.length).toBe(2);
      expect(results.map((c) => c.name)).toContain('Goblin Boss');
      expect(results.map((c) => c.name)).toContain('Hobgoblin');
    });

    it('should update creature stats', async () => {
      const systemId = await ensureSystem('dnd5e', 'Dungeons & Dragons 5e');

      const creature = await prisma.creature.create({
        data: {
          name: 'Test Creature',
          systemId,
          createdBy: creatorId,
          creatureType: 'beast',
          stats: { hp: 10, ac: 12 },
          abilities: [],
          xpReward: 25,
        },
      });

      const updated = await prisma.creature.update({
        where: { id: creature.id },
        data: {
          stats: { hp: 15, ac: 14, speed: '40 ft' },
          xpReward: 50,
        },
      });

      expect((updated.stats as Record<string, unknown>)['hp']).toBe(15);
      expect((updated.stats as Record<string, unknown>)['ac']).toBe(14);
      expect(updated.xpReward).toBe(50);
    });

    it('should delete a creature', async () => {
      const systemId = await ensureSystem('dnd5e', 'Dungeons & Dragons 5e');

      const creature = await prisma.creature.create({
        data: {
          name: 'To Delete',
          systemId,
          createdBy: creatorId,
          creatureType: 'beast',
          stats: { hp: 1 },
          abilities: [],
          xpReward: 0,
        },
      });

      await prisma.creature.delete({ where: { id: creature.id } });

      const found = await prisma.creature.findUnique({ where: { id: creature.id } });
      expect(found).toBeNull();
    });
  });

  describe('Creature for different RPG systems', () => {
    it('should support Call of Cthulhu creature with sanity loss', async () => {
      const cocId = await ensureSystem('coc7e', 'Call of Cthulhu 7e');

      const creature = await prisma.creature.create({
        data: {
          name: 'Shoggoth',
          systemId: cocId,
          createdBy: creatorId,
          creatureType: 'mythos',
          description: 'A massive amorphous creature',
          stats: {
            hp: 35,
            sanityLoss: '1d10/1d100',
            size: 'Huge',
            armor: 8,
          },
          abilities: [
            { name: 'Crushing', description: 'Engulf and crush target' },
            { name: 'Regeneration', description: 'Recovers 2 HP per round' },
          ],
          xpReward: 0,
        },
      });

      const stats = creature.stats as Record<string, unknown>;
      expect(stats['sanityLoss']).toBe('1d10/1d100');
      expect(creature.creatureType).toBe('mythos');
    });

    it('should support Tormenta20 creature with mana', async () => {
      const t20Id = await ensureSystem('tormenta20', 'Tormenta20');

      const creature = await prisma.creature.create({
        data: {
          name: 'Lefou Mago',
          systemId: t20Id,
          createdBy: creatorId,
          creatureType: 'aberração',
          stats: {
            hp: 25,
            mana: 15,
            defesa: 14,
            attributes: { FOR: 10, DES: 14, CON: 12, INT: 16, SAB: 10, CAR: 8 },
          },
          abilities: [
            { name: 'Bola de Fogo', description: '6d6 de dano de fogo, Reflexos reduz à metade' },
          ],
          xpReward: 600,
        },
      });

      const stats = creature.stats as Record<string, unknown>;
      expect(stats['mana']).toBe(15);
      expect(creature.xpReward).toBe(600);
    });
  });
});
