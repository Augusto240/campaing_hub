import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export { prisma };

export async function cleanDatabase(): Promise<void> {
  // Limpar na ordem correta (sem violar FK)
  await prisma.sessionVote.deleteMany();
  await prisma.sessionProposal.deleteMany();
  await prisma.combatant.deleteMany();
  await prisma.combatEncounter.deleteMany();
  await prisma.diceRoll.deleteMany();
  await prisma.sanityEvent.deleteMany();
  await prisma.spellCast.deleteMany();
  await prisma.wikiPage.deleteMany();
  await prisma.loot.deleteMany();
  await prisma.session.deleteMany();
  await prisma.character.deleteMany();
  await prisma.campaignMember.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(
  email = 'gm@test.com',
  name = 'Test GM'
): Promise<{ id: string; email: string; name: string }> {
  const passwordHash = await bcrypt.hash('password123', 10);
  return prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true, name: true },
  });
}

export async function createTestCampaign(
  ownerId: string,
  systemSlug = 'dnd5e'
): Promise<{ id: string; name: string; system: string; ownerId: string }> {
  const system = await prisma.rpgSystem.findUnique({ where: { slug: systemSlug } });
  return prisma.campaign.create({
    data: {
      name: 'Test Campaign',
      system: systemSlug,
      systemId: system?.id,
      ownerId,
    },
    select: { id: true, name: true, system: true, ownerId: true },
  });
}

export async function createTestSession(
  campaignId: string,
  createdBy: string
): Promise<{ id: string; campaignId: string; date: Date }> {
  return prisma.session.create({
    data: {
      campaignId,
      date: new Date(),
      xpAwarded: 0,
      createdBy,
    },
    select: { id: true, campaignId: true, date: true },
  });
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
