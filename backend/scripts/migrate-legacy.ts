/**
 * Script de Migração do Legado 2023
 *
 * Este script importa o conteúdo do projeto original de 2023 para o Campaign Hub:
 * - Augustus Frostborne (personagem completo com história)
 * - Satoru Naitokira (personagem com background)
 * - Galeria de artes de RPG
 * - Rolador de dados 4d6
 */

import { PrismaClient, WikiCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Conteúdo de Augustus Frostborne (extraído do legado)
const augustusFrostborne = {
  title: 'Augustus Frostborne',
  icon: '🧙',
  category: 'CHARACTER' as WikiCategory,
  tags: ['personagem', 'mago', 'humano', 'legado-2023'],
  content: `# Augustus Frostborne

> *"Every wizard has a past..."*

## Dados Básicos

| Atributo | Valor |
|----------|-------|
| **Raça** | Humano |
| **Classe** | Mago |
| **Idade** | 22 anos |
| **Altura** | 171cm |
| **Peso** | 89,8kg |
| **Tendência** | Assombrado |
| **Antecedente** | Sábio |
| **Especialidade** | Astrônomo |
| **Idiomas** | Comum e Élfico |

## Personalidade

**Traço:** "Eu...falo...lentamente...ao...conversar...com idiotas...que tentam...se comparar...comigo."

**Ideal:** Conhecimento - O caminho para o poder e o auto-aperfeiçoamento é através do conhecimento. (Neutro)

**Vínculo:** Procura a vida inteira pela resposta de certa questão

**Defeito:** Fala sem pensar, insultando outros

## Perícias
- Investigação
- Medicina
- Arcanismo
- História

## Truques Mágicos
- **Raio de Gelo** (evocação)
- **Raio de Fogo** (evocação)
- **Ilusão Menor** (ilusão)

## Equipamento
- Bordão
- Bolsa de componentes
- Pacote de estudioso
- Grimório
- Vidro de tinta escura
- Pena
- Faca pequena
- Carta de um falecido colega
- Roupas comuns
- 10 po

---

## A Infância (Quando Tudo Começou)

Quando eu era criança e estava na floresta explorando, atrás de aventuras, acabei encontrando um colar misterioso perdido na floresta. O que me chamou a atenção era que o colar tinha uma peça estranha e azul, com formato de estrela. Desde então, eu sempre carreguei esse colar comigo em meu pescoço.

Na mesma floresta, ao lado do colar, encontrei um livro perdido, velho e empoeirado. Era um livro de magias, que eu também carrego junto comigo e com uma cópia que eu mesmo escrevi escondido.

Eu sou um humano com um talento excepcional para a magia, mas infelizmente nasci e cresci em uma sociedade que temia e rejeitava o uso de poderes mágicos. A magia era considerada perigosa e abominável por seus conterrâneos, e qualquer pessoa que a utilizasse era banida do vilarejo.

## A Pré-Adolescência e Juventude

Sempre tive sede por conhecimento. Passei todos estes anos adquirindo o máximo de conhecimento e sabedoria. Eu gosto de ler muito, uma prática que mantenho até os dias atuais.

## Os Dias Atuais

Em um dia fatídico, durante uma celebração na vila, uma série de eventos inesperados ocorreu. Um incêndio irrompeu e começou a se espalhar rapidamente pelas casas de madeira.

Eu sabia que eu tinha a habilidade de controlar o fogo, e um sentimento de responsabilidade me dominou. Usando meus poderes com maestria, consegui controlar o fogo, diminuindo sua intensidade e salvando várias casas. E curei os feridos.

Porém, ao invés de ser recebido como um herói, a reação dos aldeões foi de medo e hostilidade. Sentindo-se ameaçados e traídos, eles me culparam pelo incêndio e pela existência da magia em si. Movidos pelo medo e pela ira, decidiram me expulsar imediatamente.

Quando deixei as terras anti-magias, passei a utilizar um chapéu pontiagudo combinado com minhas vestes vermelhas. Agora eu finalmente podia ser quem eu sou.

---

*Criado por Augusto Oliveira - IFRN Campus Parnamirim, Julho de 2023*
`,
};

// Conteúdo de Satoru Naitokira
const satoruNaitokira = {
  title: 'Satoru Naitokira',
  icon: '⚔️',
  category: 'CHARACTER' as WikiCategory,
  tags: ['personagem', 'legado-2023', 'tokyo'],
  content: `# Satoru Naitokira

> *"Lembranças, como lâminas, são mais afiadas quando compartilhadas."*

## Sobre

Um personagem misterioso com uma estética urbana e noturna, inspirado na modernidade de Tokyo.

---

*Criado por Augusto Oliveira - IFRN Campus Parnamirim, Julho de 2023*
`,
};

// Galeria de Artes
const galeriaDeArtes = {
  title: 'Galeria de Artes RPG',
  icon: '🎨',
  category: 'LORE' as WikiCategory,
  tags: ['artes', 'galeria', 'legado-2023', 'imagens'],
  content: `# Galeria de Artes RPG

Uma coleção de artes coletadas ao longo do projeto, preservando a atmosfera dark fantasy.

## Tavernas
- bela-lund-tavern06.jpg
- pngtree-room-in-an-old-tavern

## Dragões
- red-dragon-at-castle-27.jpg
- dnd-3d-red-dragon-poster

## Paisagens
- frozen town.png
- landscape 1.jpg

## Capas Oficiais
- Capa-tormenta-20.jpg
- samuel-marcelino-arte-capa-final.jpg

---

*Conteúdo legado do projeto de 2023*
`,
};

// Rolador de Dados
const roladorDeDados = {
  title: 'Rolador 4d6 (Legado)',
  icon: '🎲',
  category: 'HOUSE_RULE' as WikiCategory,
  tags: ['dados', 'rolagem', 'atributos', 'legado-2023', 'criação-de-personagem'],
  content: `# Rolador 4d6 - Sistema de Geração de Atributos

Este é o sistema original de rolagem de dados do projeto de 2023, usado para gerar atributos de personagem no estilo D&D.

## Como Funciona

1. Rola-se 4d6 (quatro dados de seis faces)
2. Remove-se o menor valor
3. Soma-se os 3 valores restantes
4. Repete-se 6 vezes para cada atributo

## Código Original (JavaScript)

\`\`\`javascript
function rolagem(){
    return Math.floor(Math.random() * 6) + 1;
}

function rolar4d6(){
    var jogadas = []
    for(var contador = 0; contador < 4; contador++){
        var resultado = rolagem()
        jogadas.push(resultado)
    }
    jogadas.sort(function(a,b){
        return a-b
    })
    jogadas.shift()  // Remove o menor valor
    return jogadas
}

function somar_tudo(jogadas){
    var thesoma = 0
    for(var i = 0; i < jogadas.length; i++){
        thesoma += jogadas[i]
    }
    return thesoma
}

function resultados(){
    var resultados = []
    for(var count = 0; count < 6; count++){
        var jogadas = rolar4d6()
        var results = somar_tudo(jogadas)
        resultados.push(results)
    }
    return resultados
}

var somas = resultados()
console.log(somas)
\`\`\`

## Exemplo de Resultado

Ao executar o script, você obtém 6 valores entre 3 e 18 que podem ser distribuídos entre os atributos:
- Força
- Destreza
- Constituição
- Inteligência
- Sabedoria
- Carisma

---

*Código original do projeto de 2023*
`,
};

// Linha do Tempo do Projeto
const linhaDoTempo = {
  title: 'Linha do Tempo do Campaign Hub',
  icon: '⏳',
  category: 'TIMELINE' as WikiCategory,
  tags: ['história', 'projeto', 'evolução'],
  content: `# Linha do Tempo do Campaign Hub

## 2023 - Início
- **Julho 2023**: Criação do projeto original "PROJETO SITE RPG" no IFRN
- Páginas estáticas de personagens (Augustus Frostborne, Satoru Naitokira)
- Rolador de dados 4d6 em JavaScript
- Galeria de artes de fantasia
- Design dark fantasy com Bootstrap

## 2024 - Evolução
- Migração para arquitetura full-stack
- Angular 17 + Node.js + Express + TypeScript + Prisma
- Sistema de autenticação JWT
- RBAC por campanha
- Wiki básica

## 2025/2026 - Expansão
- Wiki hierárquica estilo Notion
- Editor de blocos
- Sistema de backlinks
- VTT (Virtual Tabletop) básico
- Compendium integrado (magias, classes, ancestralidades)
- Migração do conteúdo legado

---

*O Campaign Hub é um projeto pessoal que cresce organicamente, preservando sua história.*
`,
};

async function migrateContent(userId: string, campaignId: string) {
  console.log('🚀 Iniciando migração do conteúdo legado...');

  const pages = [
    augustusFrostborne,
    satoruNaitokira,
    galeriaDeArtes,
    roladorDeDados,
    linhaDoTempo,
  ];

  for (const page of pages) {
    try {
      const existing = await prisma.wikiPage.findFirst({
        where: {
          campaignId,
          title: page.title,
        },
      });

      if (existing) {
        console.log(`⏭️  Página "${page.title}" já existe, pulando...`);
        continue;
      }

      await prisma.wikiPage.create({
        data: {
          campaignId,
          title: page.title,
          content: page.content,
          category: page.category,
          tags: page.tags,
          icon: page.icon,
          createdBy: userId,
          isPublic: true,
        },
      });

      console.log(`✅ Página "${page.title}" criada com sucesso!`);
    } catch (error) {
      console.error(`❌ Erro ao criar página "${page.title}":`, error);
    }
  }

  console.log('✨ Migração concluída!');
}

// Exporta para uso externo
export { migrateContent };

// Execução standalone
if (require.main === module) {
  const userId = process.argv[2];
  const campaignId = process.argv[3];

  if (!userId || !campaignId) {
    console.error('Uso: npx tsx scripts/migrate-legacy.ts <userId> <campaignId>');
    process.exit(1);
  }

  migrateContent(userId, campaignId)
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error:', err);
      process.exit(1);
    });
}
