# ⚔️ Campaign Hub

> **An authorial RPG OS built with Angular, Node.js and real-time collaboration**  
> Campaign Hub centralizes campaign memory, structured knowledge, compendium, wiki and tabletop interaction in a single dark-fantasy platform.

<p align="center">
  <img alt="Angular" src="https://img.shields.io/badge/Angular-17-DD0031?style=for-the-badge&logo=angular&logoColor=white" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img alt="Redis" src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-Real--time-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

## Overview

**Campaign Hub** is a full-stack platform for tabletop RPG campaign management. It began in **2023** as a static academic project and evolved into a modular product focused on a single question:

> **Why would a GM run a campaign here instead of using four separate tabs?**

The answer is the product itself:

- the **campaign remembers** what happened
- the **wiki, lore and entities stay connected**
- the **compendium is available during play**
- the **map, chat, dice and session state talk to each other**
- the platform preserves an **authorial dark-fantasy identity** instead of becoming a generic CRUD app

Campaign Hub is positioned as an **authorial RPG OS** — not a Roll20 clone, not a Notion clone, and not a 5etools clone.

---

## Why this project matters

### Product value

Campaign Hub reduces fragmentation during play by combining:

- campaign dashboard
- live wiki
- compendium
- narrative memory
- real-time tabletop tools
- session support workflows

### Market value

This project demonstrates:

- Angular 17 application design
- full-stack contract discipline
- real-time architecture with Socket.IO
- RBAC and authenticated collaboration
- PostgreSQL + Prisma domain modeling
- Dockerized local and demo environments
- incremental product evolution with legacy preservation

### Academic value

This project also supports stronger academic framing through:

- knowledge graph applied to narrative systems
- semantic organization of campaign entities
- integration between collaboration, memory and play
- software design for tabletop mediation and storytelling support

---

## Core capabilities

### 1. Live Wiki

- hierarchical campaign pages
- block-based editing
- internal links and relations
- campaign timeline
- backlinks between entities
- starter content and legacy bootstrap

### 2. Knowledge Graph

- nodes and relations across campaign entities
- semantic links between pages, characters, sessions and compendium entries
- campaign-wide search and snapshot views
- foundation for memory-oriented product behavior

### 3. Internal Knowledge Workspace

- notion-like editing model
- reusable templates
- structured campaign notes
- organized page trees
- internal references for GM workflows

### 4. Internal Compendium

- multi-system support
- creatures, spells, items and classes
- campaign-aware lookup
- wiki cross-references
- designed for real in-session usage

### 5. Virtual Tabletop MVP

- grid-based map interaction
- token positioning
- fog of war and lighting support
- chat and dice events in real time
- persisted campaign tabletop state

### 6. Security and Operations

- JWT auth with refresh rotation
- role-based access control
- Redis cache with invalidation
- rate limiting and security headers
- Prometheus + Grafana support

---

## Legacy and identity

Campaign Hub intentionally preserves its 2023 origin.

### Legacy carried forward

- **Augustus Frostborne**
- **Satoru Naitokira**
- dark-fantasy visual language
- medieval-inspired typography
- narrative-first product direction

This legacy is not decorative. It is part of the product identity and one of the reasons the platform feels authorial rather than generic.

---

## Technology stack

| Layer | Stack |
|---|---|
| Frontend | Angular 17, standalone components, SCSS |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Real-time | Socket.IO |
| Security | Helmet, rate limiting, JWT, RBAC |
| Observability | Prometheus, Grafana |
| DevOps | Docker, Docker Compose |

---

## Architecture at a glance

```text
frontend/
└── Angular application
    ├── dashboard
    ├── campaigns
    ├── wiki
    ├── compendium
    ├── tabletop / VTT
    └── auth

backend/
└── Express API
    ├── auth
    ├── campaigns
    ├── characters
    ├── sessions
    ├── loot
    ├── wiki
    ├── compendium
    ├── core
    ├── knowledge-graph
    ├── combat
    ├── creatures
    ├── notifications
    └── realtime / socket
```

### Key backend modules

- `core`: unified page, node, relation and persisted tabletop backbone
- `wiki`: hierarchy, blocks, relations, bootstrap and campaign timeline
- `knowledge-graph`: campaign aggregation layer for connected memory
- `compendium`: internal rules and lookup flows by system
- `combat`, `sessions`, `characters`: operational RPG domain modules

---

## Feature status

### Live Wiki

- [x] hierarchy and page tree
- [x] block-based content model
- [x] relations and backlinks
- [x] campaign timeline
- [x] legacy bootstrap content
- [x] starter pack content

### Knowledge Graph

- [x] campaign graph snapshot
- [x] node and relation aggregation
- [x] semantic campaign memory backbone

### Internal Workspace

- [x] templates
- [x] block editing support
- [x] internal linking patterns
- [x] structured note workflows

### Compendium

