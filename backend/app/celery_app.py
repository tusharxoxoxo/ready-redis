from celery import Celery
from app.config import get_settings

settings = get_settings()


def make_celery() -> Celery:
    celery = Celery(
        "notification_worker",
        broker=settings.redis_url,
        backend=settings.redis_url,
        include=[
            "app.tasks.email_task",
            "app.tasks.sms_task",
            "app.tasks.push_task",
        ],
    )
    celery.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
        task_routes={
            "app.tasks.email_task.*": {"queue": "email"},
            "app.tasks.sms_task.*": {"queue": "sms"},
            "app.tasks.push_task.*": {"queue": "push"},
        },
    )
    return celery


celery_app = make_celery()
