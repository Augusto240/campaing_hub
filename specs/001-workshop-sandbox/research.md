# Research: Workshop Sandbox

## Decision: Isolate The Demo At `/workshop`

**Rationale**: A dedicated lazy route avoids auth, campaign CRUD, sockets, and
legacy navigation while preserving the rest of the repository.

**Alternatives considered**: Root rewrite rejected because it increases churn.
Campaign wiki reuse rejected because it depends on backend/auth and contains
mojibake.

## Decision: Use Frontend Seed Data

**Rationale**: Static seed data is deterministic and works when backend services
are stopped.

**Alternatives considered**: Express mocks and Prisma seed data rejected because
they reintroduce operational setup risk.

## Decision: Use Angular Signals

**Rationale**: The demo state is local, synchronous, and derivable. Signals keep
page selection, relations, backlinks, timeline, and graph view models explicit.

**Alternatives considered**: RxJS-only store rejected for this isolated local
workflow because it adds ceremony without improving reliability.

## Decision: Use SVG For Graph

**Rationale**: A deterministic SVG graph avoids new dependencies and is enough
to show nodes and semantic edges during the workshop.

**Alternatives considered**: D3 or canvas libraries rejected because they add
bundle and learning surface not needed for the golden path.
