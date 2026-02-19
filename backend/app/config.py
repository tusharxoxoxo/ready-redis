from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://notify:secret@postgres:5432/notifydb"
    redis_url: str = "redis://redis:6379/0"
    secret_key: str = "supersecretkey-change-in-production"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    # Provider credentials (optional – blank = mock mode)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    fcm_server_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
