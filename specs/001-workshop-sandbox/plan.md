# Implementation Plan: Workshop Sandbox

**Branch**: `001-workshop-sandbox` | **Date**: 2026-05-27 | **Spec**: `specs/001-workshop-sandbox/spec.md`

**Input**: Feature specification from `specs/001-workshop-sandbox/spec.md`

## Summary

Build an isolated `/workshop` Angular 17 sandbox that demonstrates a living wiki
with block editing, semantic relations, backlinks, timeline, and knowledge graph
using deterministic frontend seed data.

## Technical Context

**Language/Version**: TypeScript, Angular 17

**Primary Dependencies**: Angular core, router, forms, Signals

**Storage**: Frontend asset seed JSON plus in-memory Signals

**Testing**: Karma/Jasmine

**Target Platform**: Browser

**Project Type**: Angular web application

**Performance Goals**: Workshop route renders from seed data in one local load
cycle and updates derived state immediately after edits.

**Constraints**: No backend, auth, Socket.IO, VTT, dice, combat, Prisma, Redis,
or Docker dependency for `/workshop`.

**Scale/Scope**: Single presentation-grade route with focused components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Angular standalone boundary: PASS
- Mock-first demo reliability: PASS
- Block composition over feature sprawl: PASS
- Semantic memory product focus: PASS
- Clean UX over quantity: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-workshop-sandbox/
+-- plan.md
+-- research.md
+-- data-model.md
+-- quickstart.md
+-- contracts/
`-- tasks.md
```

### Source Code

```text
frontend/src/app/features/workshop/
+-- workshop.routes.ts
+-- workshop-shell.component.ts
+-- workshop.types.ts
+-- services/
+-- components/
|   +-- editor/
|   +-- wiki-tree/
|   +-- backlinks-timeline/
|   `-- knowledge-graph/
`-- services/workshop-store.service.spec.ts

frontend/src/assets/workshop/seed.json
```

**Structure Decision**: Keep all demo code inside `features/workshop` and data
inside `assets/workshop` to preserve a hard boundary from legacy modules.

## Complexity Tracking

No constitution violations.
