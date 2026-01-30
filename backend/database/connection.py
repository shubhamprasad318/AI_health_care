"""
MongoDB database connection and session management
"""
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import MONGO_URI, MONGO_DBNAME
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
import secrets

logger = logging.getLogger(__name__)

# Database client
client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DBNAME]

# Session storage (in production, use Redis)
sessions: Dict[str, Dict] = {}


async def create_indexes():
    """Create MongoDB indexes"""
    try:
        await db.store.create_index("email", unique=True)
        await db.appointments.create_index("email")
        await db.appointments.create_index("date")
        await db.files.create_index("email")
        await db.predictions.create_index("email")
        await db.predictions.create_index("created_at")
        await db.chat_history.create_index("email")
        await db.health_plans.create_index("email")
        logger.info("✅ Database indexes created")
    except Exception as e:
        logger.warning(f"⚠️ Index creation warning: {e}")


def create_session_token(email: str) -> str:
    """Create a new session token for a user"""
    token = secrets.token_urlsafe(32)
    sessions[token] = {
        "email": email,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=7)
    }
    return token


def get_session(token: str) -> Optional[str]:
    """Get user email from session token"""
    if token in sessions:
        session_data = sessions[token]
        if datetime.utcnow() < session_data["expires_at"]:
            return session_data["email"]
        else:
            del sessions[token]
    return None


def delete_session(token: str) -> bool:
    """Delete a session"""
    if token in sessions:
        del sessions[token]
        return True
    return False


def close_connection():
    """Close database connection"""
    client.close()
