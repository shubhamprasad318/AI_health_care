"""
Admin Dashboard Routes
Platform statistics, user management, and system health monitoring
"""

from fastapi import APIRouter, HTTPException, Request, Query
from database.connection import db
from utils.helpers import standard_response, serialize_doc
from utils.security import require_auth
from config.settings import ADMIN_EMAIL
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(email: str):
    """Check if user is admin — security guard, must not be removed"""
    if not ADMIN_EMAIL or email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/stats")
async def get_platform_stats(request: Request):
    """Get platform-wide statistics"""
    try:
        email = await require_auth(request)
        _require_admin(email)

        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        total_users = await db.store.count_documents({})
        total_predictions = await db.predictions.count_documents({})
        total_appointments = await db.appointments.count_documents({})
        total_medications = await db.medications.count_documents({})
        total_doctors = await db.doctors.count_documents({})
        total_files = await db.files.count_documents({})
        total_contacts = await db.store.count_documents({"type": "contact"})
        total_journal = await db.journal_entries.count_documents({})
        total_family = await db.family_profiles.count_documents({})
        total_reviews = await db.doctor_reviews.count_documents({})

        recent_users = 0
        recent_predictions = 0
        recent_appointments = 0

        try:
            recent_users = await db.store.count_documents(
                {"created_at": {"$gte": thirty_days_ago}}
            )
        except Exception:
            pass

        try:
            recent_predictions = await db.predictions.count_documents(
                {"created_at": {"$gte": thirty_days_ago.isoformat()}}
            )
        except Exception:
            pass

        try:
            recent_appointments = await db.appointments.count_documents(
                {"created_at": {"$gte": thirty_days_ago.isoformat()}}
            )
        except Exception:
            pass

        active_emails = set()
        try:
            async for pred in db.predictions.find(
                {"created_at": {"$gte": seven_days_ago.isoformat()}},
                {"email": 1},
            ).limit(500):
                if "email" in pred:
                    active_emails.add(pred["email"])
        except Exception:
            pass

        twofa_enabled = await db.store.count_documents({"totp_verified": True})

        return standard_response(
            data={
                "overview": {
                    "total_users": total_users,
                    "total_predictions": total_predictions,
                    "total_appointments": total_appointments,
                    "total_medications": total_medications,
                    "total_doctors": total_doctors,
                    "total_files": total_files,
                    "total_journal_entries": total_journal,
                    "total_family_profiles": total_family,
                    "total_reviews": total_reviews,
                },
                "recent_activity": {
                    "new_users_30d": recent_users,
                    "predictions_30d": recent_predictions,
                    "appointments_30d": recent_appointments,
                    "active_users_7d": len(active_emails),
                },
                "security": {
                    "twofa_enabled": twofa_enabled,
                    "twofa_percentage": round(
                        (twofa_enabled / total_users * 100) if total_users > 0 else 0,
                        1,
                    ),
                },
            },
            message="Platform statistics retrieved",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting platform stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get platform statistics")


@router.get("/users")
async def get_users(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    search: str = Query(default=None),
):
    """Get user list with basic info"""
    try:
        email = await require_auth(request)
        _require_admin(email)

        query = {}
        if search:
            query["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"name": {"$regex": search, "$options": "i"}},
            ]

        total = await db.store.count_documents(query)
        cursor = (
            db.store.find(
                query,
                {
                    "password": 0,
                    "totp_secret": 0,
                    "recovery_codes": 0,
                },
            )
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )

        users = []
        async for user in cursor:
            user_data = serialize_doc(user)
            user_email = user_data.get("email", "")
            user_data["prediction_count"] = await db.predictions.count_documents(
                {"email": user_email}
            )
            user_data["appointment_count"] = await db.appointments.count_documents(
                {"email": user_email}
            )
            users.append(user_data)

        return standard_response(
            data={
                "users": users,
                "total": total,
                "limit": limit,
                "skip": skip,
            },
            message=f"Found {total} users",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting users: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get users")


@router.get("/users/{user_id}")
async def get_user_detail(request: Request, user_id: str):
    """Get detailed user information"""
    try:
        email = await require_auth(request)
        _require_admin(email)

        try:
            oid = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid user ID")

        user = await db.store.find_one(
            {"_id": oid},
            {"password": 0, "totp_secret": 0, "recovery_codes": 0},
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = serialize_doc(user)
        user_email = user_data.get("email", "")

        user_data["stats"] = {
            "predictions": await db.predictions.count_documents({"email": user_email}),
            "appointments": await db.appointments.count_documents(
                {"email": user_email}
            ),
            "medications": await db.medications.count_documents({"email": user_email}),
            "files": await db.files.count_documents({"email": user_email}),
            "journal_entries": await db.journal_entries.count_documents(
                {"email": user_email}
            ),
            "family_profiles": await db.family_profiles.count_documents(
                {"owner_email": user_email}
            ),
        }

        return standard_response(data=user_data, message="User details retrieved")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user detail: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get user details")


@router.delete("/users/{user_id}")
async def delete_user(request: Request, user_id: str):
    """Delete a user and all their data"""
    try:
        email = await require_auth(request)
        _require_admin(email)

        try:
            oid = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid user ID")

        user = await db.store.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_email = user.get("email", "")

        # Prevent admin self-deletion
        if user_email == ADMIN_EMAIL:
            raise HTTPException(status_code=400, detail="Cannot delete admin account")

        await db.store.delete_one({"_id": oid})
        await db.predictions.delete_many({"email": user_email})
        await db.appointments.delete_many({"email": user_email})
        await db.medications.delete_many({"email": user_email})
        await db.medication_logs.delete_many({"email": user_email})
        await db.files.delete_many({"email": user_email})
        await db.journal_entries.delete_many({"email": user_email})
        await db.family_profiles.delete_many({"owner_email": user_email})
        await db.notifications.delete_many({"email": user_email})
        await db.chat_history.delete_many({"email": user_email})
        await db.health_plans.delete_many({"email": user_email})
        await db.doctor_reviews.delete_many({"email": user_email})

        logger.info(f"Admin deleted user: {user_email}")

        return standard_response(
            data={"deleted_email": user_email},
            message="User and all associated data deleted",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete user")


@router.get("/system")
async def get_system_health(request: Request):
    """Get system health information"""
    try:
        email = await require_auth(request)
        _require_admin(email)

        db_healthy = True
        try:
            await db.store.find_one({})
        except Exception:
            db_healthy = False

        from services.ml_service import are_models_loaded
        from services.gemini_service import is_gemini_available

        collections = {
            "users": await db.store.count_documents({}),
            "predictions": await db.predictions.count_documents({}),
            "appointments": await db.appointments.count_documents({}),
            "medications": await db.medications.count_documents({}),
            "medication_logs": await db.medication_logs.count_documents({}),
            "files": await db.files.count_documents({}),
            "journal_entries": await db.journal_entries.count_documents({}),
            "family_profiles": await db.family_profiles.count_documents({}),
            "notifications": await db.notifications.count_documents({}),
            "doctors": await db.doctors.count_documents({}),
            "doctor_reviews": await db.doctor_reviews.count_documents({}),
            "chat_history": await db.chat_history.count_documents({}),
            "health_plans": await db.health_plans.count_documents({}),
        }

        return standard_response(
            data={
                "database": "connected" if db_healthy else "disconnected",
                "ml_models": "loaded" if are_models_loaded() else "not loaded",
                "gemini": "enabled" if is_gemini_available() else "disabled",
                "collections": collections,
                "total_documents": sum(collections.values()),
                "timestamp": datetime.utcnow().isoformat(),
            },
            message="System health retrieved",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting system health: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get system health")


@router.get("/activity")
async def get_recent_activity(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
):
    """Get recent platform activity feed"""
    try:
        email = await require_auth(request)
        _require_admin(email)

        activities = []

        async for pred in db.predictions.find().sort("created_at", -1).limit(limit):
            activities.append(
                {
                    "type": "prediction",
                    "email": pred.get("email", "unknown"),
                    "description": f"Disease prediction: {pred.get('ml_prediction', 'N/A')}",
                    "date": pred.get("created_at", ""),
                    "icon": "stethoscope",
                }
            )

        async for appt in db.appointments.find().sort("created_at", -1).limit(limit):
            activities.append(
                {
                    "type": "appointment",
                    "email": appt.get("email", "unknown"),
                    "description": f"Appointment with {appt.get('doctorName', 'N/A')}",
                    "date": appt.get("created_at", ""),
                    "icon": "calendar",
                }
            )

        async for user in db.store.find().sort("created_at", -1).limit(limit):
            activities.append(
                {
                    "type": "signup",
                    "email": user.get("email", "unknown"),
                    "description": f"New user registered: {user.get('name', user.get('email', 'N/A'))}",
                    "date": user.get("created_at", ""),
                    "icon": "user-plus",
                }
            )

        def _sort_key(item):
            d = item.get("date", "")
            if isinstance(d, datetime):
                return d.isoformat()
            return str(d)

        activities.sort(key=_sort_key, reverse=True)

        return standard_response(
            data={"activities": activities[:limit]},
            message="Recent activity retrieved",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting activity: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get activity feed")
