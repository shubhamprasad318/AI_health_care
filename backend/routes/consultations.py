"""Voice consultation persistence routes.

Records created here are written at LiveKit token-mint time (see
routes/livekit_token.py) and filled in at end-of-call by the
livekit-agent posting to /consultations/{id}/summary."""

import logging
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Query, Request

from database.connection import db
from database.models import ConsultationSummaryRequest, RecommendationActionRequest
from routes.notifications import notify_safely
from services.consultation_service import summarize_consultation
from utils.helpers import serialize_mongo_doc, standard_response
from utils.security import require_auth

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/consultations", tags=["Consultations"])


async def create_consultation_record(email: str, room_name: str) -> str:
    """Insert a placeholder consultation document and return its id.
    Called by routes/livekit_token.py when a new room is provisioned."""
    doc = {
        "email": email,
        "room_name": room_name,
        "status": "ongoing",
        "started_at": datetime.now(timezone.utc),
        "ended_at": None,
        "transcript": None,
        "summary": None,
        "duration_seconds": None,
    }
    result = await db.consultations.insert_one(doc)
    return str(result.inserted_id)


@router.get("")
async def list_consultations(
    request: Request,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
):
    email = await require_auth(request)
    cursor = (
        db.consultations.find({"email": email})
        .sort("started_at", -1)
        .skip(skip)
        .limit(limit)
    )
    items = [serialize_mongo_doc(doc) async for doc in cursor]
    total = await db.consultations.count_documents({"email": email})
    return standard_response(
        data={"count": len(items), "total": total, "consultations": items}
    )


@router.get("/{consultation_id}")
async def get_consultation(request: Request, consultation_id: str):
    email = await require_auth(request)
    try:
        oid = ObjectId(consultation_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid consultation id")
    doc = await db.consultations.find_one({"_id": oid, "email": email})
    if not doc:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return standard_response(data=serialize_mongo_doc(doc))


@router.delete("/{consultation_id}")
async def delete_consultation(request: Request, consultation_id: str):
    email = await require_auth(request)
    try:
        oid = ObjectId(consultation_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid consultation id")
    result = await db.consultations.delete_one({"_id": oid, "email": email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return standard_response(message="Consultation deleted")


@router.post("/{consultation_id}/summary")
async def post_summary(
    request: Request,
    consultation_id: str,
    payload: ConsultationSummaryRequest,
):
    """Called by the livekit-agent at end-of-call. Persists the transcript
    + duration and asks Gemini to produce a structured clinical summary."""
    email = await require_auth(request)
    try:
        oid = ObjectId(consultation_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid consultation id")

    existing = await db.consultations.find_one({"_id": oid, "email": email})
    if not existing:
        raise HTTPException(status_code=404, detail="Consultation not found")

    summary = None
    if payload.transcript:
        summary = await summarize_consultation(payload.transcript)

    update = {
        "transcript": payload.transcript,
        "duration_seconds": payload.duration_seconds,
        "status": "completed",
        "ended_at": datetime.now(timezone.utc),
        "summary": summary,
    }
    await db.consultations.update_one(
        {"_id": oid, "email": email}, {"$set": update}
    )
    logger.info(
        "Consultation %s saved for %s (duration=%ss, transcript_chars=%d)",
        consultation_id,
        email,
        payload.duration_seconds,
        len(payload.transcript or ""),
    )
    await notify_safely(
        email,
        "Call summary ready",
        "Your summary from Dr. AI is ready, with next steps."
        if summary
        else "Your call with Dr. AI was saved.",
        "success",
        "/virtual-doctor",
    )
    return standard_response(
        message="Consultation summary saved",
        data={"consultation_id": consultation_id, "summary": summary},
    )


@router.patch("/{consultation_id}/recommendation-action")
async def record_recommendation_action(
    request: Request,
    consultation_id: str,
    payload: RecommendationActionRequest,
):
    email = await require_auth(request)
    try:
        oid = ObjectId(consultation_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid consultation id")
    existing = await db.consultations.find_one({"_id": oid, "email": email})
    if not existing:
        raise HTTPException(status_code=404, detail="Consultation not found")
    action_entry = {
        "idx": payload.recommendation_idx,
        "type": payload.action_type,
        "linked_id": payload.linked_id,
        "at": datetime.now(timezone.utc),
    }
    await db.consultations.update_one(
        {"_id": oid, "email": email},
        {"$push": {"actions": action_entry}},
    )
    updated = await db.consultations.find_one({"_id": oid, "email": email})
    return standard_response(
        message="Recommendation action recorded",
        data={"actions": (updated or {}).get("actions", [])},
    )
