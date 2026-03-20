# Campaign Hub - Quick Start

## Docker (recommended)

1. Copy backend environment variables:
```bash
cp backend/.env.example backend/.env
```
2. Fill in `backend/.env`:
- `JWT_SECRET` (min 32 chars)
- `JWT_REFRESH_SECRET` (min 32 chars)
3. Start services:
```bash
docker compose up -d --build
```
4. Verify:
- Frontend: `http://localhost`
- API: `http://localhost:3000/api`
- Health: `http://localhost:3000/health`

## Manual setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate:deploy
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Migrations

Expected migration order:
- `20260320110000_initial_schema`
- `20260320120000_security_hardening`
- `20260320143000_phase3_multisystem`

In clean environments, use `prisma migrate deploy`.

## Phase 3 routes (quick check)

- `GET /api/rpg-systems`
- `POST /api/dice/roll`
- `GET /api/dice/campaign/:campaignId`
- `GET /api/wiki/campaign/:campaignId`
- `PATCH /api/sessions/:sessionId/log`
- `POST /api/characters/:characterId/sanity-check`
- `POST /api/characters/:characterId/spell-cast`

## Frontend routes (quick check)

- `http://localhost/campaigns/:id/wiki`
- `http://localhost/campaigns/:id/tools`
- `http://localhost/dice`

## Troubleshooting

### Database does not start
```bash
docker compose logs -f postgres
```

### Backend cannot connect
```bash
docker compose logs -f backend
```

### Reset everything
```bash
docker compose down -v
docker compose up -d --build
```
