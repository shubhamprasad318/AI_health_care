"""
Authentication Service
File Path: services/auth_service.py
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import os

# FastAPI & Security Imports
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

# App Imports
from database.connection import db
from utils.security import hash_password, verify_password

logger = logging.getLogger(__name__)

# ✅ CONFIGURATION
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ==========================================
# 🛠️ HELPER: Fix MongoDB Objects
# ==========================================
def serialize_user_data(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Converts MongoDB ObjectId and datetime objects to strings 
    so they don't crash the JSON response.
    Also removes the password hash for security.
    """
    if not user:
        return None
        
    # Create a copy so we don't modify the original db object
    user_clean = user.copy()
    
    # Convert _id to string (Fixes TypeError: Object of type ObjectId...)
    if "_id" in user_clean:
        user_clean["_id"] = str(user_clean["_id"])
        
    # Convert datetime to ISO string (Fixes TypeError: Object of type datetime...)
    if "created_at" in user_clean and isinstance(user_clean["created_at"], datetime):
        user_clean["created_at"] = user_clean["created_at"].isoformat()

    # Remove sensitive password data
    user_clean.pop("password", None)
    
    return user_clean


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
        
        # Insert user (MongoDB adds _id to user_data automatically here)
        new_user = await db.store.insert_one(user_data)
        
        # Explicitly ensure _id is handled if not added in-place
        if "_id" not in user_data:
             user_data["_id"] = new_user.inserted_id
        
        token = create_access_token(user_data["email"])
        
        logger.info(f"✅ User registered: {user_data['email']}")
        
        return {
            "success": True,
            "message": "Registration successful",
            "token": token,
            # ✅ FIX: Clean the data before returning
            "user": serialize_user_data(user_data)
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
            # ✅ FIX: Clean the data before returning
            "user": serialize_user_data(user)
        }
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        return {"success": False, "message": "Authentication failed"}


# ========================================================
# ✅ TOKEN VERIFICATION DEPENDENCY
# ========================================================
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validates the JWT token from the Authorization header.
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

    # ✅ FIX: Return clean data here too
    return serialize_user_data(user)
