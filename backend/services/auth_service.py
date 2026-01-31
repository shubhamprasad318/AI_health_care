"""
Authentication Service
File Path: services/auth_service.py
"""
import logging
from typing import Optional, Dict
from datetime import datetime, timedelta
import os

# ✅ NEW IMPORTS for Dependency Injection
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from database.connection import db
from utils.security import hash_password, verify_password

logger = logging.getLogger(__name__)

# ✅ JWT CONFIGURATION (Must match utils/security.py)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

# This tells FastAPI: "If a route needs a token, look in the Authorization: Bearer header"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_access_token(email: str) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": email,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


async def register_user(user_data: Dict) -> Dict:
    """Register a new user"""
    try:
        existing = await db.store.find_one({"email": user_data["email"]})
        if existing:
            return {"success": False, "message": "Email already registered"}
        
        user_data["password"] = hash_password(user_data["password"])
        user_data["created_at"] = datetime.utcnow()
        
        await db.store.insert_one(user_data)
        
        token = create_access_token(user_data["email"])
        
        logger.info(f"✅ User registered: {user_data['email']}")
        
        return {
            "success": True,
            "message": "Registration successful",
            "token": token,
            "user": user_data
        }
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return {"success": False, "message": "Registration failed"}


async def authenticate_user(email: str, password: str) -> Dict:
    """Authenticate user"""
    try:
        user = await db.store.find_one({"email": email})
        
        if not user:
            return {"success": False, "message": "Invalid credentials"}
        
        if not verify_password(password, user["password"]):
            return {"success": False, "message": "Invalid credentials"}
        
        token = create_access_token(email)
        
        logger.info(f"✅ User authenticated: {email}")
        
        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": user
        }
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        return {"success": False, "message": "Authentication failed"}


# ========================================================
# ✅ NEW: Add this function for the /status route
# This allows routes/auth.py to verify the token automatically
# ========================================================
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validates the JWT token from the Authorization header.
    Used by routes/auth.py for the check_auth_status endpoint.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db.store.find_one({"email": email})
    if user is None:
        raise credentials_exception

    # Return safe user data
    return {
        "email": user["email"],
        "name": user.get("name"),
        "first_name": user.get("first_name"),
        "last_name": user.get("last_name"),
        "age": user.get("age"),
        "gender": user.get("gender")
    }
