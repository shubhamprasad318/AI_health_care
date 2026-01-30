"""
Configuration and environment variables
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import secrets

load_dotenv()

# MongoDB Configuration
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/helloai")
MONGO_DBNAME = os.environ.get("MONGO_DBNAME", "helloai")

# Security
SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_hex(32))

# Email Configuration
# MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
# MAIL_PORT = int(os.environ.get('MAIL_PORT', 465))
# MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
# MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL')

# Gemini API (2026 SDK)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# File Upload Configuration
UPLOAD_FOLDER = Path("uploads")
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

UPLOAD_FOLDER.mkdir(exist_ok=True)

# Logging Configuration
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
LOG_FILE = 'app.log'

# Application Settings
APP_VERSION = "2.1.0"
APP_NAME = "AI Health Care Platform"