- [x] bestiary
- [x] spells
- [x] items
- [x] classes
- [x] multi-system filtering
- [x] wiki references

### Tabletop / VTT MVP

- [x] map state
- [x] tokens
- [x] realtime sync
- [x] chat and dice feed
- [x] fog of war
- [x] lighting model

### Platform hardening

- [x] Redis cache support
- [x] rate limiting
- [x] Helmet
- [x] metrics endpoint
- [x] Dockerized environment

---

## Main routes and interfaces

### Wiki

- `GET /api/wiki/campaign/:campaignId`
- `GET /api/wiki/campaign/:campaignId/tree`
- `GET /api/wiki/campaign/:campaignId/timeline?limit=30`
- `GET /api/wiki/:wikiPageId/relations`
- `PUT /api/wiki/:wikiPageId/blocks`
- `POST /api/wiki/campaign/:campaignId/bootstrap-legacy`
- `POST /api/wiki/campaign/:campaignId/bootstrap-starter-pack`

### Knowledge Graph

- `GET /api/knowledge-graph/campaign/:campaignId?limit=140`

### Compendium

- `GET /api/compendium/campaign/:campaignId?kind=bestiary|spell|item|class&search=...`
- `GET /api/compendium/campaign/:campaignId/kinds`
- `GET /api/compendium/system/:systemSlug?kind=...&search=...`

### Core backbone

- `GET /api/core/campaign/:campaignId/snapshot?limit=160`
- `POST /api/core/campaign/:campaignId/pages`
- `PUT /api/core/pages/:wikiPageId/blocks`
- `GET /api/core/pages/:wikiPageId/backlinks?limit=12`
- `GET /api/core/campaign/:campaignId/search?query=...`
- `GET /api/core/campaign/:campaignId/compendium?kind=CREATURE|SPELL|ITEM&search=...`
- `POST /api/core/campaign/:campaignId/compendium/homebrew`
- `GET /api/core/campaign/:campaignId/vtt-state`
- `PUT /api/core/campaign/:campaignId/vtt-state`

### Socket.IO events

- `campaign:join`
- `campaign:leave`
- `campaign:joined`
- `campaign:error`
- `campaign:tabletop:request`
- `campaign:tabletop:update`
- `campaign:tabletop:fog`
- `campaign:tabletop:light:upsert`
- `campaign:tabletop:light:remove`
- `vtt:chat:message`
- `vtt:token:upsert`

---

## Database and migrations

Relevant migration phases include:

- `phase8_wiki_hierarchy`
- `phase9_wiki_notion_blocks`
- `phase10_wiki_fulltext_search`
- `phase11_knowledge_graph_core`
- `phase12_core_backbone`

These support:

- hierarchical wiki pages
- block persistence
- PostgreSQL full-text search
- graph-oriented relations
- persisted tabletop state
- compendium core structures

---

## Quick start

### Prerequisites

- Docker Desktop
- Node.js 20+
- npm

### Environment setup

```bash
cp backend/.env.example backend/.env
```

Set at minimum:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### Run with Docker

```bash
docker compose up --build -d
```

### Service URLs

- Frontend: `http://localhost:8081`
- Backend API: `http://localhost:3002/api`
- Health: `http://localhost:3002/health`
- Prometheus: `http://localhost:9091`
- Grafana: `http://localhost:3003`

---

## Local development

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## Testing

### Backend tests

```bash
cd backend
npm test
```

### Coverage

```bash
cd backend
npm run test:coverage
```

> The test runner uses an ephemeral PostgreSQL container to keep integration runs reproducible.

---

## Security and operational notes

The platform already includes important production-oriented foundations, including:

- JWT access + refresh model
- refresh token revocation
- rate limiting for critical routes
- security headers with Helmet
- Redis-backed caching support
- metrics and observability endpoints

That said, before public demo or submission, a final stabilization pass is still recommended for:

- realtime/VTT authorization hardening
- migration consistency validation
- environment secret hygiene
- frontend/backend contract alignment
- deterministic integration test execution

---

## Recommended demo narrative

For academic and event presentation, the strongest framing is:

### Title option 1
**Building an Authorial RPG OS with Angular and Real-Time Narrative Memory**

### Title option 2
**From Static Website to Living Platform: Angular, Real-Time Systems and Knowledge Graphs for Tabletop RPGs**

### Title option 3
**Campaign Hub: Angular, Graph-Based Memory and Integrated Tabletop Experience for RPG Campaigns**

---

## What should not change

These are part of the project identity and should remain preserved:

- authorial dark-fantasy presentation
- legacy 2023 references
- Augustus Frostborne and Satoru Naitokira
- product focus on memory, not only CRUD
- Angular-first frontend experience

---

## Contributing

Suggested workflow:

1. create a feature branch
2. implement with tests
3. run local validation
4. open a PR with technical summary and risk notes

---

## License

MIT
