from typing import Any
from sqlalchemy.orm import Session

from app.models import NotificationEvent, NotificationEventTypeEnum, StatusEnum


def log_notification_event(
    db: Session,
    *,
    notification_id: str,
    event_type: NotificationEventTypeEnum,
    previous_status: StatusEnum | None = None,
    new_status: StatusEnum | None = None,
    message: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> NotificationEvent:
    event = NotificationEvent(
        notification_id=notification_id,
        event_type=event_type,
        previous_status=previous_status,
        new_status=new_status,
        message=message,
        metadata_=metadata or {},
    )
    db.add(event)
    return event
