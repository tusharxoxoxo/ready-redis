"""
Tests for the retry endpoint and retry-related business logic.
"""
import pytest
from unittest.mock import patch, MagicMock


class TestRetryNotification:

    def _force_status(self, db, notification_id: str, status: str):
        """Helper: directly update a notification's status in the DB."""
        from app.models import Notification, StatusEnum
        import uuid
        notif = db.query(Notification).filter(Notification.id == uuid.UUID(notification_id)).first()
        notif.status = StatusEnum(status)
        db.commit()

    def test_retry_failed_notification(self, client, auth_headers, sample_notification, db):
        """Retrying a failed notification resets status to 'queued'."""
        nid = sample_notification["id"]
        self._force_status(db, nid, "failed")

        res = client.post(f"/api/notifications/{nid}/retry", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "queued"

    def test_retry_cancelled_notification(self, client, auth_headers, sample_notification, db):
        """Retrying a cancelled notification re-queues it."""
        nid = sample_notification["id"]
        self._force_status(db, nid, "cancelled")

        res = client.post(f"/api/notifications/{nid}/retry", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "queued"

    def test_retry_clears_error_message(self, client, auth_headers, sample_notification, db):
        """Error message is cleared when notification is re-queued."""
        import uuid
        from app.models import Notification, StatusEnum

        nid = sample_notification["id"]
        notif = db.query(Notification).filter(Notification.id == uuid.UUID(nid)).first()
        notif.status = StatusEnum("failed")
        notif.error_message = "SMTP timeout"
        db.commit()

        res = client.post(f"/api/notifications/{nid}/retry", headers=auth_headers)
        assert res.status_code == 200
        # error_message should be null after retry
        assert res.json()["error_message"] is None

    def test_retry_sent_notification_returns_400(self, client, auth_headers, sample_notification, db):
        """Cannot retry a notification that was already sent."""
        nid = sample_notification["id"]
        self._force_status(db, nid, "sent")

        res = client.post(f"/api/notifications/{nid}/retry", headers=auth_headers)
        assert res.status_code == 400
        assert "failed or cancelled" in res.json()["detail"]

    def test_retry_queued_notification_returns_400(self, client, auth_headers, sample_notification):
        """Cannot retry a notification already in 'queued' state."""
        nid = sample_notification["id"]
        res = client.post(f"/api/notifications/{nid}/retry", headers=auth_headers)
        assert res.status_code == 400

    def test_retry_nonexistent_returns_404(self, client, auth_headers):
        """Retry on non-existent ID returns 404."""
        res = client.post(
            "/api/notifications/00000000-0000-0000-0000-000000000000/retry",
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_retry_assigns_new_celery_task_id(self, client, auth_headers, sample_notification, db):
        """Retry call triggers apply_async and assigns a (mock) task ID."""
        nid = sample_notification["id"]
        self._force_status(db, nid, "failed")

        new_mock = MagicMock()
        new_mock.id = "new-celery-task-id-99999"

        with patch("app.tasks.email_task.send_email_notification.apply_async", return_value=new_mock):
            res = client.post(f"/api/notifications/{nid}/retry", headers=auth_headers)

        assert res.status_code == 200
        assert res.json()["celery_task_id"] == "new-celery-task-id-99999"
