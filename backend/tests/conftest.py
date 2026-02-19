"""
Shared test fixtures and app factory helpers.

Uses an in-memory SQLite database (no real Postgres needed) and
mocks Celery tasks so no Redis connection is required during tests.

IMPORTANT: Environment variables MUST be set before any app module import
so that pydantic-settings picks up the SQLite URL instead of the Postgres one.
"""

import os
import pytest

# ── Override env BEFORE any app import ───────────────────────────────────────
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# ── In-memory SQLite test DB ──────────────────────────────────────────────────
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"

test_engine = create_engine(
    SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """Create all tables at start of test session, drop at end."""
    from app.database import Base
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    # Clean up the test.db file
    if os.path.exists("test.db"):
        os.remove("test.db")


@pytest.fixture()
def db():
    """Per-test DB session — rolls back after each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    """
    FastAPI TestClient with:
    - SQLite DB override
    - Celery tasks mocked (no Redis required)
    """
    from app.main import app
    from app.database import get_db

    app.dependency_overrides[get_db] = lambda: db

    # Mock all Celery task `.apply_async` calls
    mock_task_result = MagicMock()
    mock_task_result.id = "mock-celery-task-id-12345"

    with patch("app.tasks.email_task.send_email_notification.apply_async", return_value=mock_task_result), \
         patch("app.tasks.sms_task.send_sms_notification.apply_async", return_value=mock_task_result), \
         patch("app.tasks.push_task.send_push_notification.apply_async", return_value=mock_task_result):
        with TestClient(app) as c:
            yield c

    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client):
    """Return Authorization headers for the admin user."""
    res = client.post(
        "/api/auth/token",
        data={"username": "admin", "password": "admin123"},
    )
    assert res.status_code == 200, f"Auth failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def sample_notification(client, auth_headers):
    """Create and return a sample email notification."""
    payload = {
        "title": "Test Notification",
        "message": "Hello from test suite",
        "channel": "email",
        "recipient": "test@example.com",
        "priority": "normal",
    }
    res = client.post("/api/notifications", json=payload, headers=auth_headers)
    assert res.status_code == 201
    return res.json()
