# Feature Specification: Workshop Sandbox

**Feature Branch**: `001-workshop-sandbox`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Build an isolated `/workshop` Angular 17 living wiki demo using frontend-only mock data, block editing, semantic relations, backlinks, timeline, and a knowledge graph."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open the stable workshop (Priority: P1)

As a presenter, I can open `/workshop` and immediately show a clean living wiki
interface without login, backend, or legacy RPG operational tools.

**Why this priority**: The live demo must start reliably.

**Independent Test**: Open `/workshop` with backend stopped and confirm the wiki
tree, editor, timeline, and graph panels render from seed data.

**Acceptance Scenarios**:

1. **Given** the frontend app is served, **When** `/workshop` loads, **Then** the workshop interface appears without auth or backend requests.
2. **Given** legacy routes still exist, **When** the presenter stays inside `/workshop`, **Then** VTT, dice, combat, and campaign CRUD are not shown.

---

### User Story 2 - Compose narrative blocks (Priority: P1)

As a presenter, I can type `/` in an editor block and convert or insert a block
type that demonstrates composable Angular UI.

**Why this priority**: Block composition is central to the workshop narrative.

**Independent Test**: Type `/`, choose a block type, and verify the editor updates
without route changes or backend calls.

**Acceptance Scenarios**:

1. **Given** a page is selected, **When** the user types `/`, **Then** a block command menu appears.
2. **Given** the command menu is open, **When** the user chooses Callout, **Then** the current block becomes a callout block.

---

### User Story 3 - Create semantic memory (Priority: P1)

As a presenter, I can type or select `@Augustus Frostborne` and show backlinks,
timeline, and graph updates immediately.

**Why this priority**: This proves the product pivot from RPG OS to living memory.

**Independent Test**: Add `@Augustus Frostborne` to a block and verify relation,
timeline, backlink, and graph state change.

**Acceptance Scenarios**:

1. **Given** a selected session page, **When** the user adds `@Augustus Frostborne`, **Then** a relation chip appears for that page.
2. **Given** the relation exists, **When** the user opens the Augustus page, **Then** the session page appears as a backlink.
3. **Given** the relation exists, **When** the graph renders, **Then** an edge connects the session page to Augustus.

### Edge Cases

- If seed loading fails, show a local error state instead of entering legacy pages.
- If the same entity is mentioned multiple times, create only one relation per
  source page and target entity.
- If text contains an unknown `@` mention, keep the text but do not create a relation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `/workshop` as an unauthenticated route.
- **FR-002**: System MUST load workshop data from frontend assets.
- **FR-003**: System MUST render a hierarchical wiki tree.
- **FR-004**: Users MUST be able to select pages from the tree.
- **FR-005**: System MUST render selected page blocks.
- **FR-006**: Users MUST be able to type `/` and choose paragraph, heading, quote, callout, checklist, or code blocks.
- **FR-007**: System MUST create semantic relations for known `@EntityName` mentions.
- **FR-008**: System MUST derive backlinks from semantic relations.
- **FR-009**: System MUST derive timeline entries from seed data and live relations.
- **FR-010**: System MUST render a knowledge graph from page/entity nodes and relation edges.
- **FR-011**: System MUST NOT depend on backend, auth, Socket.IO, VTT, dice, combat, Prisma, Redis, or Docker for `/workshop`.

### Key Entities

- **Workshop Page**: A wiki page with hierarchy, tags, summary, and blocks.
- **Workshop Block**: Editable page content unit with a type and text.
- **Workshop Entity**: Named narrative memory target such as a character, place, or concept.
- **Workshop Relation**: Semantic connection from a page to an entity/page.
- **Timeline Entry**: Ordered memory event derived from seed data or live relation edits.
- **Graph View**: Nodes and edges derived from pages, entities, and relations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `/workshop` loads successfully with backend services stopped.
- **SC-002**: The presenter can complete the golden path in under 3 minutes.
- **SC-003**: Adding `@Augustus Frostborne` updates relation, timeline, backlink, and graph state in the same interaction session.
- **SC-004**: Frontend build and focused tests pass before handoff.

## Assumptions

- `/workshop` is the only official event route.
- Legacy code is preserved but not part of demo acceptance.
- Seed data can use RPG-themed names as dummy narrative content.
- Mobile support should be usable, but the primary workshop viewport is desktop.
