"""Tests for JWT authentication endpoints."""
import pytest


class TestAuth:

    def test_login_success(self, client):
        """Valid credentials return a JWT token."""
        res = client.post(
            "/api/auth/token",
            data={"username": "admin", "password": "admin123"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 20

    def test_login_wrong_password(self, client):
        """Wrong password returns 401."""
        res = client.post(
            "/api/auth/token",
            data={"username": "admin", "password": "wrongpassword"},
        )
        assert res.status_code == 401
        assert "detail" in res.json()

    def test_login_unknown_user(self, client):
        """Unknown username returns 401."""
        res = client.post(
            "/api/auth/token",
            data={"username": "nobody", "password": "x"},
        )
        assert res.status_code == 401

    def test_protected_route_without_token(self, client):
        """Accessing a protected endpoint without token returns 401."""
        res = client.get("/api/notifications")
        assert res.status_code == 401

    def test_protected_route_with_invalid_token(self, client):
        """Garbage token returns 401."""
        res = client.get(
            "/api/notifications",
            headers={"Authorization": "Bearer this.is.garbage"},
        )
        assert res.status_code == 401

    def test_health_endpoint_no_auth(self, client):
        """Health check is publicly accessible."""
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
