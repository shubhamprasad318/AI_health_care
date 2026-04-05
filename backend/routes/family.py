"""
Family / Dependent Profiles Routes
Manage health profiles for family members under one account
"""

from fastapi import APIRouter, HTTPException, Request
from database.connection import db
from database.models import FamilyProfileCreate, FamilyProfileUpdate
from utils.security import require_auth
from utils.helpers import standard_response, serialize_doc
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/family", tags=["Family Profiles"])


@router.post("")
async def create_family_profile(profile: FamilyProfileCreate, request: Request):
    """Create a new family member profile"""
    try:
        email = await require_auth(request)

        # Limit family profiles per account
        count = await db.family_profiles.count_documents({"owner_email": email})
        if count >= 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 family profiles allowed per account",
            )

        doc = {
            "owner_email": email,
            "name": profile.name,
            "relationship": profile.relationship,
            "age": profile.age,
            "gender": profile.gender,
            "blood_type": profile.blood_type,
            "allergies": profile.allergies or [],
            "conditions": profile.conditions or [],
            "medications": profile.medications or [],
            "notes": profile.notes,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = await db.family_profiles.insert_one(doc)
        doc["_id"] = str(result.inserted_id)

        return standard_response(True, "Family profile created", {"profile": doc})

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating family profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to create family profile")


@router.get("")
async def get_family_profiles(request: Request):
    """Get all family profiles for the current user"""
    try:
        email = await require_auth(request)

        cursor = db.family_profiles.find({"owner_email": email}).sort("created_at", -1)
        profiles = []
        async for doc in cursor:
            profiles.append(serialize_doc(doc))

        return standard_response(
            True,
            f"Found {len(profiles)} family profiles",
            {"profiles": profiles, "count": len(profiles)},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching family profiles: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch family profiles")


@router.get("/{profile_id}")
async def get_family_profile(profile_id: str, request: Request):
    """Get a specific family profile"""
    try:
        email = await require_auth(request)

        if not ObjectId.is_valid(profile_id):
            raise HTTPException(status_code=400, detail="Invalid profile ID")

        doc = await db.family_profiles.find_one(
            {"_id": ObjectId(profile_id), "owner_email": email}
        )
        if not doc:
            raise HTTPException(status_code=404, detail="Family profile not found")

        return standard_response(True, "Profile found", {"profile": serialize_doc(doc)})

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching family profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch family profile")


@router.patch("/{profile_id}")
async def update_family_profile(
    profile_id: str, update: FamilyProfileUpdate, request: Request
):
    """Update a family profile"""
    try:
        email = await require_auth(request)

        if not ObjectId.is_valid(profile_id):
            raise HTTPException(status_code=400, detail="Invalid profile ID")

        update_data = {k: v for k, v in update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_data["updated_at"] = datetime.utcnow().isoformat()

        result = await db.family_profiles.update_one(
            {"_id": ObjectId(profile_id), "owner_email": email},
            {"$set": update_data},
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Family profile not found")

        updated = await db.family_profiles.find_one({"_id": ObjectId(profile_id)})

        return standard_response(
            True, "Profile updated", {"profile": serialize_doc(updated)}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating family profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update family profile")


@router.delete("/{profile_id}")
async def delete_family_profile(profile_id: str, request: Request):
    """Delete a family profile"""
    try:
        email = await require_auth(request)

        if not ObjectId.is_valid(profile_id):
            raise HTTPException(status_code=400, detail="Invalid profile ID")

        result = await db.family_profiles.delete_one(
            {"_id": ObjectId(profile_id), "owner_email": email}
        )

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Family profile not found")

        return standard_response(True, "Family profile deleted")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting family profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete family profile")


@router.get("/{profile_id}/summary")
async def get_family_profile_summary(profile_id: str, request: Request):
    """Get a health summary for a family member"""
    try:
        email = await require_auth(request)

        if not ObjectId.is_valid(profile_id):
            raise HTTPException(status_code=400, detail="Invalid profile ID")

        doc = await db.family_profiles.find_one(
            {"_id": ObjectId(profile_id), "owner_email": email}
        )
        if not doc:
            raise HTTPException(status_code=404, detail="Family profile not found")

        summary = {
            "name": doc.get("name"),
            "relationship": doc.get("relationship"),
            "age": doc.get("age"),
            "gender": doc.get("gender"),
            "blood_type": doc.get("blood_type"),
            "total_allergies": len(doc.get("allergies", [])),
            "total_conditions": len(doc.get("conditions", [])),
            "total_medications": len(doc.get("medications", [])),
            "allergies": doc.get("allergies", []),
            "conditions": doc.get("conditions", []),
            "medications": doc.get("medications", []),
        }

        return standard_response(True, "Profile summary", {"summary": summary})

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile summary")
