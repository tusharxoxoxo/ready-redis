import ssl
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

    # Base config
    conf: dict = dict(
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

    # Upstash / any rediss:// broker requires explicit SSL options
    if settings.redis_url.startswith("rediss://"):
        ssl_opts = {"ssl_cert_reqs": ssl.CERT_NONE}
        conf["broker_use_ssl"] = ssl_opts
        conf["redis_backend_use_ssl"] = ssl_opts

    celery.conf.update(conf)
    return celery


celery_app = make_celery()
