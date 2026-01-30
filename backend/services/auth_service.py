"""
Authentication Service
"""
import logging
from typing import Optional, Dict
from datetime import datetime
from database.connection import db, create_session_token
from utils.security import hash_password, verify_password

logger = logging.getLogger(__name__)


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
        
        # Create session
        token = create_session_token(user_data["email"])
        
        logger.info(f"✅ User registered: {user_data['email']}")
        
        return {
            "success": True,
            "message": "Registration successful",
            "token": token,
            "user": {
                "email": user_data["email"],
                "name": user_data.get("name")
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
        
        # Create session
        token = create_session_token(email)
        
        logger.info(f"✅ User authenticated: {email}")
        
        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "email": user["email"],
                "name": user.get("name"),
                "age": user.get("age"),
                "gender": user.get("gender")
            }
        }
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        return {"success": False, "message": "Authentication failed"}
