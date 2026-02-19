import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, DateTime, Integer, Enum as SAEnum,
    JSON, Boolean
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class ChannelEnum(str, enum.Enum):
    email = "email"
    sms = "sms"
    push = "push"


class StatusEnum(str, enum.Enum):
    pending = "pending"
    queued = "queued"
    processing = "processing"
    sent = "sent"
    failed = "failed"
    scheduled = "scheduled"
    cancelled = "cancelled"


class PriorityEnum(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    critical = "critical"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(SAEnum(ChannelEnum), nullable=False)
    recipient = Column(String(255), nullable=False)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.pending, nullable=False)
    priority = Column(SAEnum(PriorityEnum), default=PriorityEnum.normal, nullable=False)

    # Optional scheduling
    scheduled_at = Column(DateTime(timezone=True), nullable=True)

    # Celery tracking
    celery_task_id = Column(String(255), nullable=True)
    retry_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)

    # Arbitrary extra data for the notification
    metadata_ = Column("metadata", JSON, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
