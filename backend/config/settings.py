"""
Configuration and environment variables
"""

import os
import sys
import logging as _log
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Environment mode
ENV = os.environ.get("ENV", "development").lower()
IS_PRODUCTION = ENV in ("production", "prod")


def _fail_in_production(name: str, hint: str = "") -> None:
    if IS_PRODUCTION:
        msg = f"FATAL: {name} environment variable is required in production."
        if hint:
            msg += f" {hint}"
        print(msg, file=sys.stderr)
        sys.exit(1)
    _log.warning(f"{name} not set — using insecure default for development only.")


# MongoDB Configuration
MONGO_URI = os.environ.get("MONGO_URI", "")
if not MONGO_URI:
    _fail_in_production("MONGO_URI", "Set it to a MongoDB connection string.")
    MONGO_URI = "mongodb://localhost:27017/helloai"
MONGO_DBNAME = os.environ.get("MONGO_DBNAME", "helloai")

# Security — SECRET_KEY is MANDATORY in production
SECRET_KEY = os.environ.get("SECRET_KEY", "")
if not SECRET_KEY:
    if IS_PRODUCTION:
        print(
            "FATAL: SECRET_KEY environment variable is required in production. "
            'Set it to a strong random value (e.g., python -c "import secrets; print(secrets.token_hex(32))").',
            file=sys.stderr,
        )
        sys.exit(1)
    else:
        import secrets as _secrets

        SECRET_KEY = _secrets.token_hex(32)
        _log.warning(
            "SECRET_KEY not set — using random fallback (dev only). JWTs will be invalidated on restart."
        )

# Email Configuration
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")
if not ADMIN_EMAIL and IS_PRODUCTION:
    _log.warning("ADMIN_EMAIL not set — admin endpoints will be inaccessible.")
SMTP_EMAIL = os.environ.get("SMTP_EMAIL", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "AI Health Care Platform")
if (not SMTP_EMAIL or not SMTP_PASSWORD) and IS_PRODUCTION:
    _log.warning("SMTP credentials not fully set — outbound email will be disabled.")

# --- CORS CONFIGURATION FIX ---
# 1. Get the string from .env
_origins_str = os.getenv("ALLOWED_ORIGINS", "")

# 2. Split by comma and strip whitespace to create a clean list
# This prevents the "unpacking string" error
if _origins_str:
    allow_origin = [origin.strip() for origin in _origins_str.split(",")]
else:
    allow_origin = []
# ------------------------------

# Gemini API (2026 SDK)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not GEMINI_API_KEY and IS_PRODUCTION:
    _log.warning("GEMINI_API_KEY not set — AI features will be disabled in production.")

# LiveKit Configuration
LIVEKIT_URL = os.environ.get("LIVEKIT_URL", "")
LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.environ.get("LIVEKIT_API_SECRET", "")
if IS_PRODUCTION and not all([LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET]):
    _log.warning("LiveKit credentials not fully set — Virtual Doctor voice feature will be disabled.")

# File Upload Configuration
UPLOAD_FOLDER = Path("uploads")
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif", "doc", "docx", "txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

UPLOAD_FOLDER.mkdir(exist_ok=True)

# Logging Configuration
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOG_FILE = "app.log"

# Application Settings
APP_VERSION = "2.1.0"
APP_NAME = "AI Health Care Platform"
