import logging
import random
import time
from celery import Task
from app.celery_app import celery_app
from app.config import get_settings
from app.events import log_notification_event

logger = logging.getLogger(__name__)
settings = get_settings()


class NotificationTask(Task):
    """Base task that updates notification status in DB."""

    _db = None

    @property
    def db(self):
        if self._db is None:
            from app.database import SessionLocal
            self._db = SessionLocal()
        return self._db

    def update_status(self, notification_id: str, status: str, error: str = None, retry_count: int = None):
        from app.models import Notification, NotificationEventTypeEnum, StatusEnum
        from sqlalchemy.orm import Session
        from app.database import SessionLocal

        db: Session = SessionLocal()
        try:
            notif = db.query(Notification).filter(Notification.id == notification_id).first()
            if notif:
                previous_status = notif.status
                notif.status = StatusEnum(status)
                if error is not None:
                    notif.error_message = error
                if retry_count is not None:
                    notif.retry_count = retry_count
                log_notification_event(
                    db,
                    notification_id=notification_id,
                    event_type=NotificationEventTypeEnum.status_changed,
                    previous_status=previous_status,
                    new_status=notif.status,
                    message=error,
                    metadata={"retry_count": notif.retry_count},
                )
                db.commit()
        finally:
            db.close()

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        notification_id = kwargs.get("notification_id") or (args[0] if args else None)
        if notification_id:
            self.update_status(notification_id, "failed", error=str(exc))
        logger.error("Task %s failed: %s", task_id, exc)


@celery_app.task(
    bind=True,
    base=NotificationTask,
    name="app.tasks.email_task.send_email_notification",
    max_retries=3,
    default_retry_delay=30,
    queue="email",
)
def send_email_notification(self, notification_id: str):
    """Send an email notification (mock or real via SMTP)."""
    self.update_status(notification_id, "processing")
    logger.info("[EMAIL] Processing notification %s", notification_id)

    try:
        # Simulate processing time
        time.sleep(random.uniform(0.5, 1.5))

        # Simulate 8% random failure for realism
        if random.random() < 0.08:
            raise RuntimeError("SMTP connection timeout (simulated)")

        if settings.smtp_host:
            # Real SMTP would go here
            logger.info("[EMAIL] Would send via SMTP to real recipient")
        else:
            logger.info("[EMAIL] Mock delivery successful for notification %s", notification_id)

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
        logger.warning("[EMAIL] Retrying notification %s (attempt %d): %s", notification_id, retry_count, exc)
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))
