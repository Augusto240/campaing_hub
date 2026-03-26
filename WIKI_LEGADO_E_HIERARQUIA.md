# Wiki Legado 2023 + Hierarquia

Este documento descreve a expansao da wiki da campanha para preservar o legado de 2023 com navegacao hierarquica e links internos.

## O que foi implementado

- Hierarquia de paginas na tabela `wiki_pages` com `parent_page_id`
- Rastreamento de origem legado com `legacy_source`
- Endpoint para importar o legado canonico por campanha
- Endpoint para retornar arvore hierarquica da wiki
- Suporte a links internos `@Pagina` e backlinks na leitura de pagina
- UI da wiki da campanha com arvore lateral, subpaginas e importacao com um clique

## Novos endpoints

- `GET /api/wiki/campaign/:campaignId/tree`
- `POST /api/wiki/campaign/:campaignId/seed-legacy`

## Conteudo canonico importado

O seed cria (ou reaproveita) paginas base:

- `Legado 2023`
- `Augustus Frostborne`
- `Satoru Naitokira`
- `Rolador Arcano 4d6 (Legado JS Puro)`
- `Galeria de Artes RPG (Legado)`

## Regras de permissao

- Apenas membros da campanha acessam a wiki
- Apenas GM pode executar `seed-legacy`
- Jogador nao pode aninhar pagina em pagina privada de GM
- Ciclos na hierarquia sao bloqueados (uma pagina nao pode virar filha de um descendente)

## Migracao Prisma

Nova migration:

- `20260326140000_phase8_wiki_hierarchy_legacy`

Campos adicionados:

- `wiki_pages.parent_page_id`
- `wiki_pages.legacy_source`

## Como validar rapidamente

1. Rodar migration + generate no backend
2. Criar campanha de teste
3. Como GM, chamar `POST /api/wiki/campaign/:campaignId/seed-legacy`
4. Chamar `GET /api/wiki/campaign/:campaignId/tree` e confirmar arvore
5. Abrir frontend em `/campaigns/:id/wiki` e validar:
   - botao de importacao
   - arvore lateral
   - criacao de subpagina
   - links internos `@Pagina`
   - painel de backlinks

## Testes automatizados

Arquivo novo de integracao:

- `backend/src/tests/integration/wiki.integration.test.ts`

Cobre:

- hierarquia pai/filho
- bloqueio de ciclo
- importacao idempotente do legado
- bloqueio de seed para nao-GM
