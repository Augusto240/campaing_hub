import { WikiCategory } from '@prisma/client';

export interface LegacyWikiSeedEntry {
  legacySource: string;
  title: string;
  content: string;
  category: WikiCategory;
  tags: string[];
  isPublic: boolean;
  parentLegacySource?: string;
}

export const LEGACY_WIKI_SEED: LegacyWikiSeedEntry[] = [
  {
    legacySource: 'legacy-2023-root',
    title: 'Legado 2023',
    category: 'LORE',
    tags: ['legado-2023', 'canon', 'dark-fantasy'],
    isPublic: true,
    content: `# Legado Canonico de 2023

Este caderno preserva o material original do projeto de RPG iniciado em 2023.

## Conteudo incorporado
- Personagem: Augustus Frostborne
- Personagem: Satoru Naitokira
- Rolador classico 4d6 em JavaScript puro
- Galeria de artes de RPG
- Referencias de tipografia medieval e atmosfera dark fantasy

## Origem
- Pasta base: PROJETO-SITE-RPG--main/
- Projeto academico inicial (IFRN, Parnamirim)

> Regra de ouro: evoluir sem apagar a identidade do projeto original.
`,
  },
  {
    legacySource: 'legacy-2023-augustus',
    parentLegacySource: 'legacy-2023-root',
    title: 'Augustus Frostborne',
    category: 'NPC',
    tags: ['legado-2023', 'personagem', 'mago', 'diario'],
    isPublic: true,
    content: `# Augustus Frostborne

"Every wizard has a past..."

## Dados principais
- Nome: Augustus Frostborne
- Idade: 22 anos
- Raca/Classe: Humano - Mago
- Altura: 171 cm
- Peso: 89.8 kg
- Antecedente: Sabio
- Especialidade: Astronomo
- Pericias: Investigacao, Medicina, Arcanismo, Historia

## Infancia
Quando crianca, encontrou um colar misterioso com uma peca azul em forma de estrela e um livro de magias empoeirado na floresta. Desde entao, passou a estudar magia em segredo, pois sua comunidade temia qualquer uso de poder arcano.

## Juventude
A busca por conhecimento virou vocacao. Mesmo com acesso limitado a livros, manteve rotina de estudo e escrita pessoal, consolidando uma postura de pesquisador.

## Dias atuais
Durante um incendio na vila, usou magia para salvar casas e curar feridos. Em vez de reconhecimento, recebeu rejeicao e foi expulso. A partir desse ponto, inicia seu diario e assume sua identidade de mago itinerante com vestes vermelhas e chapeu pontiagudo.

## Equipamentos e magia
- Bordao, bolsa de componentes, pacote de estudioso, grimorio
- Truques: Raio de Gelo, Raio de Fogo, Ilusao Menor

## Midias legado
- PROJETO-SITE-RPG--main/Augustus Frostborne/infancia.jpg
- PROJETO-SITE-RPG--main/Augustus Frostborne/atual.jpg
- PROJETO-SITE-RPG--main/Augustus Frostborne/dados.html
- PROJETO-SITE-RPG--main/Augustus Frostborne/historia.html
`,
  },
  {
    legacySource: 'legacy-2023-satoru',
    parentLegacySource: 'legacy-2023-root',
    title: 'Satoru Naitokira',
    category: 'NPC',
    tags: ['legado-2023', 'personagem', 'cronica'],
    isPublic: true,
    content: `# Satoru Naitokira

"Lembrancas, como laminas, sao mais afiadas quando compartilhadas."

## Estado do legado
A pagina principal do personagem existe no acervo de 2023, com estilo proprio e navegacao para background/dados.

## Observacao importante
O arquivo de background esta vazio no legado original. Esta pagina atua como ancora para expansao narrativa futura sem apagar a historia da versao inicial.

## Midias legado
- PROJETO-SITE-RPG--main/Satoru Naitokira/index.html
- PROJETO-SITE-RPG--main/Satoru Naitokira/background.html
- PROJETO-SITE-RPG--main/Satoru Naitokira/dados.html
- PROJETO-SITE-RPG--main/Satoru Naitokira/night.jpg
- PROJETO-SITE-RPG--main/Satoru Naitokira/street.jpg
`,
  },
  {
    legacySource: 'legacy-2023-dice-4d6',
    parentLegacySource: 'legacy-2023-root',
    title: 'Rolador Arcano 4d6 (Legado JS Puro)',
    category: 'HOUSE_RULE',
    tags: ['legado-2023', 'dice', '4d6', 'atributos'],
    isPublic: true,
    content: `# Rolador Arcano 4d6

O legado de 2023 inclui um rolador classico de atributos com a regra 4d6 drop lowest.

## Algoritmo original
\`\`\`javascript
function rolagem(){
  return Math.floor(Math.random() * 6) + 1;
}

function rolar4d6(){
  var jogadas = [];
  for(var contador = 0; contador < 4; contador++){
    jogadas.push(rolagem());
  }

  jogadas.sort(function(a, b){
    return a - b;
  });

  jogadas.shift();
  return jogadas;
}
\`\`\`

## Uso no Campaign Hub
- Referencia historica do sistema de dados
- Base para macros futuras e automacao de criacao de personagem
- Valor de portfolio: continuidade tecnica do legado para a plataforma moderna

Fonte: PROJETO-SITE-RPG--main/4d6.js
`,
  },
  {
    legacySource: 'legacy-2023-art-gallery',
    parentLegacySource: 'legacy-2023-root',
    title: 'Galeria de Artes RPG (Legado)',
    category: 'LORE',
    tags: ['legado-2023', 'galeria', 'ambientacao', 'dark-fantasy'],
    isPublic: true,
    content: `# Galeria de Artes RPG

Colecao original de artes que define a atmosfera visual do projeto.

## Arquivos recomendados
- PROJETO-SITE-RPG--main/artes rpg/dnd wallpaper.jpg
- PROJETO-SITE-RPG--main/artes rpg/frozen town.png
- PROJETO-SITE-RPG--main/artes rpg/red-dragon-at-castle-27.jpg
- PROJETO-SITE-RPG--main/artes rpg/pngtree-room-in-an-old-tavern-picture-image_2667400.jpg
- PROJETO-SITE-RPG--main/artes rpg/Capa-tormenta-20.jpg

## Diretriz visual
- Priorizar tons escuros e dourado envelhecido
- Preservar tipografia medieval (Cinzel e MedievalSharp no app atual)
- Evitar UI generica e esterilizada
`,
  },
];
