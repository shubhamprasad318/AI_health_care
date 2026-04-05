"""
Symptom Timeline / Health Journal Routes
Aggregates predictions, appointments, medication logs, and manual journal entries into a unified timeline.
"""

from fastapi import APIRouter, HTTPException, Request, Query
from database.connection import db
from database.models import SymptomJournalCreate, SymptomJournalUpdate
from utils.security import require_auth
from utils.helpers import standard_response, serialize_doc, serialize_date
from datetime import datetime, timedelta
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/timeline", tags=["Timeline"])


@router.get("")
async def get_timeline(
    request: Request,
    days: int = Query(90, ge=1, le=365),
    event_type: str = Query(
        None, pattern="^(prediction|appointment|medication_log|journal)$"
    ),
    limit: int = Query(100, ge=1, le=500),
):
    """Get unified health timeline — aggregates all health events"""
    try:
        email = await require_auth(request)
        cutoff = datetime.utcnow() - timedelta(days=days)
        events = []

        # --- Predictions ---
        if event_type is None or event_type == "prediction":
            cursor = db.predictions.find(
                {"email": email, "created_at": {"$gte": cutoff}}
            ).sort("created_at", -1)
            async for pred in cursor:
                events.append(
                    {
                        "id": str(pred["_id"]),
                        "type": "prediction",
                        "title": pred.get("ml_prediction", "Disease Prediction"),
                        "description": f"Symptoms: {', '.join(pred.get('symptoms', [])[:5])}",
                        "details": {
                            "symptoms": pred.get("symptoms", []),
                            "specialist": pred.get("specialist"),
                            "enhanced": pred.get("enhanced", False),
                        },
                        "severity": _prediction_severity(pred.get("ml_prediction", "")),
                        "icon": "stethoscope",
                        "date": serialize_date(pred.get("created_at")),
                    }
                )

        # --- Appointments ---
        if event_type is None or event_type == "appointment":
            cursor = db.appointments.find({"user_email": email}).sort("date", -1)
            async for apt in cursor:
                apt_date = apt.get("date", "")
                # Only include within date range
                if isinstance(apt_date, str) and apt_date >= cutoff.strftime(
                    "%Y-%m-%d"
                ):
                    events.append(
                        {
                            "id": str(apt["_id"]),
                            "type": "appointment",
                            "title": f"Appointment with Dr. {apt.get('doctorName', apt.get('doctor_name', 'Unknown'))}",
                            "description": apt.get(
                                "doctorSpecialization", apt.get("specialization", "")
                            ),
                            "details": {
                                "doctor": apt.get("doctorName", apt.get("doctor_name")),
                                "specialization": apt.get(
                                    "doctorSpecialization", apt.get("specialization")
                                ),
                                "location": apt.get(
                                    "doctorLocation", apt.get("location")
                                ),
                                "time": apt.get("time"),
                                "status": apt.get("status", "scheduled"),
                            },
                            "severity": "info",
                            "icon": "calendar",
                            "date": apt_date
                            if isinstance(apt_date, str)
                            else serialize_date(apt_date),
                        }
                    )
                elif isinstance(apt_date, datetime) and apt_date >= cutoff:
                    events.append(
                        {
                            "id": str(apt["_id"]),
                            "type": "appointment",
                            "title": f"Appointment with Dr. {apt.get('doctorName', apt.get('doctor_name', 'Unknown'))}",
                            "description": apt.get(
                                "doctorSpecialization", apt.get("specialization", "")
                            ),
                            "details": {
                                "doctor": apt.get("doctorName", apt.get("doctor_name")),
                                "specialization": apt.get(
                                    "doctorSpecialization", apt.get("specialization")
                                ),
                                "location": apt.get(
                                    "doctorLocation", apt.get("location")
                                ),
                                "time": apt.get("time"),
                                "status": apt.get("status", "scheduled"),
                            },
                            "severity": "info",
                            "icon": "calendar",
                            "date": serialize_date(apt_date),
                        }
                    )

        # --- Medication Logs ---
        if event_type is None or event_type == "medication_log":
            cursor = db.medication_logs.find(
                {"email": email, "logged_at": {"$gte": cutoff}}
            ).sort("logged_at", -1)
            async for log in cursor:
                action = "Skipped" if log.get("skipped") else "Taken"
                events.append(
                    {
                        "id": str(log["_id"]),
                        "type": "medication_log",
                        "title": f"Medication {action}: {log.get('medication_name', 'Unknown')}",
                        "description": log.get("notes", ""),
                        "details": {
                            "medication_id": log.get("medication_id"),
                            "medication_name": log.get("medication_name"),
                            "skipped": log.get("skipped", False),
                        },
                        "severity": "low" if not log.get("skipped") else "medium",
                        "icon": "pill",
                        "date": serialize_date(log.get("logged_at")),
                    }
                )

        # --- Journal Entries ---
        if event_type is None or event_type == "journal":
            cursor = db.journal_entries.find(
                {"email": email, "created_at": {"$gte": cutoff}}
            ).sort("created_at", -1)
            async for entry in cursor:
                events.append(
                    {
                        "id": str(entry["_id"]),
                        "type": "journal",
                        "title": entry.get("title", "Journal Entry"),
                        "description": entry.get("content", "")[:200],
                        "details": {
                            "content": entry.get("content", ""),
                            "mood": entry.get("mood"),
                            "symptoms": entry.get("symptoms", []),
                            "tags": entry.get("tags", []),
                            "pain_level": entry.get("pain_level"),
                        },
                        "severity": _mood_to_severity(entry.get("mood")),
                        "icon": "journal",
                        "date": serialize_date(entry.get("created_at")),
                    }
                )

        # Sort all events by date descending
        events.sort(key=lambda e: e.get("date", ""), reverse=True)
        events = events[:limit]

        return standard_response(
            message="Timeline retrieved successfully",
            data={
                "events": events,
                "count": len(events),
                "days": days,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get timeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get timeline")


# --- Journal CRUD ---


@router.post("/journal")
async def create_journal_entry(request: Request, entry: SymptomJournalCreate):
    """Create a new health journal entry"""
    try:
        email = await require_auth(request)

        doc = {
            "email": email,
            "title": entry.title,
            "content": entry.content,
            "mood": entry.mood,
            "symptoms": entry.symptoms or [],
            "tags": entry.tags or [],
            "pain_level": entry.pain_level,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await db.journal_entries.insert_one(doc)
        doc["_id"] = str(result.inserted_id)

        return standard_response(
            message="Journal entry created",
            data={"entry": serialize_doc(doc)},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create journal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create journal entry")


@router.get("/journal")
async def get_journal_entries(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    mood: str = Query(None, pattern="^(great|good|okay|bad|terrible)$"),
):
    """Get user's journal entries"""
    try:
        email = await require_auth(request)
        query = {"email": email}
        if mood:
            query["mood"] = mood

        cursor = db.journal_entries.find(query).sort("created_at", -1).limit(limit)
        entries = []
        async for entry in cursor:
            entry["_id"] = str(entry["_id"])
            if isinstance(entry.get("created_at"), datetime):
                entry["created_at"] = entry["created_at"].isoformat()
            if isinstance(entry.get("updated_at"), datetime):
                entry["updated_at"] = entry["updated_at"].isoformat()
            entries.append(entry)

        return standard_response(
            message="Journal entries retrieved",
            data={"entries": entries, "count": len(entries)},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get journal entries error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get journal entries")


@router.patch("/journal/{entry_id}")
async def update_journal_entry(
    request: Request, entry_id: str, entry: SymptomJournalUpdate
):
    """Update a journal entry"""
    try:
        email = await require_auth(request)

        if not ObjectId.is_valid(entry_id):
            raise HTTPException(status_code=400, detail="Invalid entry ID")

        update_data = {k: v for k, v in entry.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_data["updated_at"] = datetime.utcnow()

        result = await db.journal_entries.update_one(
            {"_id": ObjectId(entry_id), "email": email},
            {"$set": update_data},
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Journal entry not found")

        return standard_response(message="Journal entry updated")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update journal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update journal entry")


@router.delete("/journal/{entry_id}")
async def delete_journal_entry(request: Request, entry_id: str):
    """Delete a journal entry"""
    try:
        email = await require_auth(request)

        if not ObjectId.is_valid(entry_id):
            raise HTTPException(status_code=400, detail="Invalid entry ID")

        result = await db.journal_entries.delete_one(
            {"_id": ObjectId(entry_id), "email": email}
        )

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Journal entry not found")

        return standard_response(message="Journal entry deleted")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete journal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete journal entry")


# --- Helpers ---


def _prediction_severity(prediction: str) -> str:
    """Map prediction to severity level"""
    high_risk = {
        "heart attack",
        "stroke",
        "diabetes",
        "hepatitis",
        "malaria",
        "tuberculosis",
        "pneumonia",
        "aids",
        "jaundice",
    }
    prediction_lower = prediction.lower()
    for disease in high_risk:
        if disease in prediction_lower:
            return "high"
    return "medium"


def _mood_to_severity(mood: str) -> str:
    """Map mood to severity for display"""
    mapping = {
        "great": "low",
        "good": "low",
        "okay": "medium",
        "bad": "high",
        "terrible": "high",
    }
    return mapping.get(mood, "medium")
