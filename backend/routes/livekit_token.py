import os
import json
import time
import logging
from fastapi import APIRouter, Request, HTTPException
from livekit import api

from utils.security import require_auth
from utils.helpers import standard_response
from services.patient_context import gather_patient_context
from routes.consultations import create_consultation_record

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/livekit", tags=["LiveKit"])

LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.environ.get("LIVEKIT_API_SECRET", "")
LIVEKIT_URL = os.environ.get("LIVEKIT_URL", "")


@router.post("/token")
async def create_token(request: Request):
    """Generate a LiveKit room token for the virtual doctor session"""
    email = await require_auth(request)

    if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        raise HTTPException(
            status_code=503,
            detail="LiveKit is not configured. Please set LIVEKIT_API_KEY and LIVEKIT_API_SECRET.",
        )

    patient_context = await gather_patient_context(email)

    room_name = f"doctor-session-{email.split('@')[0]}-{int(time.time())}"

    consultation_id = await create_consultation_record(email, room_name)

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

    user_auth_token = request.cookies.get("session_token", "")
    auth_header = request.headers.get("Authorization", "")
    if not user_auth_token and auth_header.startswith("Bearer "):
        user_auth_token = auth_header[7:].strip()

    backend_url = os.environ.get("BACKEND_PUBLIC_URL", "http://localhost:8000")

    agent_payload = {
        **patient_context,
        "consultation_id": consultation_id,
        "backend_url": backend_url,
        "user_token": user_auth_token,
    }

    try:
        metadata_str = json.dumps(agent_payload, default=str)
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
            logger.info(
                "Dispatched doctor-agent to %s (consultation %s) with patient context",
                room_name,
                consultation_id,
            )
    except Exception as e:
        logger.error(f"Failed to dispatch agent: {e}")

    logger.info(
        "Generated LiveKit token for %s in room %s (consultation %s)",
        email,
        room_name,
        consultation_id,
    )

    return standard_response(
        data={
            "token": jwt_token,
            "room_name": room_name,
            "livekit_url": LIVEKIT_URL,
            "consultation_id": consultation_id,
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
