.PHONY: help build up down logs clean test

help:
	@echo "Available commands:"
	@echo "  make build    - Build all Docker images"
	@echo "  make up       - Start all services"
	@echo "  make down     - Stop all services"
	@echo "  make logs     - View logs"
	@echo "  make clean    - Clean up containers and volumes"
	@echo "  make test     - Run tests"
	@echo "  make prod-up  - Start in production mode"
	@echo "  make prod-down - Stop production mode"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Application started at http://localhost:3000"

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

test:
	cd backend && pytest
	cd frontend && npm test

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

shell-backend:
	docker-compose exec backend /bin/bash

shell-frontend:
	docker-compose exec frontend /bin/sh

db-shell:
	docker-compose exec postgres psql -U user -d crawler_db

redis-cli:
	docker-compose exec redis redis-cli