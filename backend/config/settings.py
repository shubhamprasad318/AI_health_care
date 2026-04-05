"""
Configuration and environment variables
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Environment mode
ENV = os.environ.get("ENV", "development").lower()
IS_PRODUCTION = ENV in ("production", "prod")

# MongoDB Configuration
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/helloai")
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
        import logging as _log

        SECRET_KEY = _secrets.token_hex(32)
        _log.warning(
            "SECRET_KEY not set — using random fallback (dev only). JWTs will be invalidated on restart."
        )

# Email Configuration
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
SMTP_EMAIL = os.environ.get("SMTP_EMAIL", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "AI Health Care Platform")

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
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# LiveKit Configuration
LIVEKIT_URL = os.environ.get("LIVEKIT_URL", "")
LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.environ.get("LIVEKIT_API_SECRET", "")

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
