# Deployment Guide

Stack: **Railway** (Backend + DB) · **Vercel** (Frontend) · **Upstash** (Redis)

---

## Prerequisites

- [Railway account](https://railway.app) — Free trial with $5 credit, then ~$1–$5/month
- [Vercel account](https://vercel.com) — Free forever for frontend
- [Upstash account](https://upstash.com) — Free tier (10k requests/day)

---

## 1. Upstash Redis (Do this first)

1. Go to [console.upstash.com](https://console.upstash.com) → **Create Database**
2. Choose **Redis** → region closest to you → **Free tier**
3. Copy the **`UPSTASH_REDIS_REST_URL`** or the raw **`redis://...`** connection string

> **Note:** Use the **`rediss://` (TLS)** URL for production.  
> The env var in your app is `REDIS_URL`.

---

## 2. Railway — Backend + Database

### 2a. Create a new project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo** → select `ready-redis`

### 2b. Add PostgreSQL

1. Inside the project, click **+ New** → **Database** → **PostgreSQL**
2. Once provisioned, click the Postgres service → **Variables** tab
3. Copy the **`DATABASE_URL`** variable (you'll reference it in the next step)

### 2c. Configure the Backend service

Railway will auto-detect the `Dockerfile` at the repo root. Since your Dockerfile is inside `backend/`, set:

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Dockerfile Path** | `Dockerfile` |
| **Start Command** | *(leave empty — uses `CMD` in Dockerfile)* |

**Environment Variables** (Settings → Variables):

| Key | Value |
|---|---|
| `DATABASE_URL` | Reference the Postgres service variable: `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | Your Upstash `rediss://...` URL |
| `SECRET_KEY` | Generate a secure random string: `openssl rand -hex 32` |
| `APP_ENV` | `production` |

### 2d. Configure the Celery Worker service

1. Click **+ New** → **GitHub Repo** → same `ready-redis` repo
2. Set **Root Directory** to `backend`
3. In **Settings → Deploy**, set **Start Command**:
   ```
   uv run celery -A app.celery_app worker --loglevel=info --concurrency=2
   ```
4. Add the **same environment variables** as the backend:
   - `DATABASE_URL` → `${{Postgres.DATABASE_URL}}`
   - `REDIS_URL` → your Upstash URL
   - `SECRET_KEY` → same secret as backend
   - `APP_ENV` → `production`

### 2e. Run Database Migrations

After the backend deploys, open the backend service → **Shell** tab and run:

```bash
uv run alembic upgrade head
```

---

## 3. Vercel — Frontend

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `ready-redis`
2. Set **Root Directory** to `frontend`
3. Vercel will auto-detect Vite. Build settings:
   | Setting | Value |
   |---|---|
   | **Framework Preset** | Vite |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. Add **Environment Variable**:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | Your Railway backend URL (e.g. `https://ready-redis-backend.up.railway.app`) |

5. Click **Deploy**

---

## 4. CORS Configuration

In `backend/app/main.py`, ensure the Railway backend allows requests from your Vercel domain:

```python
origins = [
    "https://your-app.vercel.app",
    "http://localhost:5173",  # local dev
]
```

---

## 5. Summary

| Service | Platform | Cost |
|---|---|---|
| FastAPI Backend | Railway | ~$1–5/mo |
| Celery Worker | Railway | ~$1–5/mo |
| PostgreSQL | Railway | ~$1–5/mo |
| Redis | Upstash | Free |
| React Frontend | Vercel | Free |

> Railway bills by resource usage. With 512MB RAM per service, expect ~$2–4/mo total for backend + worker + DB.
