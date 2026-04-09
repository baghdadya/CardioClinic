from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    # Application
    APP_NAME: str = "CardioClinic"
    VERSION: str = "0.11.2"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://cardioclinic:cardioclinic@localhost:5432/cardioclinic"

    # JWT
    SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Email (SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "CardioClinic"
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_TLS: bool = True


settings = Settings()
