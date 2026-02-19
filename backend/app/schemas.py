from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models import ChannelEnum, StatusEnum, PriorityEnum


# ── Auth ──────────────────────────────────────────────────────────────────────


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# ── Notifications ─────────────────────────────────────────────────────────────


class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    channel: ChannelEnum
    recipient: str = Field(..., min_length=1, max_length=255)
    priority: PriorityEnum = PriorityEnum.normal
    scheduled_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = {}


class NotificationUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    error_message: Optional[str] = None
    celery_task_id: Optional[str] = None
    retry_count: Optional[int] = None


class NotificationResponse(BaseModel):
    id: UUID
    title: str
    message: str
    channel: ChannelEnum
    recipient: str
    status: StatusEnum
    priority: PriorityEnum
    scheduled_at: Optional[datetime]
    celery_task_id: Optional[str]
    retry_count: int
    error_message: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_model(cls, obj):
        return cls(
            id=obj.id,
            title=obj.title,
            message=obj.message,
            channel=obj.channel,
            recipient=obj.recipient,
            status=obj.status,
            priority=obj.priority,
            scheduled_at=obj.scheduled_at,
            celery_task_id=obj.celery_task_id,
            retry_count=obj.retry_count,
            error_message=obj.error_message,
            metadata=obj.metadata_,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )


class NotificationListResponse(BaseModel):
    total: int
    items: list[NotificationResponse]


# ── Stats ─────────────────────────────────────────────────────────────────────


class ChannelStats(BaseModel):
    email: int = 0
    sms: int = 0
    push: int = 0


class StatsResponse(BaseModel):
    total: int
    sent: int
    pending: int
    queued: int
    processing: int
    failed: int
    scheduled: int
    channels: ChannelStats
