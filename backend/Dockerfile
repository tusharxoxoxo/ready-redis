FROM python:3.12-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files first to leverage cache
COPY pyproject.toml uv.lock ./

# Install dependencies into a virtual environment
# --frozen: sync from lockfile
# --no-dev: do not install dev dependencies
# --no-install-project: do not install the project itself yet
RUN uv sync --frozen --no-dev --no-install-project

# Add virtual environment to PATH
ENV PATH="/app/.venv/bin:$PATH"

COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
