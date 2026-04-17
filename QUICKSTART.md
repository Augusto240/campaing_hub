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
Defaults locais seguros para Postgres, Grafana e `FRONTEND_URL` ja estao no `docker-compose.yml`, entao nao e necessario criar `.env` na raiz para subir a stack.
4. Verify:
- Frontend: `http://localhost:8081`
- API: `http://localhost:3002/api`
- Health: `http://localhost:3002/health`
- Grafana: `http://localhost:3003`
- Prometheus: `http://localhost:9091`

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
- `20260321003703_phase7_combat_creatures_proposals`
- `20260326140000_phase8_wiki_hierarchy_legacy`

In clean environments, use `prisma migrate deploy`.

## Environment Variables (new in Phase 4+)

Add to `backend/.env`:
```bash
REDIS_URL=redis://localhost:6379
METRICS_TOKEN=your-metrics-secret-token
LOG_LEVEL=info
```

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5433 | Database |
| Redis | 6380 | Cache + sessions |
| Backend | 3002 | API + WebSockets |
| Frontend | 8081 | Angular app |
| Prometheus | 9091 | Metrics |
| Grafana | 3003 | Dashboards |

## Phase 7 routes (Combat, Creatures, Proposals)

- `POST /api/sessions/:sessionId/combat` - Create combat encounter
- `GET /api/sessions/:sessionId/combat` - List encounters
- `PATCH /api/combat/:encounterId/next-turn` - Advance turn
- `POST /api/combat/:encounterId/combatants` - Add combatant
- `PATCH /api/combat/:encounterId/combatants/:id` - Update combatant
- `DELETE /api/combat/:encounterId/combatants/:id` - Remove combatant
- `GET /api/creatures` - List creature compendium
- `POST /api/campaigns/:campaignId/session-proposals` - Create proposal
- `POST /api/session-proposals/:id/votes` - Vote on date
- `PATCH /api/session-proposals/:id/decide` - Confirm date (GM)
- `PATCH /api/session-proposals/:id/cancel` - Cancel proposal (GM)

## Phase 3 routes (quick check)

- `GET /api/rpg-systems`
- `POST /api/dice/roll`
- `GET /api/dice/campaign/:campaignId`
- `GET /api/wiki/campaign/:campaignId`
- `GET /api/wiki/campaign/:campaignId/tree`
- `POST /api/wiki/campaign/:campaignId/seed-legacy`
- `PATCH /api/sessions/:sessionId/log`
- `POST /api/characters/:characterId/sanity-check`
- `POST /api/characters/:characterId/spell-cast`

## Frontend routes (quick check)

- `http://localhost/campaigns/:id/wiki`
- `http://localhost/campaigns/:id/tabletop`
- `http://localhost/campaigns/:id/tools`
- `http://localhost/campaigns/:id/combat`
- `http://localhost/campaigns/:id/compendium`
- `http://localhost/campaigns/:id/schedule`
- `http://localhost/dice`

## Realtime events (Tabletop beta)

- `campaign:tabletop:request`
- `campaign:tabletop:update`
- `campaign:tabletop:state`
- `campaign:joined`
- `campaign:error`

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
