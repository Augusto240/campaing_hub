# Data Model: Workshop Sandbox

## WorkshopPage

- `id`: stable seed/local identifier
- `title`: visible page title
- `parentId`: nullable hierarchy parent
- `summary`: short presenter-friendly description
- `tags`: list of labels
- `updatedAt`: ISO timestamp
- `blocks`: ordered `WorkshopBlock[]`

## WorkshopBlock

- `id`: stable per page
- `type`: `paragraph | heading | quote | callout | checklist | code`
- `content`: editable text
- `checked`: optional checklist state

## WorkshopEntity

- `id`: stable entity identifier
- `name`: mention name typed after `@`
- `type`: `character | place | faction | concept | session`
- `summary`: short context
- `pageId`: optional page represented by this entity

## WorkshopRelation

- `id`: stable seed/local identifier
- `sourcePageId`: page where the relation was created
- `targetEntityId`: mentioned entity
- `targetPageId`: optional linked page
- `label`: relation label
- `createdAt`: ISO timestamp
- `origin`: `seed | live`

## WorkshopTimelineEntry

- `id`: stable seed/local identifier
- `pageId`: source page
- `title`: visible event title
- `description`: short event body
- `happenedAt`: ISO timestamp
- `kind`: `seed | relation`
- `relationId`: optional relation source

## GraphViewModel

- `nodes`: pages and entities
- `edges`: semantic relations
- `highlightEdgeId`: most recent live relation
