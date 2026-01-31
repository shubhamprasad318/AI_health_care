"""
Security utilities: password hashing, authentication
"""
import bcrypt
from fastapi import HTTPException, Request
import logging
from typing import Optional
from database.connection import get_session
from jose import jwt, JWTError
import os

logger = logging.getLogger(__name__)

# ✅ ADD JWT CONFIGURATION
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"


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
    """
    Get current user from JWT token (Authorization header or cookie)
    Returns email if authenticated, None otherwise
    """
    # ✅ FIX: Check Authorization header first (Bearer token)
    auth_header = request.headers.get("Authorization")
    token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        logger.info(f"🔑 Token from Authorization header: {token[:20]}...")
    else:
        # Fallback to cookie
        token = request.cookies.get("session_token")
        if token:
            logger.info(f"🍪 Token from cookie: {token[:20]}...")
    
    if not token:
        logger.warning("❌ No token found in Authorization header or cookies")
        return None
    
    try:
        # ✅ FIX: Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        
        if not email:
            logger.error("❌ No 'sub' (email) in token payload")
            return None
        
        logger.info(f"✅ Token validated for user: {email}")
        return email
        
    except JWTError as e:
        logger.error(f"❌ JWT validation error: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Token validation error: {e}")
        return None


async def require_auth(request: Request) -> str:
    """
    Require authentication (JWT token validation)
    Raises 401 if not authenticated
    Returns email if valid
    """
    email = await get_current_user(request)
    
    if not email:
        logger.warning("❌ Authentication required but no valid token found")
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. Please login."
        )
    
    return email
