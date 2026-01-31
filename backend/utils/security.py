"""
Security utilities: password hashing, authentication
File Path: utils/security.py
"""
import bcrypt
from fastapi import HTTPException, Request
import logging
from typing import Optional
from jose import jwt, JWTError
import os

logger = logging.getLogger(__name__)

# ✅ CONFIGURATION (Must match services/auth_service.py)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
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
    Manual token check for non-route functions (Middleware/Uploads).
    Checks Authorization header first, then cookies.
    Returns: Email string or None
    """
    # 1. Check Authorization Header (Standard)
    auth_header = request.headers.get("Authorization")
    token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
    else:
        # 2. Check Cookie (Fallback)
        token = request.cookies.get("session_token")
    
    if not token:
        return None
    
    try:
        # ✅ Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        return email
    except JWTError:
        return None
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        return None

async def require_auth(request: Request) -> str:
    """
    Enforce authentication manually. Raises 401 if failed.
    """
    email = await get_current_user(request)
    
    if not email:
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. Please login.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return email
