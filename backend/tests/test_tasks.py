"""
Unit tests for Celery task functions.

These tests exercise the task logic directly (bypassing Celery broker)
by calling the underlying function via `.s()` with a mock request context.
"""
import pytest
from unittest.mock import MagicMock, patch, call
import uuid


def make_mock_task(task_fn):
    """
    Wrap a Celery task so we can call it with a fake `self.request`.
    Returns a bound mock that also tracks calls to `update_status`.
    """
    task = task_fn
    task.request_stack = []
    return task


class TestEmailTask:

    def test_successful_delivery(self):
        """Task calls update_status('sent') on success."""
        from app.tasks.email_task import send_email_notification

        nid = str(uuid.uuid4())
        with patch.object(send_email_notification, "update_status") as mock_status, \
             patch("app.tasks.email_task.random.random", return_value=0.99), \
             patch("app.tasks.email_task.time.sleep"):
            # Call the underlying function directly (not via Celery)
            send_email_notification.run(notification_id=nid)

        calls = [c.args for c in mock_status.call_args_list]
        statuses = [c[1] for c in calls]
        assert "processing" in statuses
        assert "sent" in statuses

    def test_simulated_failure_triggers_retry(self):
        """When random failure fires, task raises Retry exception."""
        from app.tasks.email_task import send_email_notification
        from celery.exceptions import Retry

        nid = str(uuid.uuid4())
        with patch.object(send_email_notification, "update_status"), \
             patch("app.tasks.email_task.random.random", return_value=0.0), \
             patch("app.tasks.email_task.time.sleep"), \
             patch.object(send_email_notification, "retry", side_effect=Retry()) as mock_retry:
            with pytest.raises(Retry):
                send_email_notification.run(notification_id=nid)
            mock_retry.assert_called_once()


class TestSmsTask:

    def test_successful_delivery(self):
        """SMS task calls update_status('sent') on success."""
        from app.tasks.sms_task import send_sms_notification

        nid = str(uuid.uuid4())
        with patch.object(send_sms_notification, "update_status") as mock_status, \
             patch("app.tasks.sms_task.random.random", return_value=0.99), \
             patch("app.tasks.sms_task.time.sleep"):
            send_sms_notification.run(notification_id=nid)

        statuses = [c.args[1] for c in mock_status.call_args_list]
        assert "sent" in statuses

    def test_simulated_failure_triggers_retry(self):
        """SMS task retries on failure."""
        from app.tasks.sms_task import send_sms_notification
        from celery.exceptions import Retry

        nid = str(uuid.uuid4())
        with patch.object(send_sms_notification, "update_status"), \
             patch("app.tasks.sms_task.random.random", return_value=0.0), \
             patch("app.tasks.sms_task.time.sleep"), \
             patch.object(send_sms_notification, "retry", side_effect=Retry()):
            with pytest.raises(Retry):
                send_sms_notification.run(notification_id=nid)


class TestPushTask:

    def test_successful_delivery(self):
        """Push task calls update_status('sent') on success."""
        from app.tasks.push_task import send_push_notification

        nid = str(uuid.uuid4())
        with patch.object(send_push_notification, "update_status") as mock_status, \
             patch("app.tasks.push_task.random.random", return_value=0.99), \
             patch("app.tasks.push_task.time.sleep"):
            send_push_notification.run(notification_id=nid)

        statuses = [c.args[1] for c in mock_status.call_args_list]
        assert "sent" in statuses

    def test_simulated_failure_triggers_retry(self):
        """Push task retries on failure."""
        from app.tasks.push_task import send_push_notification
        from celery.exceptions import Retry

        nid = str(uuid.uuid4())
        with patch.object(send_push_notification, "update_status"), \
             patch("app.tasks.push_task.random.random", return_value=0.0), \
             patch("app.tasks.push_task.time.sleep"), \
             patch.object(send_push_notification, "retry", side_effect=Retry()):
            with pytest.raises(Retry):
                send_push_notification.run(notification_id=nid)
