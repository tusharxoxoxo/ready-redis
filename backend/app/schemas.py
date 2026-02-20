from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
import re
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models import (
    ChannelEnum,
    StatusEnum,
    PriorityEnum,
    NotificationEventTypeEnum,
)


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

    @model_validator(mode="after")
    def validate_channel_specific_fields(self):
        if self.channel == ChannelEnum.email:
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", self.recipient):
                raise ValueError("Email recipient must be a valid email address")
        elif self.channel == ChannelEnum.sms:
            # Basic E.164 format check
            if not self.recipient.startswith("+") or not self.recipient[1:].isdigit():
                raise ValueError("SMS recipient must be in E.164 format, e.g. +12025550100")
            if len(self.recipient) < 8 or len(self.recipient) > 16:
                raise ValueError("SMS recipient must be in E.164 format, e.g. +12025550100")
        elif self.channel == ChannelEnum.push:
            if len(self.recipient.strip()) < 8:
                raise ValueError("Push recipient must be a valid device token or user identifier")

        if self.scheduled_at is not None:
            now = datetime.now(self.scheduled_at.tzinfo)
            if self.scheduled_at <= now:
                raise ValueError("scheduled_at must be in the future")

        return self


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


class NotificationEventResponse(BaseModel):
    id: UUID
    notification_id: UUID
    event_type: NotificationEventTypeEnum
    previous_status: Optional[StatusEnum]
    new_status: Optional[StatusEnum]
    message: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime

    @classmethod
    def from_orm_model(cls, obj):
        return cls(
            id=obj.id,
            notification_id=obj.notification_id,
            event_type=obj.event_type,
            previous_status=obj.previous_status,
            new_status=obj.new_status,
            message=obj.message,
            metadata=obj.metadata_,
            created_at=obj.created_at,
        )


class NotificationEventListResponse(BaseModel):
    items: list[NotificationEventResponse]
