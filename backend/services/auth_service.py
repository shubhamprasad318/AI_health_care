"""
Authentication Service
"""
import logging
from typing import Optional, Dict
from datetime import datetime, timedelta
from database.connection import db
from utils.security import hash_password, verify_password
from jose import jwt
import os

logger = logging.getLogger(__name__)

# ✅ JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


def create_access_token(email: str) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": email,  # Subject (user identifier)
        "exp": expire,  # Expiration time
        "iat": datetime.utcnow()  # Issued at
    }
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


async def register_user(user_data: Dict) -> Dict:
    """Register a new user"""
    try:
        # Check if email exists
        existing = await db.store.find_one({"email": user_data["email"]})
        if existing:
            return {"success": False, "message": "Email already registered"}
        
        # Hash password
        user_data["password"] = hash_password(user_data["password"])
        user_data["created_at"] = datetime.utcnow()
        
        # Insert user
        await db.store.insert_one(user_data)
        
        # ✅ Create JWT token instead of session token
        token = create_access_token(user_data["email"])
        
        logger.info(f"✅ User registered: {user_data['email']}")
        
        return {
            "success": True,
            "message": "Registration successful",
            "token": token,
            "user": {
                "email": user_data["email"],
                "name": user_data.get("name"),
                "first_name": user_data.get("first_name"),
                "last_name": user_data.get("last_name"),
                "age": user_data.get("age"),
                "gender": user_data.get("gender")
            }
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
        
        # ✅ Create JWT token instead of session token
        token = create_access_token(email)
        
        logger.info(f"✅ User authenticated: {email}")
        
        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "email": user["email"],
                "name": user.get("name"),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "age": user.get("age"),
                "gender": user.get("gender")
            }
        }
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        return {"success": False, "message": "Authentication failed"}
