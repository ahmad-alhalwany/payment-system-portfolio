import os
import secrets
from typing import List

from dotenv import load_dotenv

load_dotenv()


def _parse_cors_origins() -> List[str]:
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


class Settings:
    environment: str = os.getenv("ENVIRONMENT", "development")
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@localhost:5433/paymentdb",
    )
    secret_key: str = os.getenv("SECRET_KEY") or (
        secrets.token_hex(32) if os.getenv("ENVIRONMENT") != "production" else ""
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
    cors_origins: List[str] = _parse_cors_origins()
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    login_rate_limit: str = os.getenv("LOGIN_RATE_LIMIT", "10/minute")
    auto_seed_demo: bool = os.getenv(
        "AUTO_SEED_DEMO",
        "true" if os.getenv("ENVIRONMENT", "development") != "production" else "false",
    ).lower() in ("1", "true", "yes")
    demo_mode: bool = os.getenv(
        "DEMO_MODE",
        "true" if os.getenv("ENVIRONMENT", "development") != "production" else "false",
    ).lower() in ("1", "true", "yes")

    def validate_production(self) -> None:
        if self.environment == "production" and not os.getenv("SECRET_KEY"):
            raise RuntimeError("SECRET_KEY is required when ENVIRONMENT=production")


settings = Settings()
settings.validate_production()
