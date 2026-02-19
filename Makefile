# NotifyHub — Makefile for common tasks

.PHONY: test test-backend test-frontend install-backend install-frontend

# ── Install ──────────────────────────────────────────────────────────────────

install-backend:
	cd backend && python3 -m venv venv && venv/bin/pip install -r requirements.txt -r requirements-test.txt "bcrypt==4.0.1" -q

install-frontend:
	cd frontend && npm install

install: install-backend install-frontend

# ── Tests ─────────────────────────────────────────────────────────────────────

test-backend:
	cd backend && DATABASE_URL="sqlite:///./test.db" REDIS_URL="redis://localhost:6379/0" SECRET_KEY="test-secret" \
		venv/bin/python -m pytest tests/ -v

test-frontend:
	cd frontend && npm run test:run

test: test-backend test-frontend

# ── Docker ─────────────────────────────────────────────────────────────────────

up:
	docker-compose up --build -d

down:
	docker-compose down

logs:
	docker-compose logs -f backend celery_worker

# ── Dev (no Docker) ──────────────────────────────────────────────────────────

dev-backend:
	cd backend && venv/bin/uvicorn app.main:app --reload

dev-frontend:
	cd frontend && npm run dev

dev-worker:
	cd backend && venv/bin/celery -A app.celery_app.celery_app worker --loglevel=info -Q email,sms,push
