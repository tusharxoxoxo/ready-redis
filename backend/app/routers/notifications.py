from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.events import log_notification_event
from app.models import (
    Notification,
    NotificationEvent,
    NotificationEventTypeEnum,
    StatusEnum,
    ChannelEnum,
)
from app.schemas import (
    NotificationCreate,
    NotificationResponse,
    NotificationListResponse,
    NotificationEventListResponse,
    NotificationEventResponse,
)
from app.tasks.email_task import send_email_notification
from app.tasks.sms_task import send_sms_notification
from app.tasks.push_task import send_push_notification

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

TASK_MAP = {
    ChannelEnum.email: send_email_notification,
    ChannelEnum.sms: send_sms_notification,
    ChannelEnum.push: send_push_notification,
}


def _enqueue(notification: Notification) -> str:
    task_fn = TASK_MAP[notification.channel]
    result = task_fn.apply_async(
        kwargs={"notification_id": str(notification.id)},
        priority={"low": 1, "normal": 5, "high": 7, "critical": 9}[notification.priority.value],
        eta=notification.scheduled_at,
    )
    return result.id


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notif = Notification(
        title=payload.title,
        message=payload.message,
        channel=payload.channel,
        recipient=payload.recipient,
        priority=payload.priority,
        scheduled_at=payload.scheduled_at,
        metadata_=payload.metadata or {},
        status=StatusEnum.scheduled if payload.scheduled_at else StatusEnum.queued,
    )
    db.add(notif)
    db.flush()  # get the ID
    log_notification_event(
        db,
        notification_id=str(notif.id),
        event_type=NotificationEventTypeEnum.created,
        new_status=notif.status,
        message="Notification created and queued for processing",
    )

    task_id = _enqueue(notif)
    notif.celery_task_id = task_id
    db.commit()
    db.refresh(notif)
    return NotificationResponse.from_orm_model(notif)


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    status: Optional[StatusEnum] = Query(None),
    channel: Optional[ChannelEnum] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Notification)
    if status:
        q = q.filter(Notification.status == status)
    if channel:
        q = q.filter(Notification.channel == channel)
    if search:
        q = q.filter(
            Notification.title.ilike(f"%{search}%")
            | Notification.recipient.ilike(f"%{search}%")
            | Notification.message.ilike(f"%{search}%")
        )
    total = q.count()
    items = q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return NotificationListResponse(
        total=total,
        items=[NotificationResponse.from_orm_model(n) for n in items],
    )


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return NotificationResponse.from_orm_model(notif)


@router.post("/{notification_id}/retry", response_model=NotificationResponse)
def retry_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notif.status not in [StatusEnum.failed, StatusEnum.cancelled]:
        raise HTTPException(
            status_code=400,
            detail=f"Can only retry failed or cancelled notifications (current: {notif.status.value})",
        )

    previous_status = notif.status
    notif.status = StatusEnum.queued
    notif.error_message = None
    db.flush()
    log_notification_event(
        db,
        notification_id=str(notif.id),
        event_type=NotificationEventTypeEnum.retry_requested,
        previous_status=previous_status,
        new_status=StatusEnum.queued,
        message="Manual retry requested",
    )
    task_id = _enqueue(notif)
    notif.celery_task_id = task_id
    db.commit()
    db.refresh(notif)
    return NotificationResponse.from_orm_model(notif)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()


@router.get("/{notification_id}/events", response_model=NotificationEventListResponse)
def list_notification_events(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    items = (
        db.query(NotificationEvent)
        .filter(NotificationEvent.notification_id == notification_id)
        .order_by(NotificationEvent.created_at.desc())
        .all()
    )
    return NotificationEventListResponse(
        items=[NotificationEventResponse.from_orm_model(i) for i in items]
    )
