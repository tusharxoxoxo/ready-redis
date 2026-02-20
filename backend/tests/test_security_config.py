import pytest

from app.config import Settings


class TestSecurityConfig:
    def test_dev_allows_default_secret(self):
        settings = Settings(app_env="development")
        assert settings.should_seed_default_admin is True

    def test_production_rejects_default_secret(self):
        with pytest.raises(ValueError, match="SECRET_KEY must be set"):
            Settings(app_env="production", secret_key="supersecretkey-change-in-production")

    def test_production_rejects_short_secret(self):
        with pytest.raises(ValueError, match="SECRET_KEY must be set"):
            Settings(app_env="production", secret_key="short-secret")

    def test_production_disables_default_admin_seed_by_default(self):
        settings = Settings(
            app_env="production",
            secret_key="this-is-a-very-strong-production-secret-key-123456",
        )
        assert settings.should_seed_default_admin is False

    def test_production_rejects_default_admin_credentials_when_seeding(self):
        with pytest.raises(ValueError, match="Default admin credentials must be changed"):
            Settings(
                app_env="production",
                secret_key="this-is-a-very-strong-production-secret-key-123456",
                seed_default_admin=True,
                default_admin_username="admin",
                default_admin_password="admin123",
            )

    def test_production_allows_custom_admin_credentials_when_seeding(self):
        settings = Settings(
            app_env="production",
            secret_key="this-is-a-very-strong-production-secret-key-123456",
            seed_default_admin=True,
            default_admin_username="platform-admin",
            default_admin_password="UltraStrongAdminPassw0rd!",
        )
        assert settings.should_seed_default_admin is True

    def test_rejects_blank_database_url(self):
        with pytest.raises(ValueError, match="DATABASE_URL is empty"):
            Settings(database_url="   ")

    def test_rejects_invalid_database_url(self):
        with pytest.raises(ValueError, match="DATABASE_URL is invalid"):
            Settings(database_url="ghcr.io/railwayapp-templates/postgres-ssl:17")
