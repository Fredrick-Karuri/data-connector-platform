# Data Connector Platform (DCP)
A high-performance Django/DRF platform for extracting and transforming data from heterogeneous sources (Postgres, MySQL, MongoDB, ClickHouse).
## 🚀 Quick Start (Dev Container)
The easiest way to develop is using **VS Code Dev Containers**:1. Open this folder in VS Code.2. Click **"Reopen in Container"** when prompted.3. Once the container starts, run:
   ```bash
   make up
   make backend-migrate

## 🛠 Tech Stack

* Backend: Django 5.x / Django REST Framework
* Auth: JWT (SimpleJWT) with RBAC roles
* Async Processing: Celery + Redis (Handles 100MB+ extractions)
* Databases: PostgreSQL (Core), ClickHouse, MongoDB, MySQL (Mock Sources)
* DevOps: Docker Compose, Makefile, Dev Containers

## 📂 Project Structure

* app/backend/: Django source code
* app/frontend/: Next.js frontend
* scripts/: SQL/JS seed scripts for mock databases
* storage/: Local volume for exported data files (CSV/JSON)

## ⌨️ Common Commands (via Makefile)

| Command [3, 4, 5] | Description |
|---|---|
| make up | Start all services (API, Workers, DBs) |
| make restart | Rebuild and restart containers |
| make backend-migrate | Run Django migrations inside the container |
| make backend-test | Run pytest suite |
| make seed | Load initial fixtures and mock data |

## 🏗 System Design Constraints

* Batch Limits: Max 10,000 rows or 100MB per extraction request.
* Security: Roles are embedded in JWT payloads for sub-millisecond RBAC checks.
* Patterns: Uses a Factory Pattern for database connectors to support easy scaling of source types.