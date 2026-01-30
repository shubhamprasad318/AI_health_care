"""
Security utilities: password hashing, authentication
"""
import bcrypt
from fastapi import HTTPException, Request
import logging
from typing import Optional
from database.connection import get_session

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    try:
        password_bytes = password.encode('utf-8')
        
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        
        hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
        return hashed.decode('utf-8')
        
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise HTTPException(status_code=500, detail="Error securing password")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using bcrypt"""
    try:
        password_bytes = plain_password.encode('utf-8')
        
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
            
        if isinstance(hashed_password, str):
            hashed_bytes = hashed_password.encode('utf-8')
        else:
            hashed_bytes = hashed_password
            
        return bcrypt.checkpw(password_bytes, hashed_bytes)
        
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


async def get_current_user(request: Request) -> Optional[str]:
    """Get current user from session token"""
    token = request.cookies.get("session_token")
    if token:
        return get_session(token)
    return None


async def require_auth(request: Request) -> str:
    """Require authentication"""
    email = await get_current_user(request)
    if not email:
        raise HTTPException(status_code=401, detail="Authentication required")
    return email
