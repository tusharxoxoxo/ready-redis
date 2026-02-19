"""
Tests for notification CRUD operations.

Celery `.apply_async` is mocked in conftest.py so no Redis is needed.
"""
import pytest
from datetime import datetime, timedelta, timezone


class TestCreateNotification:

    def test_create_email_notification(self, client, auth_headers):
        """Creating an email notification returns 201 with correct fields."""
        payload = {
            "title": "Welcome Email",
            "message": "Thank you for signing up!",
            "channel": "email",
            "recipient": "welcome@example.com",
            "priority": "high",
        }
        res = client.post("/api/notifications", json=payload, headers=auth_headers)
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "Welcome Email"
        assert data["channel"] == "email"
        assert data["status"] == "queued"
        assert data["recipient"] == "welcome@example.com"
        assert data["priority"] == "high"
        assert data["celery_task_id"] == "mock-celery-task-id-12345"
        assert "id" in data

    def test_create_sms_notification(self, client, auth_headers):
        """SMS channel notification is created correctly."""
        payload = {
            "title": "OTP Code",
            "message": "Your code is 123456",
            "channel": "sms",
            "recipient": "+12025550100",
            "priority": "critical",
        }
        res = client.post("/api/notifications", json=payload, headers=auth_headers)
        assert res.status_code == 201
        assert res.json()["channel"] == "sms"

    def test_create_push_notification(self, client, auth_headers):
        """Push channel notification is created correctly."""
        payload = {
            "title": "New Message",
            "message": "You have 3 new messages",
            "channel": "push",
            "recipient": "device-token-abc123",
            "priority": "normal",
        }
        res = client.post("/api/notifications", json=payload, headers=auth_headers)
        assert res.status_code == 201
        assert res.json()["channel"] == "push"

    def test_create_scheduled_notification(self, client, auth_headers):
        """Scheduled notifications get status 'scheduled'."""
        future = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        payload = {
            "title": "Reminder",
            "message": "Don't forget your appointment",
            "channel": "email",
            "recipient": "remind@example.com",
            "priority": "normal",
            "scheduled_at": future,
        }
        res = client.post("/api/notifications", json=payload, headers=auth_headers)
        assert res.status_code == 201
        assert res.json()["status"] == "scheduled"

    def test_create_with_metadata(self, client, auth_headers):
        """Custom metadata is stored and returned."""
        payload = {
            "title": "Order Shipped",
            "message": "Your order #999 has shipped.",
            "channel": "email",
            "recipient": "order@example.com",
            "priority": "normal",
            "metadata": {"order_id": 999, "tracking": "TRACK123"},
        }
        res = client.post("/api/notifications", json=payload, headers=auth_headers)
        assert res.status_code == 201
        assert res.json()["metadata"]["order_id"] == 999

    def test_create_missing_title_returns_422(self, client, auth_headers):
        """Omitting required 'title' field returns 422 Unprocessable Entity."""
        payload = {
            "message": "No title here",
            "channel": "email",
            "recipient": "x@x.com",
        }
        res = client.post("/api/notifications", json=payload, headers=auth_headers)
        assert res.status_code == 422

    def test_create_invalid_channel_returns_422(self, client, auth_headers):
        """Invalid channel value returns 422."""
        payload = {
            "title": "Hi",
            "message": "Hello",
            "channel": "telegram",   # not a valid channel
            "recipient": "x@x.com",
        }
        res = client.post("/api/notifications", json=payload, headers=auth_headers)
        assert res.status_code == 422

    def test_create_requires_auth(self, client):
        """Creating without auth token returns 401."""
        payload = {"title": "t", "message": "m", "channel": "email", "recipient": "x@x.com"}
        res = client.post("/api/notifications", json=payload)
        assert res.status_code == 401


class TestListNotifications:

    def test_list_returns_all(self, client, auth_headers, sample_notification):
        """List endpoint returns at least the sample notification."""
        res = client.get("/api/notifications", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1

    def test_list_filter_by_channel(self, client, auth_headers, sample_notification):
        """Filtering by channel:email returns only email notifications."""
        res = client.get("/api/notifications?channel=email", headers=auth_headers)
        assert res.status_code == 200
        for item in res.json()["items"]:
            assert item["channel"] == "email"

    def test_list_filter_by_status(self, client, auth_headers, sample_notification):
        """Filtering by status:queued returns only queued notifications."""
        res = client.get("/api/notifications?status=queued", headers=auth_headers)
        assert res.status_code == 200
        for item in res.json()["items"]:
            assert item["status"] == "queued"

    def test_list_search_by_title(self, client, auth_headers, sample_notification):
        """Search parameter finds matching notifications."""
        res = client.get("/api/notifications?search=Test", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1
        assert any("Test" in item["title"] for item in data["items"])

    def test_list_search_no_match(self, client, auth_headers, sample_notification):
        """Search with no matches returns empty list."""
        res = client.get("/api/notifications?search=ZZZ_NO_MATCH_XYZ", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["total"] == 0

    def test_list_ordered_newest_first(self, client, auth_headers):
        """Notifications are ordered by created_at descending."""
        for i in range(3):
            client.post(
                "/api/notifications",
                json={
                    "title": f"Notification {i}",
                    "message": "msg",
                    "channel": "email",
                    "recipient": f"user{i}@example.com",
                },
                headers=auth_headers,
            )
        res = client.get("/api/notifications", headers=auth_headers)
        items = res.json()["items"]
        if len(items) >= 2:
            # Newest should be first
            assert items[0]["created_at"] >= items[-1]["created_at"]


class TestGetNotification:

    def test_get_existing_notification(self, client, auth_headers, sample_notification):
        """Detail endpoint returns the correct notification."""
        nid = sample_notification["id"]
        res = client.get(f"/api/notifications/{nid}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["id"] == nid

    def test_get_nonexistent_returns_404(self, client, auth_headers):
        """Non-existent UUID returns 404."""
        res = client.get(
            "/api/notifications/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert res.status_code == 404


class TestDeleteNotification:

    def test_delete_notification(self, client, auth_headers, sample_notification):
        """Deleting a notification returns 204 and it's gone."""
        nid = sample_notification["id"]
        res = client.delete(f"/api/notifications/{nid}", headers=auth_headers)
        assert res.status_code == 204

        # Confirm it's gone
        res2 = client.get(f"/api/notifications/{nid}", headers=auth_headers)
        assert res2.status_code == 404

    def test_delete_nonexistent_returns_404(self, client, auth_headers):
        """Deleting a non-existent notification returns 404."""
        res = client.delete(
            "/api/notifications/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert res.status_code == 404
