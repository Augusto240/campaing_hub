<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] -> Angular Standalone Boundary
- [PRINCIPLE_2_NAME] -> Mock-First Demo Reliability
- [PRINCIPLE_3_NAME] -> Block Composition Over Feature Sprawl
- [PRINCIPLE_4_NAME] -> Semantic Memory Is The Product
- [PRINCIPLE_5_NAME] -> Clean UX Over Quantity
Added sections:
- Workshop Scope Boundaries
- Development Workflow And Quality Gates
Removed sections:
- Template placeholders
Templates requiring updates:
- .specify/templates/plan-template.md reviewed, no project-specific change required
- .specify/templates/spec-template.md reviewed, no project-specific change required
- .specify/templates/tasks-template.md reviewed, no project-specific change required
Follow-up TODOs: none
-->

# Campaign Hub Workshop Constitution

## Core Principles

### I. Angular Standalone Boundary
All workshop-facing code MUST use Angular 17 standalone components, standalone
routes, and explicit component imports. NgModules, shared mega-modules, and
implicit app-wide feature coupling are forbidden inside `frontend/src/app/features/workshop`.

The workshop route is a clean architecture sandbox. It may reuse only stable
platform primitives such as Angular core, router, forms, and local styles.

### II. Mock-First Demo Reliability
The official demo MUST run without backend, database, Redis, Socket.IO,
authentication, Prisma migrations, Docker, or external API availability.
Workshop data MUST be loaded from deterministic frontend assets and kept in
local UI state.

Any code that can make the demo depend on a live server is out of scope for the
workshop path unless a future constitution amendment explicitly approves it.

### III. Block Composition Over Feature Sprawl
The editor MUST be composed from small block-oriented components and plain view
models. A block type is added only when it improves the approved golden path:
paragraph, heading, quote, callout, checklist, and code.

VTT, combat, dice, fog of war, chat, multiplayer, compendium operations, and
backend CRUD are frozen legacy surfaces for this recovery pass.

### IV. Semantic Memory Is The Product
Campaign Hub is governed as a living wiki and knowledge organization platform.
Semantic relations, backlinks, timeline context, and graph navigation are the
core product narrative.

RPG names and canon are demo data. They MUST NOT pull the implementation back
into operational tabletop mechanics.

### V. Clean UX Over Quantity
The workshop MUST prioritize a stable, legible, presenter-friendly experience.
Every visible interaction must support the golden path and must remain useful
under live demo pressure.

Feature count, visual spectacle, and backend completeness are secondary to
clarity, speed, and predictable behavior.

## Workshop Scope Boundaries

- The only official live-demo route is `/workshop`.
- `/workshop` MUST NOT require login, campaign membership, database records, or
  network access beyond serving static frontend assets.
- Legacy code is Freeze + Hide: preserve it in the repository, but keep it out
  of the workshop route and presenter navigation.
- The root app, authenticated campaign flows, VTT, Socket.IO, dice, combat,
  compendium, and backend modules are not repaired in this pass.

## Development Workflow And Quality Gates

- SDD artifacts MUST exist before implementation changes are considered done.
- New workshop behavior MUST have focused tests for state derivation and the
  golden path.
- Required frontend checks before demo handoff:
  - `npm run build`
  - `npm test -- --watch=false --browsers=ChromeHeadless`
- The mojibake checker SHOULD pass for all workshop-facing UI text before the
  live event.

## Governance

This constitution supersedes prior README language for the Google I/O Extended
workshop scope. Amendments require an explicit written rationale, updated SDD
artifacts, and a documented impact on `/workshop` reliability.

Versioning follows semantic versioning:
- MAJOR for scope reversals or backend/demo dependency reintroduction.
- MINOR for new principles or material scope additions.
- PATCH for wording clarifications.

All implementation, planning, and review work MUST verify compliance with these
principles before expanding the demo surface.

**Version**: 1.0.0 | **Ratified**: 2026-05-27 | **Last Amended**: 2026-05-27
