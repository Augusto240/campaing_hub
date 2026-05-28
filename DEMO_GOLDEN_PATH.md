# Demo Golden Path

## Route

Open `/workshop`.

## Presenter Flow

1. Show the wiki tree and select `Sessao 01 - O arquivo vivo`.
2. Point out the editor blocks and the right-side memory panels.
3. Type `/` in a new block.
4. Choose `Callout`.
5. Type or select `@Augustus Frostborne`.
6. Show that relation chips update on the page.
7. Show the timeline receiving the new semantic event.
8. Select `Augustus Frostborne` in the tree.
9. Show the backlink from the edited session page.
10. Open the graph panel and highlight the new edge.

## Stable Features

- `/workshop` loads without backend.
- Wiki tree navigation.
- Slash command menu.
- Entity mention suggestions.
- Backlinks/timeline recomputation.
- SVG knowledge graph.

## Hidden Features

Do not present VTT, combat, dice, chat, auth, dashboard, compendium, Socket.IO,
Prisma, Redis, or Docker as part of the live flow.

## Fallback

If editing fails, reload `/workshop` and use the seeded relation between Satoru
Naitokira and the session page to demonstrate backlinks and graph behavior.
