# Setup Guide

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Docker | 24+ |
| Docker Compose | v2 |
| VS Code | Any (for devcontainer) |
| Dev Containers extension | Any |

---

## Option A — Dev Container (Recommended)

The repo ships with a `.devcontainer` that builds the backend image, installs frontend deps, and forwards all ports automatically.

1. Open the repo in VS Code
2. When prompted, click **Reopen in Container** (or run `Dev Containers: Reopen in Container` from the command palette)
3. Wait for `postCreateCommand` to finish — it runs `npm install` and `make help`
4. Inside the container terminal:

```bash
cp .env.example .env          # add a DJANGO_SECRET_KEY (any long random string)
make build                    # build all Docker images
make up                       # start full stack
make migrate                  # apply Django migrations
make seed                     # seed all 4 mock source databases
```

5. Open http://localhost:3000, register an account, and start extracting.

---

## Option B — Docker Compose (No Dev Container)

```bash
git clone <repo>
cd <repo>

cp .env.example .env          # fill in DJANGO_SECRET_KEY

docker compose build
docker compose up -d
docker compose exec api python manage.py migrate
docker compose exec api python manage.py seed_all   # or: make seed
```

---

## Environment Variables

Copy `.env.example` to `.env`. Only `DJANGO_SECRET_KEY` needs changing for local dev — everything else is pre-wired to the Docker Compose service names.

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | *(required)* | Any long random string |
| `DJANGO_DEBUG` | `True` | Set `False` in production |
| `DATABASE_URL` | `postgres://dcp_user:dcp_pass@app_postgres:5432/dcp_db` | App DB |
| `CELERY_BROKER_URL` | `redis://redis:6379/0` | Redis broker |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/1` | Redis results |
| `STORAGE_ROOT` | `/storage` | File export volume path |
| `MOCK_POSTGRES_DSN` | pre-filled | Seed/test source |
| `MOCK_MYSQL_DSN` | pre-filled | Seed/test source |
| `MOCK_MONGO_URI` | pre-filled | Seed/test source |
| `MOCK_CLICKHOUSE_HOST` | pre-filled | Seed/test source |

---

## Services & Ports

| Service | Port | Notes |
|---|---|---|
| Frontend (Next.js) | 3000 | Main UI |
| API (Django) | 8000 | REST + JWT |
| App PostgreSQL | 5432 | Internal app DB |
| Redis | 6379 | Broker + cache |
| Mock MongoDB | 27017 | Source connector testing |
| Mock MySQL | 3306 | Source connector testing |
| Mock ClickHouse | 8123 (HTTP) / 9000 (TCP) | Source connector testing — use port 9000 |

All ports are forwarded in the devcontainer (`forwardPorts` in `.devcontainer/devcontainer.json`).

---

## Connecting to a Mock Source

After seeding, create a connection in the UI using these credentials:

### PostgreSQL
| Field | Value |
|---|---|
| Host | `mock_postgres` |
| Port | `5432` |
| User | `mock_user` |
| Password | `mock_pass` |
| Database | `mock_postgres_db` |

### MySQL
| Field | Value |
|---|---|
| Host | `mock_mysql` |
| Port | `3306` |
| User | `mock_user` |
| Password | `mock_pass` |
| Database | `mock_mysql_db` |

### MongoDB
| Field | Value |
|---|---|
| URI | `mongodb://mock_user:mock_pass@mock_mongo:27017/mock_mongo_db` |

### ClickHouse
| Field | Value |
|---|---|
| Host | `mock_clickhouse` |
| Port | `9000` |
| User | `mock_user` |
| Password | `mock_pass` |
| Database | `mock_clickhouse_db` |

> ClickHouse exposes both port 8123 (HTTP) and 9000 (native TCP). The connector uses `clickhouse-driver` which speaks the native TCP protocol — always use **9000**.

---

## Make Commands

```bash
make build        # Build all Docker images
make up           # Start all services (detached)
make down         # Stop services and remove volumes
make migrate      # Run Django migrations
make seed         # Seed all 4 mock source databases
make test         # Run backend + frontend test suites
make logs         # Tail API and worker logs
make shell-api    # Open Django shell
```