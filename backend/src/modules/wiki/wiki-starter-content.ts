import { WikiBlockType, WikiCategory } from '@prisma/client';

export interface StarterWikiSeedEntry {
  starterSource: string;
  title: string;
  content: string;
  category: WikiCategory;
  tags: string[];
  isPublic: boolean;
  parentStarterSource?: string;
  blocks?: Array<{
    blockType: WikiBlockType;
    payload: Record<string, unknown>;
  }>;
}

export const STARTER_WIKI_PACK: StarterWikiSeedEntry[] = [
  {
    starterSource: 'starter-2026-root',
    title: 'Mesa Viva - Guia da Campanha',
    category: 'LORE',
    tags: ['starter-pack', 'mesa-viva', 'guia-mestre', 'dark-fantasy'],
    isPublic: true,
    content: `# Mesa Viva - Guia da Campanha

Este pacote inicial transforma a campanha em um painel jogavel sem depender de ferramentas externas.

## Leituras obrigatorias
- [[Legado 2023]]
- [[Augustus Frostborne]]
- [[Satoru Naitokira]]
- [[Visao da Campanha - Estado Atual]]

## Fluxo recomendado de uso
1. Revisar [[Visao de Mestre - Sessao Atual]]
2. Abrir [[Sessao Marcante - O Farol Partido]]
3. Consultar compendio para criaturas e regras rapidas
4. Registrar rolagens importantes no log da sessao
`,
    blocks: [
      {
        blockType: 'CALLOUT',
        payload: {
          title: 'Comando rapido do mestre',
          content: 'Use esta pagina como painel central antes de cada sessao.',
        },
      },
      {
        blockType: 'CHECKLIST',
        payload: {
          items: [
            { text: 'Atualizar timeline da sessao anterior', checked: false },
            { text: 'Definir cena de abertura', checked: false },
            { text: 'Selecionar 2 encontros de contingencia', checked: false },
          ],
        },
      },
    ],
  },
  {
    starterSource: 'starter-2026-campaign-view',
    parentStarterSource: 'starter-2026-root',
    title: 'Visao da Campanha - Estado Atual',
    category: 'LORE',
    tags: ['starter-pack', 'campanha', 'estado-atual', 'timeline'],
    isPublic: true,
    content: `# Visao da Campanha - Estado Atual

## Tom narrativo
Fantasia sombria com misterio, paranoia e conflito entre memoria e poder.

## Arco atual
- O culto da maré negra tenta recuperar um tomo proibido.
- A Corte Cinzenta quer controlar o comercio de reliquias.
- Augustus Frostborne e Satoru Naitokira surgem como eixos do equilibrio politico.

## Gatilhos de sessao
- Ataque surpresa no porto de Nevoa Rubra.
- Negociacao com faccao rival dentro da Biblioteca Silente.
- Investigacao de marcas ritualisticas em ruinas antigas.
`,
  },
  {
    starterSource: 'starter-2026-character-view-augustus',
    parentStarterSource: 'starter-2026-root',
    title: 'Visao de Personagem - Augustus Frostborne',
    category: 'NPC',
    tags: ['starter-pack', 'personagem', 'augustus', 'legado-2023'],
    isPublic: true,
    content: `# Visao de Personagem - Augustus Frostborne

## Papel na campanha
Ponte entre conhecimento arcano e trauma coletivo do legado de 2023.

## Relacoes atuais
- Vinculo tenso com [[Faccao - Corte Cinzenta]].
- Historico de choque ideologico com [[Faccao - Culto da Mare Oca]].
- Presenca recorrente em [[Local - Biblioteca Silente]].

## Referencias de mesa
- Magias de referencia: Fireball, Shield.
- Item recorrente: Potion of Healing.
- Regra util: Quick Rule - Advantage and Disadvantage.
`,
  },
  {
    starterSource: 'starter-2026-gm-view',
    parentStarterSource: 'starter-2026-root',
    title: 'Visao de Mestre - Sessao Atual',
    category: 'SESSION_RECAP',
    tags: ['starter-pack', 'mestre', 'planejamento', 'sessao'],
    isPublic: false,
    content: `# Visao de Mestre - Sessao Atual

## Objetivo dramatico
Forcar escolha moral entre seguranca da cidade e resgate de um artefato.

## Escalada de tensao
1. Rumores contraditorios.
2. Ataque de cultistas.
3. Aparicao de criatura do compendio.
4. Consequencia politica imediata.

## Marcadores para usar no Notion interno
- NPC-chave
- local-chave
- complicacao
- recompensa
`,
    blocks: [
      {
        blockType: 'TABLE',
        payload: {
          columns: ['Cena', 'Risco', 'Teste sugerido'],
          rows: [
            ['Docas em chamas', 'Alto', '1d20+DEX'],
            ['Sala ritual', 'Critico', '1d20+WIS'],
            ['Fuga pelos tuneis', 'Medio', '1d20+CON'],
          ],
        },
      },
    ],
  },
  {
    starterSource: 'starter-2026-factions',
    parentStarterSource: 'starter-2026-root',
    title: 'Faccoes da Campanha',
    category: 'FACTION',
    tags: ['starter-pack', 'faccao', 'politica'],
    isPublic: true,
    content: `# Faccoes da Campanha

- [[Faccao - Corte Cinzenta]]
- [[Faccao - Culto da Mare Oca]]

Use links internos para conectar sessoes, personagens e locais de influencia.
`,
  },
  {
    starterSource: 'starter-2026-faction-corte',
    parentStarterSource: 'starter-2026-factions',
    title: 'Faccao - Corte Cinzenta',
    category: 'FACTION',
    tags: ['starter-pack', 'faccao', 'corte-cinzenta'],
    isPublic: true,
    content: `# Faccao - Corte Cinzenta

Aristocracia mercantil que financia expedicoes para recuperar reliquias arcanas.

## Aliados e rivais
- Relacao pragmatica com [[Augustus Frostborne]].
- Rivalidade aberta com [[Faccao - Culto da Mare Oca]].

## Ganchos de aventura
- Contrato para escolta de tomo antigo.
- Manipulacao de julgamento politico.
`,
  },
  {
    starterSource: 'starter-2026-faction-culto',
    parentStarterSource: 'starter-2026-factions',
    title: 'Faccao - Culto da Mare Oca',
    category: 'FACTION',
    tags: ['starter-pack', 'faccao', 'culto', 'mythos'],
    isPublic: true,
    content: `# Faccao - Culto da Mare Oca

Seita que venera entidades abissais e busca abrir passagens para o mar profundo.

## Assinaturas de cena
- Simbolos de coral negro.
- Cantos em linguagem arcaica.
- Presenca de Deep One em rituais.

## Regras de horror
- Condition - Temporary Insanity
- Condition - Bout of Madness
`,
  },
  {
    starterSource: 'starter-2026-locations',
    parentStarterSource: 'starter-2026-root',
    title: 'Atlas de Locais',
    category: 'LOCATION',
    tags: ['starter-pack', 'locais', 'atlas'],
    isPublic: true,
    content: `# Atlas de Locais

- [[Local - Porto de Nevoa Rubra]]
- [[Local - Biblioteca Silente]]

Cada local contem pontos de conflito, oportunidade e risco social.
`,
  },
  {
    starterSource: 'starter-2026-location-porto',
    parentStarterSource: 'starter-2026-locations',
    title: 'Local - Porto de Nevoa Rubra',
    category: 'LOCATION',
    tags: ['starter-pack', 'local', 'porto', 'noir'],
    isPublic: true,
    content: `# Local - Porto de Nevoa Rubra

Centro comercial decadente com disputas entre contrabandistas e guardas da Corte.

## Elementos de mesa
- Neblina constante e lampioes dourados.
- Rumores sobre um navio sem bandeira.
- Emboscadas com Goblin e cultistas menores.
`,
  },
  {
    starterSource: 'starter-2026-location-biblioteca',
    parentStarterSource: 'starter-2026-locations',
    title: 'Local - Biblioteca Silente',
    category: 'LOCATION',
    tags: ['starter-pack', 'local', 'biblioteca', 'arcano'],
    isPublic: true,
    content: `# Local - Biblioteca Silente

Arquivo de tomos proibidos, administrado por escribas que cobram memoria em troca de conhecimento.

## Conteudo consultado com frequencia
- Mythos Tome
- Elder Sign
- Fireball

## Complicacao
Cada pesquisa pode exigir um teste social e custo narrativo.
`,
  },
  {
    starterSource: 'starter-2026-library-playbook',
    parentStarterSource: 'starter-2026-location-biblioteca',
    title: 'Playbook - Biblioteca Silente',
    category: 'HOUSE_RULE',
    tags: ['starter-pack', 'playbook', 'biblioteca', 'compendio'],
    isPublic: false,
    content: `# Playbook - Biblioteca Silente

## Objetivo da cena
Transformar consulta de lore em decisao dramatica, nao em pausa de mesa.

## Pacote rapido de consulta
- [[Detect Magic]]
- [[Counterspell]]
- [[Elder Sign]]
- [[Mythos Tome]]
- [[Quick Rule - Cover]]
- [[Potion of Healing]]

## Tabela de pressao
- Falha social: os escribas cobram um segredo do grupo.
- Falha arcana: ecos do tomo atraem a [[Faccao - Culto da Mare Oca]].
- Sucesso total: a cena revela pista para [[Evento - A Queda do Farol Partido]].
`,
    blocks: [
      {
        blockType: 'CHECKLIST',
        payload: {
          items: [
            { text: 'Preparar um custo narrativo para cada pesquisa', checked: false },
            { text: 'Conectar a revelacao a um personagem ou faccao', checked: false },
            { text: 'Registrar nova pista na pagina da sessao', checked: false },
          ],
        },
      },
    ],
  },
  {
    starterSource: 'starter-2026-events',
    parentStarterSource: 'starter-2026-root',
    title: 'Eventos Marcantes',
    category: 'LORE',
    tags: ['starter-pack', 'eventos', 'timeline'],
    isPublic: true,
    content: `# Eventos Marcantes

- [[Evento - A Queda do Farol Partido]]
- [[Sessao Marcante - O Farol Partido]]
`,
  },
  {
    starterSource: 'starter-2026-memory-graph',
    parentStarterSource: 'starter-2026-root',
    title: 'Memory Graph - Eixos do Legado',
    category: 'LORE',
    tags: ['starter-pack', 'memory-graph', 'legado-2023', 'campaign-os'],
    isPublic: true,
    content: `# Memory Graph - Eixos do Legado

## Nucleos que mantem a campanha coesa
- [[Augustus Frostborne]] conecta trauma, magia e responsabilidade.
- [[Satoru Naitokira]] conecta memoria, furtividade e diplomacia sombria.
- [[Evento - A Queda do Farol Partido]] conecta a crise publica e a agenda oculta.
- [[Local - Biblioteca Silente]] concentra pesquisa, custo e revelacao.

## Reliquias e tecnicas recorrentes
- [[Frostborne Ember Ray]]
- [[Satoru Night Mantle]]
- [[Counterspell]]
- [[Detect Magic]]

## Regra de direcao
Toda sessao forte deve cruzar pelo menos um personagem legado, uma faccao e um local.
`,
    blocks: [
      {
        blockType: 'TABLE',
        payload: {
          columns: ['Eixo', 'Conecta', 'Uso em mesa'],
          rows: [
            ['Augustus Frostborne', 'arcano e culpa', 'revelacoes e dilemas'],
            ['Satoru Naitokira', 'memoria e infiltracao', 'segredos e negociacao'],
            ['Farol Partido', 'crise e politica', 'abertura de sessao'],
          ],
        },
      },
    ],
  },
  {
    starterSource: 'starter-2026-event-farol',
    parentStarterSource: 'starter-2026-events',
    title: 'Evento - A Queda do Farol Partido',
    category: 'LORE',
    tags: ['starter-pack', 'evento', 'farol', 'canon'],
    isPublic: true,
    content: `# Evento - A Queda do Farol Partido

Uma explosao ritual destruiu o farol da costa e desencadeou uma crise politica.

## Consequencias
- Perda de controle maritimo.
- Ascensao do [[Faccao - Culto da Mare Oca]].
- Pressao da [[Faccao - Corte Cinzenta]] por resposta militar.
`,
  },
  {
    starterSource: 'starter-2026-session-farol',
    parentStarterSource: 'starter-2026-events',
    title: 'Sessao Marcante - O Farol Partido',
    category: 'SESSION_RECAP',
    tags: ['starter-pack', 'sessao', 'recap', 'farol'],
    isPublic: true,
    content: `# Sessao Marcante - O Farol Partido

## Resumo
O grupo investigou o ataque ao farol, enfrentou cultistas e recuperou pistas sobre o tomo perdido.

## Entidades relevantes
- [[Augustus Frostborne]]
- [[Satoru Naitokira]]
- [[Faccao - Culto da Mare Oca]]
- [[Local - Porto de Nevoa Rubra]]

## Registro de rolagens importantes
- 1d20+WIS para leitura de simbolos
- 1d20+DEX para escapar do colapso
`,
    blocks: [
      {
        blockType: 'CHECKLIST',
        payload: {
          items: [
            { text: 'Marcar consequencias para proxima sessao', checked: false },
            { text: 'Atualizar recompensas e itens obtidos', checked: false },
            { text: 'Registrar NPCs sobreviventes', checked: false },
          ],
        },
      },
    ],
  },
  {
    starterSource: 'starter-2026-important-items',
    parentStarterSource: 'starter-2026-root',
    title: 'Itens e Recursos Importantes',
    category: 'HOUSE_RULE',
    tags: ['starter-pack', 'itens', 'recursos', 'compendio'],
    isPublic: true,
    content: `# Itens e Recursos Importantes

## DnD 5e
- Potion of Healing
- Thieves Tools
- Condition - Poisoned

## Call of Cthulhu
- Mythos Tome
- Condition - Temporary Insanity

## Tormenta 20
- Pocao de Mana
- Regra Rapida - Acao Padrao e Movimento
`,
  },
  {
    starterSource: 'starter-2026-notion-hq',
    parentStarterSource: 'starter-2026-root',
    title: 'Mesa de Comando - Notion Interno',
    category: 'HOUSE_RULE',
    tags: ['starter-pack', 'notion', 'organizador', 'gm'],
    isPublic: false,
    content: `# Mesa de Comando - Notion Interno

Use os templates internos para padronizar notas:
- Dossie de Personagem
- Dossie de Faccao
- Briefing de Encontro
- Plano de Sessao do Mestre

Cada nota deve conectar pelo menos uma faccao, um local e uma sessao.
`,
  },
  {
    starterSource: 'starter-2026-template-encounter-brief',
    parentStarterSource: 'starter-2026-notion-hq',
    title: 'Template - Briefing de Encontro',
    category: 'HOUSE_RULE',
    tags: ['starter-pack', 'template', 'encontro', 'gm'],
    isPublic: false,
    content: `# Template - Briefing de Encontro

## Cena de abertura
- Onde a pressao comeca?
- Qual faccao entra primeiro?
- Quem corre risco imediato?

## Gatilhos uteis
- [[Local - Porto de Nevoa Rubra]]
- [[Local - Biblioteca Silente]]
- [[Faccao - Corte Cinzenta]]
- [[Faccao - Culto da Mare Oca]]

## Recursos de resposta rapida
- [[Quick Rule - Opportunity Attack]]
- [[Quick Rule - Cover]]
- [[Potion of Healing]]
`,
    blocks: [
      {
        blockType: 'TABLE',
        payload: {
          columns: ['Batida', 'Escalada', 'Consequencia'],
          rows: [
            ['Entrada da cena', 'rumor ou ataque', 'mudanca de objetivo'],
            ['Ponto medio', 'revelacao ou traicao', 'novo custo'],
            ['Fecho', 'combate ou pacto', 'gancho da proxima sessao'],
          ],
        },
      },
      {
        blockType: 'CHECKLIST',
        payload: {
          items: [
            { text: 'Definir uma recompensa memoravel', checked: false },
            { text: 'Escolher um custo politico ou emocional', checked: false },
            { text: 'Registrar qual pagina da wiki sera atualizada depois', checked: false },
          ],
        },
      },
    ],
  },
];
