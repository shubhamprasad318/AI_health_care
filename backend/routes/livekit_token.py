import os
import json
import time
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, HTTPException
from livekit import api

from utils.security import require_auth
from utils.helpers import standard_response
from database.connection import db, get_user_by_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/livekit", tags=["LiveKit"])

LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.environ.get("LIVEKIT_API_SECRET", "")
LIVEKIT_URL = os.environ.get("LIVEKIT_URL", "")


async def _gather_patient_context(email: str) -> dict:
    """Gather patient medical history from all collections for the AI doctor"""
    context = {"email": email}

    try:
        user = await get_user_by_email(email)
        if user:
            context["patient"] = {
                "name": user.get("name", ""),
                "age": user.get("age"),
                "gender": user.get("gender", ""),
                "blood_type": user.get("blood_type", ""),
                "height": user.get("height"),
                "weight": user.get("weight"),
                "blood_pressure": user.get("blood_pressure", ""),
                "allergies": user.get("allergies", ""),
                "existing_conditions": user.get("existing_conditions", ""),
                "current_medications": user.get("current_medications", ""),
            }
            if user.get("height") and user.get("weight"):
                h_m = float(user["height"]) / 100
                context["patient"]["bmi"] = round(
                    float(user["weight"]) / (h_m * h_m), 1
                )
    except Exception as e:
        logger.warning(f"Failed to fetch patient profile: {e}")

    try:
        recent_predictions = (
            await db.predictions.find({"email": email})
            .sort("created_at", -1)
            .limit(5)
            .to_list(5)
        )
        if recent_predictions:
            context["recent_diagnoses"] = [
                {
                    "disease": p.get("ml_prediction", ""),
                    "symptoms": p.get("symptoms", []),
                    "date": str(p.get("created_at", ""))[:10],
                }
                for p in recent_predictions
            ]
    except Exception as e:
        logger.warning(f"Failed to fetch predictions: {e}")

    try:
        active_meds = await db.medications.find(
            {"email": email, "active": True}
        ).to_list(20)
        if active_meds:
            context["active_medications"] = [
                {
                    "name": m.get("name", ""),
                    "dosage": m.get("dosage", ""),
                    "frequency": m.get("frequency", ""),
                    "times": m.get("times", []),
                }
                for m in active_meds
            ]
    except Exception as e:
        logger.warning(f"Failed to fetch medications: {e}")

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    try:
        recent_journals = (
            await db.journal_entries.find(
                {"email": email, "created_at": {"$gte": thirty_days_ago}}
            )
            .sort("created_at", -1)
            .limit(5)
            .to_list(5)
        )
        if recent_journals:
            context["recent_journal"] = [
                {
                    "title": j.get("title", ""),
                    "mood": j.get("mood", ""),
                    "pain_level": j.get("pain_level"),
                    "symptoms": j.get("symptoms", []),
                    "date": str(j.get("created_at", ""))[:10],
                }
                for j in recent_journals
            ]
    except Exception as e:
        logger.warning(f"Failed to fetch journal entries: {e}")

    try:
        upcoming = (
            await db.appointments.find(
                {"user_email": email, "status": {"$ne": "cancelled"}}
            )
            .sort("date", -1)
            .limit(3)
            .to_list(3)
        )
        if upcoming:
            context["recent_appointments"] = [
                {
                    "doctor": a.get("doctorName", ""),
                    "specialization": a.get("doctorSpecialization", ""),
                    "date": a.get("date", ""),
                    "status": a.get("status", ""),
                }
                for a in upcoming
            ]
    except Exception as e:
        logger.warning(f"Failed to fetch appointments: {e}")

    try:
        family = await db.family_profiles.find({"owner_email": email}).to_list(10)
        if family:
            context["family_history"] = [
                {
                    "relationship": f.get("relationship", ""),
                    "conditions": f.get("conditions", []),
                    "medications": f.get("medications", []),
                }
                for f in family
            ]
    except Exception as e:
        logger.warning(f"Failed to fetch family profiles: {e}")

    return context


@router.post("/token")
async def create_token(request: Request):
    """Generate a LiveKit room token for the virtual doctor session"""
    email = await require_auth(request)

    if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        raise HTTPException(
            status_code=503,
            detail="LiveKit is not configured. Please set LIVEKIT_API_KEY and LIVEKIT_API_SECRET.",
        )

    patient_context = await _gather_patient_context(email)

    room_name = f"doctor-session-{email.split('@')[0]}-{int(time.time())}"

    token = (
        api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        .with_identity(email)
        .with_name(email.split("@")[0])
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
            )
        )
    )

    jwt_token = token.to_jwt()

    try:
        metadata_str = json.dumps(patient_context, default=str)
        async with api.LiveKitAPI(
            LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
        ) as lkapi:
            await lkapi.agent_dispatch.create_dispatch(
                api.CreateAgentDispatchRequest(
                    agent_name="doctor-agent",
                    room=room_name,
                    metadata=metadata_str,
                )
            )
            logger.info(f"Dispatched doctor-agent to {room_name} with patient context")
    except Exception as e:
        logger.error(f"Failed to dispatch agent: {e}")

    logger.info(f"Generated LiveKit token for {email} in room {room_name}")

    return standard_response(
        data={
            "token": jwt_token,
            "room_name": room_name,
            "livekit_url": LIVEKIT_URL,
        },
    )


@router.get("/status")
async def livekit_status():
    """Check if LiveKit is configured"""
    configured = bool(LIVEKIT_API_KEY and LIVEKIT_API_SECRET and LIVEKIT_URL)
    return standard_response(
        data={
            "configured": configured,
            "url": LIVEKIT_URL if configured else None,
        },
    )
