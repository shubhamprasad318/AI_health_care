"""
Profile Management Routes
"""
from fastapi import APIRouter, HTTPException, Request
from database.models import ProfileUpdate, StandardResponse
from database.connection import db
from utils.security import require_auth
from utils.helpers import standard_response
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("")
async def get_profile(request: Request):
    """Get user profile"""
    try:
        email = await require_auth(request)
        
        # Get user from database
        user = await db.store.find_one({"email": email})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove sensitive data
        user.pop("password", None)
        user.pop("_id", None)
        
        return standard_response(
            message="Profile retrieved successfully",
            data=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get profile")


@router.patch("/update")
async def update_profile(request: Request, profile: ProfileUpdate):
    """Update user profile"""
    try:
        email = await require_auth(request)
        
        # Build update data (only non-None fields)
        update_data = {k: v for k, v in profile.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        # Add updated timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Update user
        result = await db.store.update_one(
            {"email": email},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get updated user
        updated_user = await db.store.find_one({"email": email})
        updated_user.pop("password", None)
        updated_user.pop("_id", None)
        
        return standard_response(
            message="Profile updated successfully",
            data=updated_user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")
