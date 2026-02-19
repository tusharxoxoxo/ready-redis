"""Tests for the /api/stats aggregation endpoint."""
import pytest


class TestStats:

    def test_stats_empty(self, client, auth_headers):
        """Stats with no notifications returns zero counts."""
        res = client.get("/api/stats", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 0
        assert data["sent"] == 0
        assert data["failed"] == 0
        assert data["queued"] == 0
        assert data["pending"] == 0
        assert data["scheduled"] == 0
        assert "channels" in data

    def test_stats_counts_after_create(self, client, auth_headers):
        """Creating notifications increments total and queued counts."""
        for i in range(3):
            client.post(
                "/api/notifications",
                json={
                    "title": f"Stat test {i}",
                    "message": "Testing stats",
                    "channel": "email",
                    "recipient": f"stat{i}@example.com",
                },
                headers=auth_headers,
            )
        res = client.get("/api/stats", headers=auth_headers)
        data = res.json()
        assert data["total"] >= 3
        assert data["queued"] >= 3

    def test_stats_channel_breakdown(self, client, auth_headers):
        """Stats correctly breaks down counts by channel."""
        channels = [
            ("email", "a@a.com"),
            ("sms", "+10000000001"),
            ("push", "device-xyz"),
        ]
        for ch, recipient in channels:
            client.post(
                "/api/notifications",
                json={
                    "title": f"Chan test {ch}",
                    "message": "msg",
                    "channel": ch,
                    "recipient": recipient,
                },
                headers=auth_headers,
            )

        res = client.get("/api/stats", headers=auth_headers)
        data = res.json()
        assert data["channels"]["email"] >= 1
        assert data["channels"]["sms"] >= 1
        assert data["channels"]["push"] >= 1

    def test_stats_after_status_change(self, client, auth_headers, sample_notification, db):
        """Stats reflect actual status counts in DB."""
        import uuid
        from app.models import Notification, StatusEnum

        nid = uuid.UUID(sample_notification["id"])
        notif = db.query(Notification).filter(Notification.id == nid).first()
        notif.status = StatusEnum("sent")
        db.commit()

        res = client.get("/api/stats", headers=auth_headers)
        data = res.json()
        assert data["sent"] >= 1

    def test_stats_requires_auth(self, client):
        """Stats endpoint requires JWT auth."""
        res = client.get("/api/stats")
        assert res.status_code == 401
