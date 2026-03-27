# Campaign Hub

Plataforma full-stack para gerenciamento de campanhas de RPG com foco em operacao real, evolucao incremental e preservacao de legado.

## Executive Summary

Campaign Hub integra:
- Wiki viva hierarquica com editor de blocos e busca Full-Text PostgreSQL.
- Sistema de conhecimento estilo Notion (templates, favoritos, backlinks, drag-and-drop de arvore).
- Mesa virtual (VTT MVP) com grid, tokens, chat, rolagens em tempo real, Fog of War e iluminacao dinamica.
- Compendio interno multi-sistema (D&D 5e, CoC 7e, Tormenta20) com filtros e vinculos com campanha/personagens/sessoes.
- Infra de producao com Redis, rate limiting, headers de seguranca, Prometheus e Grafana.

Projeto legado (2023) preservado: personagens fundadores Augustus Frostborne e Satoru Naitokira, identidade visual dark fantasy e assets historicos.

## Stack Tecnica

- Frontend: Angular 17 (standalone components, sem NgModule)
- Backend: Node.js + Express + TypeScript estrito
- ORM/DB: Prisma + PostgreSQL
- Realtime: Socket.IO
- Cache: Redis (cache-aside + invalidacao)
- Observabilidade: Prometheus + Grafana + metricas HTTP
- Seguranca: Helmet + rate-limit por rota
- Containerizacao: Docker + Docker Compose

## Arquitetura (alto nivel)

- frontend/ (Angular)
  - features/campaign/campaign-wiki: wiki hierarquica, templates, blocos, relacoes
  - features/campaign/campaign-tabletop: mapa/grid/tokens/fog/lights em realtime
  - features/campaign/campaign-vtt: chat e rolagens de mesa
  - features/campaign/campaign-compendium: bestiario + regras (magias/itens/classes)
- backend/ (Express)
  - modules/wiki: wiki, blocos, favoritos, templates, legado, FTS, backlinks
  - modules/compendium: compendio unificado por campanha/sistema
  - modules/creatures/combat/sessions/characters: dominio RPG
  - config/socket: sincronizacao realtime por campanha
  - config/redis + middlewares/security/rate-limit + config/metrics

## Status das funcionalidades solicitadas

### 1) Wiki Viva / Knowledge Base
Concluido no MVP avancado:
- [x] Wiki pagina-subpagina (hierarquia)
- [x] Editor de blocos (texto, checklist, quote, callout, code, image, table)
- [x] Backlinks wiki->wiki e wiki->entidades (character/session/item/creature)
- [x] Full-Text Search PostgreSQL com ranking (to_tsvector + websearch_to_tsquery + GIN)
- [x] Seed de legado com Augustus e Satoru como entidades fundadoras

### 2) Sistema Notion-like
Concluido no MVP avancado:
- [x] Templates de pagina (personagem/local/sessao)
- [x] Mencoes internas com sintaxe @ e [[...]]
- [x] Sidebar hierarquica com drag-and-drop para reorganizacao
- [x] Favoritos e relacoes contextuais

### 3) Mesa Virtual (VTT) MVP
Concluido no MVP funcional:
- [x] Mapa com grid e tokens arrastaveis
- [x] Sincronizacao realtime Socket.IO entre clientes
- [x] Chat integrado e feed de rolagens
- [x] Initiative tracker no fluxo de combate
- [x] Fog of War persistido por campanha (mascara por celula)
- [x] Iluminacao dinamica (fontes de luz com raio/intensidade/cor)

### 4) Compendios internos
Concluido no MVP funcional:
- [x] Modulo compendium backend/frontend
- [x] Tipos navegaveis e filtraveis: bestiary, spell, item, class
- [x] Suporte multi-sistema: dnd5e, coc7e, tormenta20
- [x] Vinculos de uso com sessoes e personagens (quando aplicavel)

### 5) Infra de suporte
Concluido:
- [x] Redis cache para campanhas e estatisticas + invalidacao por mutacao
- [x] Helmet habilitado no app
- [x] Rate limiting global /api + limites especificos
- [x] /metrics com Prometheus e stack com Grafana no docker-compose

## Endpoints principais novos/relevantes

### Wiki
- GET /api/wiki/campaign/:campaignId
- GET /api/wiki/campaign/:campaignId/tree
- GET /api/wiki/:wikiPageId/relations
- PUT /api/wiki/:wikiPageId/blocks
- POST /api/wiki/campaign/:campaignId/bootstrap-legacy

### Compendium
- GET /api/compendium/campaign/:campaignId?kind=bestiary|spell|item|class&search=...
- GET /api/compendium/campaign/:campaignId/kinds
- GET /api/compendium/system/:systemSlug?kind=...&search=...

### Tabletop realtime (Socket.IO)
- campaign:join / campaign:leave
- campaign:tabletop:request
- campaign:tabletop:update
- campaign:tabletop:fog
- campaign:tabletop:light:upsert
- campaign:tabletop:light:remove
- vtt:chat:message
- vtt:token:upsert

## Banco de dados e migrations

Migrations importantes recentes:
- phase8_wiki_hierarchy
- phase9_wiki_notion_blocks
- phase10_wiki_fulltext_search (GIN em wiki_pages)

## Quick Start (Docker)

Pre-requisitos:
- Docker Desktop ativo

Subir stack:
```bash
docker compose up --build -d
```

Servicos:
- Frontend: http://localhost:8081
- Backend API: http://localhost:3002/api
- Health: http://localhost:3002/health
- Prometheus: http://localhost:9091
- Grafana: http://localhost:3003

Containers:
- campaign-hub-db (Postgres 15)
- campaign-hub-redis (Redis 7)
- campaign-hub-backend
- campaign-hub-frontend
- campaign-hub-prometheus
- campaign-hub-grafana

## Desenvolvimento local

Backend:
```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm start
```

## Testes

Backend (unit):
```bash
cd backend
npm test
```

Cobertura:
```bash
cd backend
npm run test:coverage
```

Observacao: testes de integracao exigem PostgreSQL acessivel no host configurado.

## Seguranca e operacao

- JWT access + refresh token com revogacao
- Helmet em ambiente de producao
- Rate limiting para reduzir abuso em rotas criticas
- Logs estruturados com pino
- Metricas HTTP e endpoint /metrics protegido

## Preservacao de legado

Legado 2023 mantido e versionado dentro da plataforma:
- Conteudo canonico de Augustus Frostborne e Satoru Naitokira
- Referencias a assets e estrutura original
- Continuidade visual dark fantasy no frontend

## Guia de contribuicao

Fluxo recomendado:
1. Criar branch de feature
2. Implementar com testes
3. Rodar validacoes locais
4. Abrir PR com resumo tecnico e riscos

## Licenca

MIT
