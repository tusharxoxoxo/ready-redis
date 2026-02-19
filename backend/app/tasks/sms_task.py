import logging
import random
import time
from app.celery_app import celery_app
from app.tasks.email_task import NotificationTask
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@celery_app.task(
    bind=True,
    base=NotificationTask,
    name="app.tasks.sms_task.send_sms_notification",
    max_retries=3,
    default_retry_delay=30,
    queue="sms",
)
def send_sms_notification(self, notification_id: str):
    """Send an SMS notification (mock or real via Twilio)."""
    self.update_status(notification_id, "processing")
    logger.info("[SMS] Processing notification %s", notification_id)

    try:
        time.sleep(random.uniform(0.3, 1.0))

        if random.random() < 0.08:
            raise RuntimeError("SMS gateway timeout (simulated)")

        if settings.twilio_account_sid:
            logger.info("[SMS] Would send via Twilio")
        else:
            logger.info("[SMS] Mock delivery successful for notification %s", notification_id)

        self.update_status(notification_id, "sent")
        return {"status": "sent", "notification_id": notification_id}

    except Exception as exc:
        retry_count = self.request.retries + 1
        self.update_status(
            notification_id,
            "failed" if retry_count > self.max_retries else "queued",
            error=str(exc),
            retry_count=retry_count,
        )
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))
