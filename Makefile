# Makefile shortcuts for build, test, and seed commands

help:
	@echo "Usage:"
	@echo "  make up              # start full stack"
	@echo "  make down            # stop containers"
	@echo "  make build           # build images"
	@echo "  make restart         # rebuild + restart"
	@echo "  make backend-migrate # run Django migrations"
	@echo "  make backend-shell   # run Django shell"
	@echo "  make backend-test    # run backend pytest"
	@echo "  make frontend-test   # run frontend tests"
	@echo "  make seed            # run seed fixtures"

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

restart: down up

backend-migrate:
	docker compose exec backend python manage.py migrate

backend-shell:
	docker compose exec backend python manage.py shell

backend-test:
	docker compose exec backend pytest -q

frontend-test:
	cd app/frontend && npm test

seed:
	docker compose exec backend python manage.py loaddata fixtures/seed.json


.PHONY: help up down build restart backend-migrate backend-shell backend-test frontend-test seed