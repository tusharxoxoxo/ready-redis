from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pydantic import model_validator
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql://notify:secret@postgres:5432/notifydb"
    redis_url: str = "redis://redis:6379/0"
    secret_key: str = "supersecretkey-change-in-production"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"
    cors_allow_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    seed_default_admin: bool | None = None
    default_admin_username: str = "admin"
    default_admin_password: str = "admin123"

    # Provider credentials (optional – blank = mock mode)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    fcm_server_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def is_production_like(self) -> bool:
        return self.app_env.lower() in {"production", "staging"}

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_allow_origins.split(",")
            if origin.strip()
        ]

    @property
    def should_seed_default_admin(self) -> bool:
        if self.seed_default_admin is not None:
            return self.seed_default_admin
        return self.app_env.lower() in {
            "development",
            "dev",
            "local",
            "test",
            "testing",
        }

    @model_validator(mode="after")
    def validate_security_defaults(self):
        database_url = self.database_url.strip()
        if not database_url:
            raise ValueError(
                "DATABASE_URL is empty. Set DATABASE_URL to your Postgres connection string "
                "(on Railway, use a variable reference to your Postgres service DATABASE_URL, "
                "not a Docker image name)."
            )
        try:
            make_url(database_url)
        except ArgumentError as exc:
            raise ValueError(
                "DATABASE_URL is invalid. Expected a SQLAlchemy database URL like "
                "'postgresql://user:pass@host:5432/dbname'. On Railway, point DATABASE_URL "
                "to your Postgres service DATABASE_URL variable."
            ) from exc

        if self.is_production_like:
            default_secret = "supersecretkey-change-in-production"
            if self.secret_key == default_secret or len(self.secret_key) < 32:
                raise ValueError(
                    "SECRET_KEY must be set to a strong value (>=32 chars and not the default) in production/staging."
                )
            if self.should_seed_default_admin:
                if (
                    self.default_admin_username == "admin"
                    and self.default_admin_password == "admin123"
                ):
                    raise ValueError(
                        "Default admin credentials must be changed before enabling default admin seeding in production/staging."
                    )
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
