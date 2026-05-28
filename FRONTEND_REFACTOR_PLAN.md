# Frontend Refactor Plan

## Immediate Fixes

- Add `/workshop` as an isolated lazy route.
- Hide legacy navbar on `/workshop`.
- Add deterministic seed data under frontend assets.
- Build a Signals store for workshop state.
- Add focused tests around demo-critical behavior.

## High-Risk Modules

- `features/campaign/campaign-wiki`: large component, visible mojibake, backend
  dependency, mixed editor/tree/relation responsibilities.
- `features/campaign/campaign-vtt` and `campaign-tabletop`: Socket.IO and
  pointer-heavy runtime risk.
- `core/services/*`: HTTP-backed services couple UI behavior to backend state.
- `app.component`: legacy navigation still frames the product as an RPG OS.

## Safe Simplifications

- Do not delete legacy code in this pass.
- Do not repair authenticated campaign flows for the workshop.
- Keep new domain types local to `features/workshop`.
- Use SVG for the graph instead of adding a graph library.

## Impact vs Complexity

| Item | Impact | Complexity |
|------|--------|------------|
| Isolated `/workshop` route | High | Low |
| Mock seed + Signals store | High | Medium |
| Slash block editor | High | Medium |
| Reactive backlinks/timeline | High | Medium |
| Graph view | Medium | Medium |
| Deleting legacy VTT/backend code | Low for demo | High |
