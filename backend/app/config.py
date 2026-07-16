from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://neondb_owner:npg_eDmwXu36PcoL@ep-soft-sun-azfoylwq-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?ssl=require"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://neondb_owner:npg_eDmwXu36PcoL@ep-soft-sun-azfoylwq-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    SECRET_KEY: str = "hrm-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 5242880
    ALLOWED_FILE_TYPES: list = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    CORS_ORIGINS: list = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
