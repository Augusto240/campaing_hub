# UI Contract: Workshop Sandbox

## Route Contract

- Path: `/workshop`
- Auth: none
- Backend: none
- Primary data source: `/assets/workshop/seed.json`

## Golden Path Contract

1. Tree renders at initial load.
2. Initial page is selected automatically.
3. `/` in an empty block opens the command menu.
4. Block command changes the selected block type.
5. Known `@EntityName` text creates one semantic relation.
6. Relation creates:
   - outgoing chip on source page
   - backlink on target page
   - relation timeline event
   - graph edge

## Failure Contract

If seed loading fails, the workshop displays a scoped error message and does not
redirect into legacy pages.
