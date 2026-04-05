"""
Medication Tracker Routes
"""

from fastapi import APIRouter, HTTPException, Request, Query
from database.models import MedicationCreate, MedicationUpdate, MedicationLogCreate
from database.connection import db
from utils.security import require_auth
from utils.helpers import standard_response, serialize_doc
from bson import ObjectId
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/medications", tags=["Medications"])


@router.post("")
async def add_medication(request: Request, medication: MedicationCreate):
    """Add a new medication"""
    try:
        email = await require_auth(request)

        med_data = {
            **medication.dict(),
            "email": email,
            "active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await db.medications.insert_one(med_data)
        med_data["_id"] = str(result.inserted_id)

        return standard_response(
            message="Medication added successfully",
            data=med_data,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add medication error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add medication")


@router.get("")
async def list_medications(
    request: Request,
    active: bool = Query(None, description="Filter by active status"),
):
    """List all medications for current user"""
    try:
        email = await require_auth(request)

        query = {"email": email}
        if active is not None:
            query["active"] = active

        cursor = db.medications.find(query).sort("created_at", -1)
        medications = []
        async for med in cursor:
            medications.append(serialize_doc(med))

        return standard_response(
            message="Medications retrieved",
            data={"medications": medications, "count": len(medications)},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"List medications error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list medications")


@router.get("/adherence/stats")
async def get_adherence_stats(
    request: Request,
    days: int = Query(30, ge=1, le=365),
):
    """Get medication adherence statistics"""
    try:
        email = await require_auth(request)

        since = datetime.utcnow() - timedelta(days=days)

        active_meds = await db.medications.count_documents(
            {"email": email, "active": True}
        )

        logs_cursor = db.medication_logs.find(
            {"email": email, "logged_at": {"$gte": since}}
        )
        total_taken = 0
        total_skipped = 0
        async for log in logs_cursor:
            if log.get("skipped"):
                total_skipped += 1
            else:
                total_taken += 1

        total_logged = total_taken + total_skipped
        adherence_pct = (
            round((total_taken / total_logged * 100), 1) if total_logged > 0 else 0
        )

        return standard_response(
            message="Adherence stats retrieved",
            data={
                "active_medications": active_meds,
                "period_days": days,
                "total_taken": total_taken,
                "total_skipped": total_skipped,
                "total_logged": total_logged,
                "adherence_percentage": adherence_pct,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Adherence stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get adherence stats")


@router.get("/{medication_id}")
async def get_medication(request: Request, medication_id: str):
    """Get a single medication"""
    try:
        email = await require_auth(request)

        try:
            oid = ObjectId(medication_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid medication ID")

        med = await db.medications.find_one({"_id": oid, "email": email})
        if not med:
            raise HTTPException(status_code=404, detail="Medication not found")

        return standard_response(
            message="Medication retrieved",
            data=serialize_doc(med),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get medication error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get medication")


@router.patch("/{medication_id}")
async def update_medication(
    request: Request, medication_id: str, update: MedicationUpdate
):
    """Update a medication"""
    try:
        email = await require_auth(request)

        try:
            oid = ObjectId(medication_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid medication ID")

        existing = await db.medications.find_one({"_id": oid, "email": email})
        if not existing:
            raise HTTPException(status_code=404, detail="Medication not found")

        update_data = {k: v for k, v in update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")

        update_data["updated_at"] = datetime.utcnow()

        await db.medications.update_one({"_id": oid}, {"$set": update_data})

        updated = await db.medications.find_one({"_id": oid})
        return standard_response(
            message="Medication updated successfully",
            data=serialize_doc(updated),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update medication error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update medication")


@router.delete("/{medication_id}")
async def delete_medication(request: Request, medication_id: str):
    """Soft delete a medication (set active=False)"""
    try:
        email = await require_auth(request)

        try:
            oid = ObjectId(medication_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid medication ID")

        result = await db.medications.update_one(
            {"_id": oid, "email": email},
            {"$set": {"active": False, "updated_at": datetime.utcnow()}},
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Medication not found")

        return standard_response(message="Medication deactivated successfully")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete medication error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete medication")


@router.post("/log")
async def log_medication(request: Request, log: MedicationLogCreate):
    """Log a medication as taken or skipped"""
    try:
        email = await require_auth(request)

        try:
            oid = ObjectId(log.medication_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid medication ID")

        med = await db.medications.find_one({"_id": oid, "email": email})
        if not med:
            raise HTTPException(status_code=404, detail="Medication not found")

        log_data = {
            "medication_id": log.medication_id,
            "medication_name": med.get("name", ""),
            "email": email,
            "taken_at": log.taken_at or datetime.utcnow().isoformat(),
            "skipped": log.skipped,
            "notes": log.notes,
            "logged_at": datetime.utcnow(),
        }

        result = await db.medication_logs.insert_one(log_data)
        log_data["_id"] = str(result.inserted_id)

        return standard_response(
            message="Medication logged successfully",
            data=log_data,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Log medication error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log medication")


@router.get("/{medication_id}/logs")
async def get_medication_logs(
    request: Request,
    medication_id: str,
    days: int = Query(30, ge=1, le=365),
):
    """Get logs for a specific medication"""
    try:
        email = await require_auth(request)

        try:
            oid = ObjectId(medication_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid medication ID")

        med = await db.medications.find_one({"_id": oid, "email": email})
        if not med:
            raise HTTPException(status_code=404, detail="Medication not found")

        since = datetime.utcnow() - timedelta(days=days)
        cursor = db.medication_logs.find(
            {
                "medication_id": medication_id,
                "email": email,
                "logged_at": {"$gte": since},
            }
        ).sort("logged_at", -1)

        logs = []
        async for log_doc in cursor:
            logs.append(serialize_doc(log_doc))

        return standard_response(
            message="Medication logs retrieved",
            data={"logs": logs, "count": len(logs), "period_days": days},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get medication logs error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get medication logs")
