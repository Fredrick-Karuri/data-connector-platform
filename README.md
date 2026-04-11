# Data Connector Platform

A bridge between heterogeneous data sources (PostgreSQL, MySQL, MongoDB, ClickHouse) and a unified editable grid interface with dual-storage exports.

## Quick Start

```bash
cp .env.example .env          # fill in DJANGO_SECRET_KEY
make build                    # build all Docker images
make up                       # start the full stack
make migrate                  # run Django migrations
make seed                     # populate mock source databases
```

Then open http://localhost:3000 — register an account and start extracting.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TanStack Table, Axios |
| API | Django REST Framework + JWT |
| Workers | Celery + Redis |
| App DB | PostgreSQL (JSONB for flexible schemas) |
| Mock Sources | PostgreSQL, MySQL, MongoDB, ClickHouse |
| File Storage | Docker volume `/storage` |

## Environment Variables

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret (required) |
| `DATABASE_URL` | App PostgreSQL DSN |
| `CELERY_BROKER_URL` | Redis broker URL |
| `STORAGE_ROOT` | File export path (default `/storage`) |
| `BATCH_MAX_ROWS` | Max rows per extraction (default 10,000) |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/token/` | Login → JWT tokens |
| GET | `/api/connections/` | List connections |
| POST | `/api/connections/test/` | Test credentials |
| POST | `/api/extract/` | Start extraction job |
| GET | `/api/jobs/{id}/` | Poll job status |
| POST | `/api/submit-batch/` | Dual-storage write |
| GET | `/api/files/` | List accessible files |
| GET | `/api/files/{id}/download/` | Download (RBAC gated) |

## Make Commands

```bash
make build        # Build Docker images
make up           # Start all services
make down         # Stop and remove volumes
make seed         # Seed all 4 mock source databases
make migrate      # Run Django migrations
make test         # Run full test suite (backend + frontend)
make logs         # Tail API and worker logs
make shell-api    # Django shell
```

## Adding a New Database Type

1. Create `app/backend/connectors/drivers/snowflake.py` extending `BaseConnector`
2. Add one entry to `DRIVER_MAP` in `connectors/factory.py`

No other files need changing (Factory Pattern, design p.4-5).

## Test Suite

```bash
# Backend (98 tests)
make test-backend

# Frontend (36 tests)
make test-frontend
```

## Documentation

Detailed guides and design specs can be found in the `/Docs` directory:

- [**System Setup**](./Docs/setup.md) — Environment config, port mappings, and seeding.
- [**System Design**](./Docs/system-design.md) — Architecture, flattening strategies, and API contracts.
- [**Architecture Decision Records**](./Docs/adr.md) — Key design decisions, alternatives considered, and trade-offs.