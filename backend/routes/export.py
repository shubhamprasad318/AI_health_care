"""
Export Data Routes — CSV and FHIR R4 format exports
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
from bson import ObjectId
import csv
import io
import json
import logging

from database.connection import db, get_user_by_email
from utils.security import require_auth
from utils.helpers import serialize_date, safe_str, standard_response

router = APIRouter(prefix="/export", tags=["Export"])
logger = logging.getLogger(__name__)


# ─── CSV Export ───────────────────────────────────────────────


@router.get("/csv/{data_type}")
async def export_csv(request: Request, data_type: str, days: int = 90):
    """Export data as CSV. Supported types: predictions, appointments, medications, journal, family"""
    email = await require_auth(request)

    if data_type not in (
        "predictions",
        "appointments",
        "medications",
        "journal",
        "family",
    ):
        raise HTTPException(
            status_code=400, detail=f"Unsupported data type: {data_type}"
        )

    if days < 1 or days > 3650:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 3650")

    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        output = io.StringIO()
        writer = csv.writer(output)

        if data_type == "predictions":
            writer.writerow(
                [
                    "Date",
                    "Symptoms",
                    "Predicted Disease",
                    "Confidence",
                    "Specialist",
                    "Description",
                ]
            )
            cursor = db.predictions.find(
                {"email": email, "created_at": {"$gte": cutoff}}
            ).sort("created_at", -1)
            async for doc in cursor:
                writer.writerow(
                    [
                        serialize_date(doc.get("created_at")),
                        safe_str(doc.get("symptoms")),
                        safe_str(
                            doc.get("ml_prediction", {}).get("prediction")
                            if isinstance(doc.get("ml_prediction"), dict)
                            else doc.get("ml_prediction")
                        ),
                        safe_str(
                            doc.get("ml_prediction", {}).get("confidence")
                            if isinstance(doc.get("ml_prediction"), dict)
                            else ""
                        ),
                        safe_str(doc.get("specialist")),
                        safe_str(doc.get("description")),
                    ]
                )

        elif data_type == "appointments":
            writer.writerow(
                ["Date", "Time", "Doctor Name", "Specialization", "Location", "Status"]
            )
            cursor = db.appointments.find({"email": email}).sort("date", -1)
            async for doc in cursor:
                writer.writerow(
                    [
                        safe_str(doc.get("date")),
                        safe_str(doc.get("time")),
                        safe_str(doc.get("doctorName")),
                        safe_str(doc.get("doctorSpecialization")),
                        safe_str(doc.get("doctorLocation")),
                        safe_str(doc.get("status", "pending")),
                    ]
                )

        elif data_type == "medications":
            writer.writerow(
                [
                    "Name",
                    "Dosage",
                    "Frequency",
                    "Times",
                    "Start Date",
                    "End Date",
                    "Active",
                    "Reminder",
                ]
            )
            cursor = db.medications.find({"email": email}).sort("created_at", -1)
            async for doc in cursor:
                writer.writerow(
                    [
                        safe_str(doc.get("name")),
                        safe_str(doc.get("dosage")),
                        safe_str(doc.get("frequency")),
                        safe_str(doc.get("times")),
                        safe_str(doc.get("start_date")),
                        safe_str(doc.get("end_date")),
                        safe_str(doc.get("active", True)),
                        safe_str(doc.get("reminder_enabled", False)),
                    ]
                )

        elif data_type == "journal":
            writer.writerow(
                ["Date", "Title", "Content", "Mood", "Pain Level", "Symptoms", "Tags"]
            )
            cursor = db.journal_entries.find(
                {"email": email, "created_at": {"$gte": cutoff}}
            ).sort("created_at", -1)
            async for doc in cursor:
                writer.writerow(
                    [
                        serialize_date(doc.get("created_at")),
                        safe_str(doc.get("title")),
                        safe_str(doc.get("content")),
                        safe_str(doc.get("mood")),
                        safe_str(doc.get("pain_level")),
                        safe_str(doc.get("symptoms")),
                        safe_str(doc.get("tags")),
                    ]
                )

        elif data_type == "family":
            writer.writerow(
                [
                    "Name",
                    "Relationship",
                    "Age",
                    "Gender",
                    "Blood Type",
                    "Allergies",
                    "Conditions",
                    "Medications",
                ]
            )
            cursor = db.family_profiles.find({"owner_email": email})
            async for doc in cursor:
                writer.writerow(
                    [
                        safe_str(doc.get("name")),
                        safe_str(doc.get("relationship")),
                        safe_str(doc.get("age")),
                        safe_str(doc.get("gender")),
                        safe_str(doc.get("blood_type")),
                        safe_str(doc.get("allergies")),
                        safe_str(doc.get("conditions")),
                        safe_str(doc.get("medications")),
                    ]
                )

        output.seek(0)
        filename = f"health_data_{data_type}_{datetime.utcnow().strftime('%Y%m%d')}.csv"

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV export error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export data")


# ─── FHIR R4 Export ───────────────────────────────────────────


@router.get("/fhir")
async def export_fhir(request: Request, days: int = 90):
    """Export health data as FHIR R4 Bundle (JSON)"""
    email = await require_auth(request)

    if days < 1 or days > 3650:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 3650")

    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        entries = []

        # Patient resource from profile
        user = await get_user_by_email(email)
        patient_id = str(user.get("_id", "unknown")) if user else "unknown"

        patient_resource = {
            "fullUrl": f"urn:uuid:patient-{patient_id}",
            "resource": {
                "resourceType": "Patient",
                "id": patient_id,
                "identifier": [{"system": "urn:ai-healthcare:email", "value": email}],
                "name": [{"text": safe_str(user.get("name")) or email.split("@")[0]}]
                if user
                else [{"text": email.split("@")[0]}],
                "gender": safe_str(user.get("gender", "unknown")).lower() or "unknown",
                "birthDate": safe_str(user.get("dob")),
            },
            "request": {"method": "POST", "url": "Patient"},
        }
        if user and user.get("phone"):
            patient_resource["resource"]["telecom"] = [
                {"system": "phone", "value": user["phone"]}
            ]
        entries.append(patient_resource)

        # Conditions from predictions
        cursor = db.predictions.find(
            {"email": email, "created_at": {"$gte": cutoff}}
        ).sort("created_at", -1)
        async for doc in cursor:
            prediction = doc.get("ml_prediction", {})
            disease = (
                prediction.get("prediction")
                if isinstance(prediction, dict)
                else str(prediction)
            )
            if not disease:
                continue

            condition_id = str(doc["_id"])
            entries.append(
                {
                    "fullUrl": f"urn:uuid:condition-{condition_id}",
                    "resource": {
                        "resourceType": "Condition",
                        "id": condition_id,
                        "subject": {"reference": f"urn:uuid:patient-{patient_id}"},
                        "code": {
                            "coding": [
                                {
                                    "system": "urn:ai-healthcare:ml-prediction",
                                    "display": disease,
                                }
                            ],
                            "text": disease,
                        },
                        "onsetDateTime": serialize_date(doc.get("created_at")),
                        "note": [
                            {"text": f"Symptoms: {safe_str(doc.get('symptoms'))}"}
                        ],
                        "clinicalStatus": {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                                    "code": "active",
                                }
                            ]
                        },
                    },
                    "request": {"method": "POST", "url": "Condition"},
                }
            )

        # Appointments as Encounter resources
        cursor = db.appointments.find({"email": email}).sort("date", -1)
        async for doc in cursor:
            appt_id = str(doc["_id"])
            status_map = {
                "confirmed": "planned",
                "pending": "planned",
                "cancelled": "cancelled",
                "completed": "finished",
            }
            entries.append(
                {
                    "fullUrl": f"urn:uuid:encounter-{appt_id}",
                    "resource": {
                        "resourceType": "Encounter",
                        "id": appt_id,
                        "status": status_map.get(
                            safe_str(doc.get("status", "pending")), "planned"
                        ),
                        "class": {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                            "code": "AMB",
                            "display": "ambulatory",
                        },
                        "subject": {"reference": f"urn:uuid:patient-{patient_id}"},
                        "participant": [
                            {
                                "individual": {
                                    "display": safe_str(
                                        doc.get("doctorName", "Unknown")
                                    ),
                                }
                            }
                        ],
                        "period": {"start": safe_str(doc.get("date"))},
                        "serviceType": {
                            "coding": [
                                {"display": safe_str(doc.get("doctorSpecialization"))}
                            ]
                        },
                    },
                    "request": {"method": "POST", "url": "Encounter"},
                }
            )

        # Medications as MedicationStatement
        cursor = db.medications.find({"email": email}).sort("created_at", -1)
        async for doc in cursor:
            med_id = str(doc["_id"])
            entries.append(
                {
                    "fullUrl": f"urn:uuid:medstatement-{med_id}",
                    "resource": {
                        "resourceType": "MedicationStatement",
                        "id": med_id,
                        "status": "active" if doc.get("active", True) else "stopped",
                        "subject": {"reference": f"urn:uuid:patient-{patient_id}"},
                        "medicationCodeableConcept": {
                            "text": safe_str(doc.get("name")),
                        },
                        "dosage": [
                            {
                                "text": f"{safe_str(doc.get('dosage'))} - {safe_str(doc.get('frequency'))}",
                                "timing": {
                                    "repeat": {"timeOfDay": doc.get("times", [])}
                                },
                            }
                        ],
                        "effectivePeriod": {
                            "start": safe_str(doc.get("start_date")),
                            "end": safe_str(doc.get("end_date")),
                        },
                        "note": [{"text": safe_str(doc.get("notes"))}]
                        if doc.get("notes")
                        else [],
                    },
                    "request": {"method": "POST", "url": "MedicationStatement"},
                }
            )

        # Journal entries as Observation (patient-reported)
        cursor = db.journal_entries.find(
            {"email": email, "created_at": {"$gte": cutoff}}
        ).sort("created_at", -1)
        async for doc in cursor:
            obs_id = str(doc["_id"])
            components = []
            if doc.get("mood"):
                components.append(
                    {
                        "code": {"text": "Mood"},
                        "valueString": safe_str(doc.get("mood")),
                    }
                )
            if doc.get("pain_level") is not None:
                components.append(
                    {
                        "code": {"text": "Pain Level"},
                        "valueInteger": doc.get("pain_level"),
                    }
                )
            entries.append(
                {
                    "fullUrl": f"urn:uuid:observation-{obs_id}",
                    "resource": {
                        "resourceType": "Observation",
                        "id": obs_id,
                        "status": "final",
                        "category": [
                            {
                                "coding": [
                                    {
                                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                        "code": "survey",
                                        "display": "Survey",
                                    }
                                ]
                            }
                        ],
                        "code": {
                            "text": safe_str(doc.get("title", "Health Journal Entry"))
                        },
                        "subject": {"reference": f"urn:uuid:patient-{patient_id}"},
                        "effectiveDateTime": serialize_date(doc.get("created_at")),
                        "valueString": safe_str(doc.get("content")),
                        "component": components,
                        "note": [{"text": f"Symptoms: {safe_str(doc.get('symptoms'))}"}]
                        if doc.get("symptoms")
                        else [],
                    },
                    "request": {"method": "POST", "url": "Observation"},
                }
            )

        # Family members as RelatedPerson
        cursor = db.family_profiles.find({"owner_email": email})
        async for doc in cursor:
            rp_id = str(doc["_id"])
            entries.append(
                {
                    "fullUrl": f"urn:uuid:relatedperson-{rp_id}",
                    "resource": {
                        "resourceType": "RelatedPerson",
                        "id": rp_id,
                        "patient": {"reference": f"urn:uuid:patient-{patient_id}"},
                        "name": [{"text": safe_str(doc.get("name"))}],
                        "relationship": [
                            {
                                "coding": [
                                    {
                                        "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
                                        "display": safe_str(doc.get("relationship")),
                                    }
                                ]
                            }
                        ],
                        "gender": safe_str(doc.get("gender", "unknown")).lower()
                        or "unknown",
                    },
                    "request": {"method": "POST", "url": "RelatedPerson"},
                }
            )

        # Build FHIR Bundle
        bundle = {
            "resourceType": "Bundle",
            "id": f"export-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "type": "transaction",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "meta": {
                "lastUpdated": datetime.utcnow().isoformat() + "Z",
                "profile": ["http://hl7.org/fhir/R4/bundle.html"],
            },
            "total": len(entries),
            "entry": entries,
        }

        content = json.dumps(bundle, indent=2, default=str)
        filename = f"health_data_fhir_{datetime.utcnow().strftime('%Y%m%d')}.json"

        return StreamingResponse(
            iter([content]),
            media_type="application/fhir+json",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"FHIR export error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export FHIR data")


@router.get("/summary")
async def export_summary(request: Request, days: int = 90):
    """Get summary of available data for export preview"""
    email = await require_auth(request)

    try:
        cutoff = datetime.utcnow() - timedelta(days=days)

        predictions_count = await db.predictions.count_documents(
            {"email": email, "created_at": {"$gte": cutoff}}
        )
        appointments_count = await db.appointments.count_documents({"email": email})
        medications_count = await db.medications.count_documents({"email": email})
        journal_count = await db.journal_entries.count_documents(
            {"email": email, "created_at": {"$gte": cutoff}}
        )
        family_count = await db.family_profiles.count_documents({"owner_email": email})

        return standard_response(
            message="Export summary",
            data={
                "period_days": days,
                "counts": {
                    "predictions": predictions_count,
                    "appointments": appointments_count,
                    "medications": medications_count,
                    "journal": journal_count,
                    "family": family_count,
                },
                "total_records": predictions_count
                + appointments_count
                + medications_count
                + journal_count
                + family_count,
                "formats": ["csv", "fhir"],
            },
        )

    except Exception as e:
        logger.error(f"Export summary error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get export summary")
