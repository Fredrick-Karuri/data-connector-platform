# Makefile shortcuts for DCP (Data Connector Platform)

help:
	@echo "Usage:"
	@echo "  make up              # start full stack"
	@echo "  make down            # stop containers"
	@echo "  make build           # build images"
	@echo "  make restart         # rebuild + restart"
	@echo "  make makemigrations  # create new migrations"
	@echo "  make migrate         # run Django migrations"
	@echo "  make test-backend    # run backend pytest"
	@echo "  make test-frontend   # run frontend npm tests"
	@echo "  make test            # run all tests"
	@echo "  make logs            # follow api and worker logs"
	@echo "  make logs-api        # follow api logs only"
	@echo "  make logs-worker     # follow worker logs only"
	@echo "  make logs-frontend   # follow frontend logs only"
	@echo "  make seed            # setup mock sources + load django fixtures"
	@echo "  make shell-api       # open django shell"
	@echo "  make shell-worker    # inspect celery worker"
	@echo "  make clean           # remove containers, volumes, images, cache"

up:
	docker compose up -d --build
	@echo "Stack running → http://localhost:3000"

down:
	docker compose down

build:
	docker compose build

restart: down up

makemigrations:
	docker compose exec api python manage.py makemigrations

migrate:
	docker compose exec api python manage.py migrate

test-backend:
	docker compose exec api pytest -q

test-frontend:
	docker compose exec web npm test

test:
	@echo "── Backend ──────────────────────"
	docker compose exec api pytest --tb=short
	@echo "── Frontend ─────────────────────"
	docker compose exec web npm test -- --watchAll=false

logs:
	docker compose logs -f api worker

logs-api:
	docker compose logs -f api

logs-worker:
	docker compose logs -f worker

logs-frontend:
	docker compose logs -f web

seed:
	@chmod +x scripts/setup_sources.sh
	./scripts/setup_sources.sh
	docker compose exec api python manage.py loaddata /app/fixtures/seed.json

shell-api:
	docker compose exec api python manage.py shell

shell-worker:
	docker compose exec worker celery -A core inspect active

clean:
	docker compose down -v --rmi local
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null; true
	find . -name "*.pyc" -delete 2>/dev/null; true

.PHONY: help up down build restart makemigrations migrate test-backend test-frontend test logs logs-api logs-worker logs-frontend seed shell-api shell-worker clean