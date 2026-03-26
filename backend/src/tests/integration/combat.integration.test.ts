import {
  cleanDatabase,
  createTestCampaign,
  createTestSession,
  createTestUser,
  disconnectDatabase,
  prisma,
} from './setup';

describe('Combat Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('CombatEncounter CRUD', () => {
    it('should create a combat encounter for a session', async () => {
      const gm = await createTestUser();
      const campaign = await createTestCampaign(gm.id);
      const session = await createTestSession(campaign.id, gm.id);

      const encounter = await prisma.combatEncounter.create({
        data: {
          sessionId: session.id,
          name: 'Emboscada na Taverna',
          isActive: true,
          round: 1,
          currentTurn: 0,
        },
      });

      expect(encounter.name).toBe('Emboscada na Taverna');
      expect(encounter.round).toBe(1);
      expect(encounter.currentTurn).toBe(0);
      expect(encounter.isActive).toBe(true);
    });

    it('should add combatants to an encounter', async () => {
      const gm = await createTestUser();
      const campaign = await createTestCampaign(gm.id);
      const session = await createTestSession(campaign.id, gm.id);

      const encounter = await prisma.combatEncounter.create({
        data: {
          sessionId: session.id,
          name: 'Boss Fight',
          isActive: true,
          round: 1,
          currentTurn: 0,
        },
      });

      const combatants = await prisma.combatant.createMany({
        data: [
          { encounterId: encounter.id, name: 'Goblin A', initiative: 15, hp: 7, maxHp: 7, isNpc: true, order: 0 },
          { encounterId: encounter.id, name: 'Goblin B', initiative: 12, hp: 7, maxHp: 7, isNpc: true, order: 1 },
          { encounterId: encounter.id, name: 'Fighter', initiative: 18, hp: 45, maxHp: 45, isNpc: false, order: 2 },
        ],
      });

      expect(combatants.count).toBe(3);

      const retrieved = await prisma.combatant.findMany({
        where: { encounterId: encounter.id },
        orderBy: { initiative: 'desc' },
      });

      expect(retrieved[0].name).toBe('Fighter');
      expect(retrieved[1].name).toBe('Goblin A');
      expect(retrieved[2].name).toBe('Goblin B');
    });

    it('should order combatants by initiative descending', async () => {
      const gm = await createTestUser();
      const campaign = await createTestCampaign(gm.id);
      const session = await createTestSession(campaign.id, gm.id);

      const encounter = await prisma.combatEncounter.create({
        data: {
          sessionId: session.id,
          name: 'Initiative Test',
          isActive: true,
          round: 1,
          currentTurn: 0,
        },
      });

      await prisma.combatant.createMany({
        data: [
          { encounterId: encounter.id, name: 'Slow', initiative: 5, hp: 10, maxHp: 10, isNpc: true, order: 0 },
          { encounterId: encounter.id, name: 'Fast', initiative: 20, hp: 10, maxHp: 10, isNpc: true, order: 1 },
          { encounterId: encounter.id, name: 'Medium', initiative: 12, hp: 10, maxHp: 10, isNpc: true, order: 2 },
        ],
      });

      const sorted = await prisma.combatant.findMany({
        where: { encounterId: encounter.id },
        orderBy: { initiative: 'desc' },
      });

      expect(sorted.map((c) => c.name)).toEqual(['Fast', 'Medium', 'Slow']);
    });

    it('should advance turn and increment round when cycling', async () => {
      const gm = await createTestUser();
      const campaign = await createTestCampaign(gm.id);
      const session = await createTestSession(campaign.id, gm.id);

      const encounter = await prisma.combatEncounter.create({
        data: {
          sessionId: session.id,
          name: 'Turn Test',
          isActive: true,
          round: 1,
          currentTurn: 0,
        },
      });

      await prisma.combatant.createMany({
        data: [
          { encounterId: encounter.id, name: 'A', initiative: 20, hp: 10, maxHp: 10, isNpc: true, order: 0 },
          { encounterId: encounter.id, name: 'B', initiative: 15, hp: 10, maxHp: 10, isNpc: true, order: 1 },
          { encounterId: encounter.id, name: 'C', initiative: 10, hp: 10, maxHp: 10, isNpc: true, order: 2 },
        ],
      });

      // Avançar para turno 1
      let updated = await prisma.combatEncounter.update({
        where: { id: encounter.id },
        data: { currentTurn: 1 },
      });
      expect(updated.currentTurn).toBe(1);
      expect(updated.round).toBe(1);

      // Avançar para turno 2
      updated = await prisma.combatEncounter.update({
        where: { id: encounter.id },
        data: { currentTurn: 2 },
      });
      expect(updated.currentTurn).toBe(2);
      expect(updated.round).toBe(1);

      // Ciclar para round 2, turno 0
      updated = await prisma.combatEncounter.update({
        where: { id: encounter.id },
        data: { currentTurn: 0, round: 2 },
      });
      expect(updated.currentTurn).toBe(0);
      expect(updated.round).toBe(2);
    });

    it('should update combatant HP and conditions', async () => {
      const gm = await createTestUser();
      const campaign = await createTestCampaign(gm.id);
      const session = await createTestSession(campaign.id, gm.id);

      const encounter = await prisma.combatEncounter.create({
        data: {
          sessionId: session.id,
          name: 'HP Test',
          isActive: true,
          round: 1,
          currentTurn: 0,
        },
      });

      const combatant = await prisma.combatant.create({
        data: {
          encounterId: encounter.id,
          name: 'Target',
          initiative: 10,
          hp: 20,
          maxHp: 20,
          isNpc: true,
          order: 0,
          conditions: [],
        },
      });

      // Aplicar dano
      const damaged = await prisma.combatant.update({
        where: { id: combatant.id },
        data: { hp: 12 },
      });
      expect(damaged.hp).toBe(12);

      // Adicionar condição
      const poisoned = await prisma.combatant.update({
        where: { id: combatant.id },
        data: { conditions: ['poisoned'] },
      });
      expect(poisoned.conditions).toContain('poisoned');

      // Adicionar múltiplas condições
      const multiple = await prisma.combatant.update({
        where: { id: combatant.id },
        data: { conditions: ['poisoned', 'frightened', 'prone'] },
      });
      expect(multiple.conditions).toHaveLength(3);
    });

    it('should delete encounter and cascade delete combatants', async () => {
      const gm = await createTestUser();
      const campaign = await createTestCampaign(gm.id);
      const session = await createTestSession(campaign.id, gm.id);

      const encounter = await prisma.combatEncounter.create({
        data: {
          sessionId: session.id,
          name: 'Delete Test',
          isActive: true,
          round: 1,
          currentTurn: 0,
        },
      });

      await prisma.combatant.createMany({
        data: [
          { encounterId: encounter.id, name: 'A', initiative: 10, hp: 10, maxHp: 10, isNpc: true, order: 0 },
          { encounterId: encounter.id, name: 'B', initiative: 10, hp: 10, maxHp: 10, isNpc: true, order: 1 },
        ],
      });

      await prisma.combatEncounter.delete({ where: { id: encounter.id } });

      const combatants = await prisma.combatant.findMany({ where: { encounterId: encounter.id } });
      expect(combatants).toHaveLength(0);
    });
  });
});
