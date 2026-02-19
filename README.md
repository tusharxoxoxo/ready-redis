# NotifyHub — Generic Notification Management System

A production-ready, asynchronous notification service supporting **Email**, **SMS**, and **Push** channels — built with **FastAPI**, **Celery + Redis**, and a **React** dashboard.

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│  React UI (Port 3000)          Flower Monitor (Port 5555) │
└────────────┬─────────────────────────────────────────────┘
             │ REST + JWT
┌────────────▼─────────────────────────────────────────────┐
│            FastAPI Backend (Port 8000)                    │
│   /api/notifications  /api/stats  /api/auth/token        │
└────────┬─────────────────────────┬────────────────────────┘
         │ SQLAlchemy              │ enqueue task
┌────────▼──────┐         ┌────────▼──────────┐
│   PostgreSQL  │         │   Redis Broker    │
└───────────────┘         └────────┬──────────┘
                                   │
                          ┌────────▼──────────┐
                          │  Celery Worker    │
                          │  email / sms / push│
                          └───────────────────┘
```

## ⚡ Quick Start (Docker)

```bash
# 1. Clone
git clone <repo-url>
cd ready-redis

# 2. Create environment file
cp env.example .env

# 3. Start all services
docker-compose up --build -d

# 4. Check containers
docker-compose ps
```

| Service | URL |
|---|---|
| React UI | http://localhost:3000 |
| FastAPI + Swagger | http://localhost:8000/api/docs |
| Flower (Celery) | http://localhost:5555 |

**Default login:** `admin` / `admin123`

---

## 📡 API Reference

All endpoints require `Authorization: Bearer <token>` (except `/api/auth/token`).

### Authentication
```bash
# Get token
curl -X POST http://localhost:8000/api/auth/token \
  -d "username=admin&password=admin123" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

### Send a Notification
```bash
curl -X POST http://localhost:8000/api/notifications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome!",
    "message": "Your account has been created.",
    "channel": "email",
    "recipient": "user@example.com",
    "priority": "high"
  }'
```

### Schedule a Notification
```bash
curl -X POST http://localhost:8000/api/notifications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Reminder",
    "message": "Your trial expires tomorrow.",
    "channel": "sms",
    "recipient": "+12025550100",
    "priority": "normal",
    "scheduled_at": "2026-02-20T09:00:00Z"
  }'
```

### List Notifications
```bash
curl "http://localhost:8000/api/notifications?status=failed&channel=email" \
  -H "Authorization: Bearer <token>"
```

### Retry a Failed Notification
```bash
curl -X POST http://localhost:8000/api/notifications/<id>/retry \
  -H "Authorization: Bearer <token>"
```

### Stats
```bash
curl http://localhost:8000/api/stats \
  -H "Authorization: Bearer <token>"
```

---

## 🔔 Notification Channels

| Channel | Status | Provider |
|---|---|---|
| Email | ✅ Mock (SMTP-ready) | Set `SMTP_*` env vars for real delivery |
| SMS | ✅ Mock (Twilio-ready) | Set `TWILIO_*` env vars |
| Push | ✅ Mock (FCM-ready) | Set `FCM_SERVER_KEY` env var |

---

## 🔄 Retry Mechanism

Failed notifications retry **3 times** with exponential backoff:
- Attempt 1: retry after **30s**
- Attempt 2: retry after **60s**
- Attempt 3: retry after **120s**

After 3 failures, status becomes `failed` and manual retry via API/UI is available.

---

## 🛠 Local Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Start Postgres + Redis locally first, then:
uvicorn app.main:app --reload

# In another terminal — start Celery worker
celery -A app.celery_app.celery_app worker --loglevel=info -Q email,sms,push
```

### Frontend
```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

---

## 📁 Project Structure

```
ready-redis/
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI app
│   │   ├── models.py       # SQLAlchemy ORM models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # JWT auth
│   │   ├── celery_app.py   # Celery factory
│   │   ├── tasks/
│   │   │   ├── email_task.py
│   │   │   ├── sms_task.py
│   │   │   └── push_task.py
│   │   └── routers/
│   │       ├── notifications.py
│   │       └── stats.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/          # Dashboard, Notifications, Create, Login
│   │   ├── components/     # Navbar, StatusBadge, NotificationDetail
│   │   ├── api/api.js      # Axios client
│   │   └── context/        # AuthContext
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── env.example
```

---

## 🚀 Deployment

### Render / Railway
1. Push to GitHub
2. Create a **Web Service** (backend) pointing to `./backend`
3. Create a **Static Site** or **Web Service** (frontend)
4. Add a **Redis** addon
5. Add a **PostgreSQL** addon
6. Set env vars from `env.example`

### AWS / VPS
```bash
docker-compose -f docker-compose.yml up -d
```
Point a reverse proxy (nginx/Caddy) to ports 3000 and 8000.


cd ready-redis
# 1. Copy env file
cp env.example .env
# 2. Start all 7 services
docker-compose up --build -d
# 3. Check everything is running
docker-compose ps
Service	URL
React UI	http://localhost:3000
API + Swagger	http://localhost:8000/api/docs
Flower (Celery)	http://localhost:5555
