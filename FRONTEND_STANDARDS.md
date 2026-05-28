# Frontend Standards

## Angular

- Use standalone components and route arrays.
- Prefer Signals and computed values for local demo state.
- Keep services deterministic and framework-native.
- Do not introduce new UI frameworks for the workshop.

## UX

- The first screen must be the usable workshop interface.
- Controls must be compact, stable, and presenter-friendly.
- Avoid marketing sections and unrelated feature explanations.
- Use clear labels and visible state changes for the golden path.

## Styling

- Keep workshop styles scoped to workshop components.
- Use stable layout dimensions for tree, editor, panels, and graph.
- Avoid nested cards and decorative-only effects.
- Text must not overlap at mobile or desktop widths.

## Data

- Use `frontend/src/assets/workshop/seed.json`.
- Use native `fetch` in `MockDataService`.
- Do not use `HttpClient` for workshop seed loading.
