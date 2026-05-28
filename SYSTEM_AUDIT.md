# System Audit

## Executive Diagnosis

Campaign Hub is a brownfield Angular/Express/Prisma project whose repository
identity drifted from a static RPG site into an overextended RPG OS. The codebase
contains valuable wiki, block, relation, and graph concepts, but they are buried
inside backend-dependent campaign flows and operational tabletop systems.

For the workshop, the safest recovery is not deletion. The correct first pass is
an isolated `/workshop` sandbox that demonstrates the approved product story
without depending on unstable legacy surfaces.

## Architectural Strengths

- Angular 17 standalone components are already used across the frontend.
- Lazy routing already exists.
- Strict TypeScript and strict Angular templates are enabled.
- Backend contains prior thinking around wiki hierarchy, blocks, backlinks, and
  knowledge graph aggregation.
- The project has meaningful legacy narrative data that can become demo seed
  content.

## Architectural Failures

- Product identity still says RPG OS, VTT, dice, combat, and realtime.
- Public navigation exposes legacy demo-disrupting routes.
- Frontend core services are HTTP-first and backend-coupled.
- Existing campaign wiki component mixes tree, editor, templates, relations,
  graph stats, drag/drop, bootstrap actions, and backend calls in one file.
- Socket.IO and VTT code remain first-class in routing and documentation.
- Some visible UI text has mojibake.
- `npm run lint` is configured but has no Angular lint target.

## Critical Demo Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend unavailable | Demo failure in legacy pages | `/workshop` uses frontend seed only |
| Auth guard blocks flow | Presenter interruption | `/workshop` has no guard |
| Socket/VTT runtime errors | Demo instability | Do not enter legacy routes |
| Mojibake visible text | Credibility damage | New workshop UI uses clean text |
| Scope confusion | Audience loses narrative | Docs and route focus on living wiki |

## Frontend Inconsistencies

- Standalone components exist, but most are large inline templates/styles.
- Signals appear in shared components, but feature state is mostly RxJS/imperative.
- Design language remains dark fantasy RPG rather than knowledge workspace.
- Feature boundaries are organized around campaigns instead of knowledge.

## Brownfield Recovery Recommendations

1. Isolate `/workshop`.
2. Mock data locally.
3. Build a Signals store.
4. Keep legacy code out of the presenter path.
5. Add tests around demo-critical state transitions.
6. Reposition docs toward living wiki and knowledge organization.

## Workshop Alignment

The approved workshop needs Angular architecture, block editing, semantic links,
timeline/backlinks, and knowledge graph thinking. The repository already has the
conceptual ingredients, but the implementation must be shown through a clean
sandbox rather than the legacy campaign OS.

## Technical Prioritization Matrix

| Priority | Work | Rationale |
|----------|------|-----------|
| P0 | `/workshop` route and mock store | Removes backend/demo risk |
| P0 | Golden path docs | Makes presentation repeatable |
| P1 | Block editor and semantic links | Core workshop story |
| P1 | Backlinks/timeline/graph | Shows narrative memory |
| P2 | Legacy doc cleanup | Improves repo identity |
| Later | Backend refactor/deletion | Not needed for event stability |
