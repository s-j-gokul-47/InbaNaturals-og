from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "InbaNaturals"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:toor@localhost/inbanaturals"

    # JWT
    SECRET_KEY: str = "inba-naturals-dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis (for token revocation / caching)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Search Engine (Meilisearch / Elasticsearch pluggable adapter)
    MEILISEARCH_URL: str = ""
    MEILISEARCH_KEY: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

    # SMTP Configuration (Supports Gmail, SendGrid, AWS SES, Mailgun, etc.)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "InbaNaturals"
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False

    # Frontend URL (for email links like registration verification)
    FRONTEND_URL: str = "http://localhost:5173"

    # File uploads
    UPLOAD_DIR: str = "uploads"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
