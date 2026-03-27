import { Prisma, WikiCategory } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/error-handler';

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

interface WikiAccess {
  campaignId: string;
  isGm: boolean;
}

interface ListWikiPagesInput {
  campaignId: string;
  userId: string;
  category?: WikiCategory;
  search?: string;
  tag?: string;
  limit: number;
}

interface CreateWikiPageInput {
  campaignId: string;
  userId: string;
  title: string;
  content: string;
  category: WikiCategory;
  tags: string[];
  isPublic: boolean;
}

interface UpdateWikiPageInput {
  userId: string;
  wikiPageId: string;
  title?: string;
  content?: string;
  category?: WikiCategory;
  tags?: string[];
  isPublic?: boolean;
}

interface BootstrapLegacyInput {
  campaignId: string;
  userId: string;
}

const buildSearchFilter = (search?: string) =>
  search && search.trim().length > 0
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { content: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

export class WikiService {
  private async getCampaignAccess(
    campaignId: string,
    userId: string,
    client: PrismaClientLike = prisma
  ): Promise<WikiAccess> {
    const campaign = await client.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    const isMember = campaign.ownerId === userId || campaign.members.length > 0;
    if (!isMember) {
      throw new AppError(403, 'You are not a member of this campaign');
    }

    const isGm =
      campaign.ownerId === userId || campaign.members.some((member) => member.role === 'GM');

    return {
      campaignId: campaign.id,
      isGm,
    };
  }

  async listPages(input: ListWikiPagesInput) {
    const access = await this.getCampaignAccess(input.campaignId, input.userId);

    return prisma.wikiPage.findMany({
      where: {
        campaignId: access.campaignId,
        ...(input.category ? { category: input.category } : {}),
        ...(input.tag ? { tags: { has: input.tag } } : {}),
        ...buildSearchFilter(input.search),
        ...(access.isGm ? {} : { isPublic: true }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: input.limit,
    });
  }

  async getPage(wikiPageId: string, userId: string) {
    const page = await prisma.wikiPage.findUnique({
      where: { id: wikiPageId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!page) {
      throw new AppError(404, 'Wiki page not found');
    }

    const access = await this.getCampaignAccess(page.campaignId, userId);

    if (!access.isGm && !page.isPublic) {
      throw new AppError(403, 'Only GMs can access private wiki pages');
    }

    return page;
  }

  async createPage(input: CreateWikiPageInput) {
    return prisma.$transaction(async (tx) => {
      const access = await this.getCampaignAccess(input.campaignId, input.userId, tx);

      if (!input.isPublic && !access.isGm) {
        throw new AppError(403, 'Only GMs can create private wiki pages');
      }

      return tx.wikiPage.create({
        data: {
          campaignId: input.campaignId,
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags,
          createdBy: input.userId,
          isPublic: input.isPublic,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  }

  async updatePage(input: UpdateWikiPageInput) {
    return prisma.$transaction(async (tx) => {
      const page = await tx.wikiPage.findUnique({
        where: { id: input.wikiPageId },
      });

      if (!page) {
        throw new AppError(404, 'Wiki page not found');
      }

      const access = await this.getCampaignAccess(page.campaignId, input.userId, tx);
      const canEdit = access.isGm || page.createdBy === input.userId;

      if (!canEdit) {
        throw new AppError(403, 'You can only edit your own wiki pages unless you are GM');
      }

      if (input.isPublic === false && !access.isGm) {
        throw new AppError(403, 'Only GMs can make a wiki page private');
      }

      return tx.wikiPage.update({
        where: { id: input.wikiPageId },
        data: {
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags,
          isPublic: input.isPublic,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  }

  async deletePage(wikiPageId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const page = await tx.wikiPage.findUnique({
        where: { id: wikiPageId },
      });

      if (!page) {
        throw new AppError(404, 'Wiki page not found');
      }

      const access = await this.getCampaignAccess(page.campaignId, userId, tx);
      const canDelete = access.isGm || page.createdBy === userId;
      if (!canDelete) {
        throw new AppError(403, 'You can only delete your own wiki pages unless you are GM');
      }

      await tx.wikiPage.delete({
        where: { id: wikiPageId },
      });
    });
  }

  async bootstrapLegacyCanon(input: BootstrapLegacyInput) {
    return prisma.$transaction(async (tx) => {
      const access = await this.getCampaignAccess(input.campaignId, input.userId, tx);

      if (!access.isGm) {
        throw new AppError(403, 'Only GMs can import legacy canon content');
      }

      const legacyPages = [
        {
          title: 'Canon 2023 - Augustus Frostborne',
          category: 'LORE' as WikiCategory,
          tags: ['legacy-2023', 'augustus-frostborne', 'canon', 'personagem'],
          isPublic: true,
          content: `# Augustus Frostborne\n\n## Origem Canonica (2023)\nAugustus nasceu como humano com talento excepcional para magia em uma sociedade anti-magia.\nEle manteve seus dons em segredo por anos, carregando um colar de estrela azul e um grimorio antigo encontrado na floresta.\n\n## Marco Narrativo\nDurante um incendio na vila, Augustus usou magia para salvar casas e feridos.\nMesmo agindo para proteger todos, foi expulso por medo e preconceito.\nEsse exilio marca o inicio dos diarios e da jornada em terras desconhecidas.\n\n## Traços Canônicos\n- Classe: Mago\n- Antecedente: Sabio\n- Especialidade: Astronomo\n- Pericias: Investigacao, Medicina, Arcanismo, Historia\n- Idiomas: Comum e Elfico\n\n## Arquivos de origem\n- PROJETO-SITE-RPG--main/Augustus Frostborne/historia.html\n- PROJETO-SITE-RPG--main/Augustus Frostborne/dados.html\n\n## Observacao de legado\nEsta pagina preserva o texto base de 2023 e pode ser expandida com eventos de campanha, relacoes e linhas do tempo.`,
        },
        {
          title: 'Canon 2023 - Satoru Naitokira',
          category: 'LORE' as WikiCategory,
          tags: ['legacy-2023', 'satoru-naitokira', 'canon', 'personagem'],
          isPublic: true,
          content: `# Satoru Naitokira\n\n## Origem Canonica (2023)\nSatoru integra o nucleo fundacional do projeto ao lado de Augustus.\nA estrutura visual e narrativa dele no prototipo estabelece o tom dark fantasy pessoal do Campaign Hub.\n\n## Uso recomendado na Wiki Viva\n- Linha do tempo pessoal de sessoes\n- Relacoes com faccoes e locais\n- Diario de evolucao e motivacoes\n- Vinculos com eventos de campanha\n\n## Arquivos de origem\n- PROJETO-SITE-RPG--main/Satoru Naitokira/index.html\n- PROJETO-SITE-RPG--main/Satoru Naitokira/dados.html\n- PROJETO-SITE-RPG--main/Satoru Naitokira/criador.html\n\n## Observacao de legado\nA base visual e tematica de Satoru deve continuar como referencia estetica no sistema inteiro.`,
        },
        {
          title: 'Canon 2023 - Rolador 4d6 Drop Lowest',
          category: 'HOUSE_RULE' as WikiCategory,
          tags: ['legacy-2023', 'dice', '4d6', 'atributos'],
          isPublic: true,
          content: `# Rolador 4d6 (Drop Lowest)\n\n## Algoritmo original\n1. Rola 4 dados d6\n2. Ordena os resultados\n3. Remove o menor\n4. Soma os 3 maiores\n5. Repete 6 vezes para gerar atributos\n\n## Formula de referencia\n- Atributo: 4d6kh3\n- Bloco completo: repetir 6 vezes\n\n## Arquivo de origem\n- PROJETO-SITE-RPG--main/4d6.js\n\n## Nota de preservacao\nO algoritmo original em JavaScript puro permanece como patrimonio tecnico do projeto.`,
        },
        {
          title: 'Canon 2023 - Galeria Dark Fantasy',
          category: 'LORE' as WikiCategory,
          tags: ['legacy-2023', 'galeria', 'artes', 'atmosfera'],
          isPublic: true,
          content: `# Galeria Dark Fantasy\n\n## Curadoria original\nA galeria do prototipo de 2023 define a atmosfera medieval/dark fantasy da plataforma.\n\n## Diretriz artistica\n- Taverna, vilas, ruinas e florestas sombrias\n- Contraste de luz quente e sombra fria\n- Herois em jornada e criaturas de ameaca elevada\n\n## Uso no sistema atual\n- Capas de campanha\n- Planos de fundo da wiki\n- Cenas de sessao e handouts para mesa virtual\n\n## Fonte de origem\n- PROJETO-SITE-RPG--main/artes rpg/\n\n## Observacao\nToda nova tela deve respeitar a identidade visual estabelecida no legado.`,
        },
      ];

      const existing = await tx.wikiPage.findMany({
        where: {
          campaignId: input.campaignId,
          title: { in: legacyPages.map((page) => page.title) },
        },
        select: { id: true, title: true },
      });

      const existingTitles = new Set(existing.map((page) => page.title));

      const toCreate = legacyPages.filter((page) => !existingTitles.has(page.title));

      const createdPages = [];
      for (const page of toCreate) {
        const created = await tx.wikiPage.create({
          data: {
            campaignId: input.campaignId,
            createdBy: input.userId,
            title: page.title,
            content: page.content,
            category: page.category,
            tags: page.tags,
            isPublic: page.isPublic,
          },
          select: {
            id: true,
            title: true,
            category: true,
          },
        });
        createdPages.push(created);
      }

      return {
        createdCount: createdPages.length,
        skippedCount: legacyPages.length - createdPages.length,
        createdPages,
      };
    });
  }
}

