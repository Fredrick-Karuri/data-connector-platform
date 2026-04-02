# Makefile shortcuts for DCP (Data Connector Platform)

help:
	@echo "Usage:"
	@echo "  make up              # start full stack"
	@echo "  make down            # stop containers"
	@echo "  make build           # build images"
	@echo "  make restart         # rebuild + restart"
	@echo "  make migrate         # run Django migrations"
	@echo "  make test-backend    # run backend pytest"
	@echo "  make test-frontend   # run frontend npm tests"
	@echo "  make test            # run all tests"
	@echo "  make logs            # follow api and worker logs"
	@echo "  make seed            # setup mock sources + load django fixtures"
	@echo "  make shell-api       # open django shell"
	@echo "  make shell-worker    # inspect celery worker"

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

restart: down up

migrate:
	docker compose exec api python manage.py migrate

test-backend:
	docker compose exec api pytest -q

test-frontend:
	docker compose exec web npm test

test:
	docker compose exec api pytest
	docker compose exec web npm test

logs:
	docker compose logs -f api worker

seed:
	@chmod +x scripts/setup_sources.sh
	./scripts/setup_sources.sh
	docker compose exec api python manage.py loaddata fixtures/seed.json

shell-api:
	docker compose exec api python manage.py shell

shell-worker:
	docker compose exec worker celery -A core inspect active

.PHONY: help up down build restart migrate test-backend test-frontend test logs seed shell-api shell-worker
