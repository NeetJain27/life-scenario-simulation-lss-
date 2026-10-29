import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY", "")
    DATABASE_PATH = os.getenv(
        "DATABASE_PATH",
        str(Path(__file__).resolve().parents[1] / "memory" / "memory.db"),
    )
    FRONTEND_ORIGINS = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:5173,http://localhost:5174")).split(",") if origin.strip()]
    COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

    def validate(self):
        if len(self.SECRET_KEY) < 32:
            raise RuntimeError(
                "SECRET_KEY must be set to a random value of at least 32 characters. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )


settings = Settings()
