"""
Centralized application configuration.

All environment variables are read here. Routers import from this module
instead of calling os.getenv() directly, keeping configuration in one place.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── AI ────────────────────────────────────────────────────────────
    GROQ_API_KEY: str   = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL:   str   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # ── Database ──────────────────────────────────────────────────────
    # Default: data/mentormind.db relative to the backend directory
    DB_PATH: str = os.getenv(
        "DB_PATH",
        str(Path(__file__).parent / "data" / "mentormind.db"),
    )

    # ── Server ────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173"
    ).split(",")

    # ── Timeouts ──────────────────────────────────────────────────────
    AI_TIMEOUT_SECONDS:       float = float(os.getenv("AI_TIMEOUT_SECONDS", "60"))
    URL_VALIDATE_TIMEOUT:     float = float(os.getenv("URL_VALIDATE_TIMEOUT", "4"))

    # ── Feature flags ─────────────────────────────────────────────────
    # Set to "false" in CI to skip live URL validation
    VALIDATE_RESOURCE_URLS: bool = os.getenv("VALIDATE_RESOURCE_URLS", "false").lower() == "true"

    # ── Application ───────────────────────────────────────────────────
    APP_VERSION: str = "1.0.0"
    APP_NAME:    str = "MentorMind AI"


settings = Settings()
