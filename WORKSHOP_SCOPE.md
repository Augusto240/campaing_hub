# Workshop Scope

## Approved Positioning

Campaign Hub is now presented as a living wiki and knowledge organization
platform for narrative systems built with Angular.

The Google I/O Extended + Build with AI 2026 Natal workshop is:

**Construindo uma wiki viva com Angular: blocos, memoria narrativa e organizacao de conhecimento**

## In Scope

- Angular 17 standalone architecture.
- Dedicated `/workshop` route.
- Deterministic frontend mock data.
- Hierarchical wiki tree.
- Block editor with slash commands.
- Semantic `@EntityName` relations.
- Reactive backlinks and timeline.
- Lightweight knowledge graph from mock data.
- Presentation-grade UX and predictable demo flow.

## Out Of Scope

- VTT, grid maps, fog of war, lighting, tokens, combat, dice, chat, multiplayer,
  Socket.IO, backend persistence, auth flows, Prisma migrations, Redis, and
  production infrastructure.

## Recovery Strategy

Use Freeze + Hide. Legacy code remains in the repository, but it must not be on
the presenter path and must not affect `/workshop` runtime behavior.
