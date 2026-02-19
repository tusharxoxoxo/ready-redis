from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from sqlalchemy import func

from app.auth import get_current_user
from app.database import get_db
from app.models import Notification, StatusEnum, ChannelEnum
from app.schemas import StatsResponse, ChannelStats

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    status_counts = (
        db.query(Notification.status, func.count(Notification.id))
        .group_by(Notification.status)
        .all()
    )
    channel_counts = (
        db.query(Notification.channel, func.count(Notification.id))
        .group_by(Notification.channel)
        .all()
    )

    sc = {s.value: c for s, c in status_counts}
    cc = {c.value: cnt for c, cnt in channel_counts}
    total = sum(sc.values())

    return StatsResponse(
        total=total,
        sent=sc.get("sent", 0),
        pending=sc.get("pending", 0),
        queued=sc.get("queued", 0),
        processing=sc.get("processing", 0),
        failed=sc.get("failed", 0),
        scheduled=sc.get("scheduled", 0),
        channels=ChannelStats(
            email=cc.get("email", 0),
            sms=cc.get("sms", 0),
            push=cc.get("push", 0),
        ),
    )
