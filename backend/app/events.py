import uuid
from typing import Any
from sqlalchemy.orm import Session

from app.models import NotificationEvent, NotificationEventTypeEnum, StatusEnum


def log_notification_event(
    db: Session,
    *,
    notification_id: str | uuid.UUID,
    event_type: NotificationEventTypeEnum,
    previous_status: StatusEnum | None = None,
    new_status: StatusEnum | None = None,
    message: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> NotificationEvent:
    normalized_notification_id = (
        uuid.UUID(notification_id) if isinstance(notification_id, str) else notification_id
    )
    event = NotificationEvent(
        notification_id=normalized_notification_id,
        event_type=event_type,
        previous_status=previous_status,
        new_status=new_status,
        message=message,
        metadata_=metadata or {},
    )
    db.add(event)
    return event
