import ssl
from celery import Celery
from app.config import get_settings

settings = get_settings()


def _add_ssl_param(url: str) -> str:
    """Append ssl_cert_reqs=CERT_NONE to a rediss:// URL if not already present."""
    if "ssl_cert_reqs" in url:
        return url
    separator = "&" if "?" in url else "?"
    return f"{url}{separator}ssl_cert_reqs=CERT_NONE"


def make_celery() -> Celery:
    broker_url = settings.redis_url
    backend_url = settings.redis_url

    # Upstash / any rediss:// URL requires ssl_cert_reqs in the URL itself
    if broker_url.startswith("rediss://"):
        broker_url = _add_ssl_param(broker_url)
        backend_url = _add_ssl_param(backend_url)

    celery = Celery(
        "notification_worker",
        broker=broker_url,
        backend=backend_url,
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

    # Also set broker_use_ssl for the transport layer
    if settings.redis_url.startswith("rediss://"):
        ssl_opts = {"ssl_cert_reqs": ssl.CERT_NONE}
        conf["broker_use_ssl"] = ssl_opts
        conf["redis_backend_use_ssl"] = ssl_opts

    celery.conf.update(conf)
    return celery


celery_app = make_celery()
