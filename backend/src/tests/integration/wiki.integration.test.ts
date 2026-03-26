import {
  cleanDatabase,
  createTestCampaign,
  createTestUser,
  disconnectDatabase,
  prisma,
} from './setup';
import { WikiService } from '../../modules/wiki/wiki.service';

describe('Wiki Integration', () => {
  const wikiService = new WikiService();

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  it('should create nested wiki pages and return tree structure', async () => {
    const gm = await createTestUser();
    const campaign = await createTestCampaign(gm.id);

    const root = await wikiService.createPage({
      campaignId: campaign.id,
      userId: gm.id,
      title: 'Cronicas de Abertura',
      content: 'Primeira pagina',
      category: 'LORE',
      tags: ['inicio'],
      isPublic: true,
    });

    await wikiService.createPage({
      campaignId: campaign.id,
      userId: gm.id,
      parentPageId: root.id,
      title: 'Capitulo I',
      content: 'Detalhes do capitulo um',
      category: 'SESSION_RECAP',
      tags: ['sessao-1'],
      isPublic: true,
    });

    const tree = await wikiService.getPageTree({
      campaignId: campaign.id,
      userId: gm.id,
    });

    expect(tree.length).toBe(1);
    expect(tree[0].title).toBe('Cronicas de Abertura');
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].title).toBe('Capitulo I');
  });

  it('should prevent cyclic wiki hierarchy updates', async () => {
    const gm = await createTestUser();
    const campaign = await createTestCampaign(gm.id);

    const parent = await wikiService.createPage({
      campaignId: campaign.id,
      userId: gm.id,
      title: 'Pai',
      content: 'Pagina pai',
      category: 'LORE',
      tags: [],
      isPublic: true,
    });

    const child = await wikiService.createPage({
      campaignId: campaign.id,
      userId: gm.id,
      parentPageId: parent.id,
      title: 'Filho',
      content: 'Pagina filha',
      category: 'LORE',
      tags: [],
      isPublic: true,
    });

    await expect(
      wikiService.updatePage({
        userId: gm.id,
        wikiPageId: parent.id,
        parentPageId: child.id,
      })
    ).rejects.toThrow('Invalid hierarchy: cannot assign a descendant as parent');
  });

  it('should import legacy wiki content only once (idempotent)', async () => {
    const gm = await createTestUser();
    const campaign = await createTestCampaign(gm.id);

    const firstImport = await wikiService.seedLegacyPages({
      campaignId: campaign.id,
      userId: gm.id,
    });

    const secondImport = await wikiService.seedLegacyPages({
      campaignId: campaign.id,
      userId: gm.id,
    });

    const importedPages = await prisma.wikiPage.findMany({
      where: {
        campaignId: campaign.id,
        legacySource: {
          not: null,
        },
      },
    });

    expect(firstImport.created).toBeGreaterThan(0);
    expect(firstImport.total).toBe(importedPages.length);
    expect(secondImport.created).toBe(0);
    expect(secondImport.skipped).toBe(firstImport.total);

    const root = await prisma.wikiPage.findFirst({
      where: {
        campaignId: campaign.id,
        legacySource: 'legacy-2023-root',
      },
    });

    const augustus = await prisma.wikiPage.findFirst({
      where: {
        campaignId: campaign.id,
        legacySource: 'legacy-2023-augustus',
      },
    });

    expect(root).not.toBeNull();
    expect(augustus).not.toBeNull();
    expect(augustus?.parentPageId).toBe(root?.id);
  });

  it('should block non-gm users from importing legacy content', async () => {
    const gm = await createTestUser('gm@test.com', 'GM');
    const player = await createTestUser('player@test.com', 'Player');
    const campaign = await createTestCampaign(gm.id);

    await prisma.campaignMember.create({
      data: {
        campaignId: campaign.id,
        userId: player.id,
        role: 'PLAYER',
      },
    });

    await expect(
      wikiService.seedLegacyPages({
        campaignId: campaign.id,
        userId: player.id,
      })
    ).rejects.toThrow('Only GMs can import legacy wiki content');
  });
});
