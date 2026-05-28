# Failure Recovery Plan

## If `/workshop` Does Not Load

1. Run `cd frontend && npm run build`.
2. If build passes, restart the dev server.
3. Open `/workshop` directly instead of navigating from the root app.

## If Seed Loading Fails

1. Confirm `frontend/src/assets/workshop/seed.json` exists.
2. Confirm the browser network tab loads `/assets/workshop/seed.json`.
3. Use the production build output as fallback.

## If Editing Fails During Demo

Use seeded relations:

- Open `Satoru Naitokira`.
- Show existing backlinks.
- Open graph and show existing edges.

## If Backend Fails

Ignore it. The official workshop path does not use backend services.

## If Legacy UI Appears

Navigate directly to `/workshop`. Legacy routes are outside the golden path.
