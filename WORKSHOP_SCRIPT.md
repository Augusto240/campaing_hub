# Workshop Script

## Opening

Campaign Hub started as an RPG project, but today the workshop focuses on a
frontend architecture problem: how to organize living narrative knowledge with
Angular.

## Demo Sequence

1. Open `/workshop`.
2. Explain that the demo is mock-first and frontend-only.
3. Select a session page in the tree.
4. Show blocks as composable UI, not a monolithic textarea.
5. Insert a block with `/`.
6. Create a semantic relation with `@Augustus Frostborne`.
7. Show backlinks and timeline updating from state.
8. Show the graph edge as a visual map of memory.
9. Close with the architecture: standalone components, Signals store, seed data,
   and isolated feature boundary.

## Architecture Reveal

Reveal implementation in this order:

1. `workshop.routes.ts`
2. `mock-data.service.ts`
3. `workshop-store.service.ts`
4. editor components
5. graph component

Avoid opening legacy VTT/backend files during the live demo.
