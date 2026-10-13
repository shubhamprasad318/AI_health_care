"""
Patient context for the voice AI doctor.

Collects the patient's records from every collection into one compact,
JSON-serialisable dict. It is sent to the LiveKit agent as dispatch metadata
and rendered there into the "patient chart" section of the system prompt.

Each section is capped (item counts and string lengths) so the payload stays
small, and every query is best-effort: a failure in one collection only
drops that section.
"""

import logging
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from database.connection import db, get_user_by_email
from services.ml_service import get_evidence_label

logger = logging.getLogger(__name__)

MAX_PREDICTIONS = 5
MAX_CONSULTATIONS = 3
MAX_REPORTS = 3
MAX_MEDICATIONS = 15
MAX_JOURNAL = 5
MAX_APPOINTMENTS = 4
MAX_FAMILY = 10
ADHERENCE_WINDOW_DAYS = 14
JOURNAL_WINDOW_DAYS = 30


def _clip(value: Any, max_len: int = 200) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return text[:max_len] + "…" if len(text) > max_len else text


def _clip_list(items: Any, max_items: int = 8, max_len: int = 120) -> List[str]:
    if not isinstance(items, list):
        return []
    return [c for c in (_clip(x, max_len) for x in items[:max_items]) if c]


def _date(value: Any) -> str:
    """YYYY-MM-DD from a datetime or ISO string."""
    if isinstance(value, datetime):
        return value.date().isoformat()
    return _clip(value, 10)


def _bmi(height: Any, weight: Any) -> Optional[float]:
    try:
        h_m = float(height) / 100
        w = float(weight)
        return round(w / (h_m * h_m), 1) if h_m > 0 and w > 0 else None
    except (TypeError, ValueError):
        return None


def _patient_profile(user: Dict[str, Any]) -> Dict[str, Any]:
    # Signup stores first/last name; a profile edit may later set `name`
    name = user.get("name") or " ".join(
        p for p in (user.get("first_name"), user.get("last_name")) if p
    )
    location = ", ".join(p for p in (user.get("city"), user.get("state")) if p)
    profile = {
        "name": _clip(name, 100),
        "age": user.get("age"),
        "gender": _clip(user.get("gender"), 30),
        "location": _clip(location, 100),
        "height": _clip(user.get("height"), 20),
        "weight": _clip(user.get("weight"), 20),
        # Profile form saves blood pressure as `pressure`
        "blood_pressure": _clip(user.get("pressure") or user.get("blood_pressure"), 20),
        "bmi": user.get("bmi") or _bmi(user.get("height"), user.get("weight")),
        "blood_type": _clip(user.get("blood_type"), 10),
        "allergies": _clip(user.get("allergies"), 300),
        "existing_conditions": _clip(user.get("existing_conditions"), 400),
        "current_medications": _clip(user.get("current_medications"), 400),
        "language": user.get("language") or "en",
    }
    return {k: v for k, v in profile.items() if v not in (None, "")}


def _prediction_entry(p: Dict[str, Any]) -> Dict[str, Any]:
    # Predictions store DDXPlus evidence codes; translate them for the doctor
    symptoms = [
        get_evidence_label(token)
        for token in (p.get("evidences") or [])[:10]
        if isinstance(token, str)
    ]
    differential = [
        f"{d.get('pathology')} ({round(float(d.get('probability', 0)) * 100)}%)"
        for d in (p.get("differential") or [])[:3]
        if isinstance(d, dict) and d.get("pathology")
    ]
    probability = p.get("ml_probability")
    return {
        "date": _date(p.get("created_at")),
        "disease": _clip(p.get("ml_prediction"), 100),
        "probability": round(float(probability) * 100) if probability is not None else None,
        "icd10": _clip(p.get("ml_icd10"), 20),
        "differential": differential,
        # Older records stored free-text symptoms
        "symptoms": _clip_list(symptoms or p.get("symptoms"), 10, 120),
    }


def _consultation_entry(c: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    summary = c.get("summary")
    if not isinstance(summary, dict) or summary.get("error"):
        return None
    actions = Counter(
        a.get("type") for a in (c.get("actions") or []) if isinstance(a, dict) and a.get("type")
    )
    duration = c.get("duration_seconds")
    return {
        "date": _date(c.get("ended_at") or c.get("started_at")),
        "duration_min": round(duration / 60) if isinstance(duration, (int, float)) else None,
        "chief_complaint": _clip(summary.get("chief_complaint"), 200),
        "summary": _clip(summary.get("summary"), 400),
        "symptoms": _clip_list(summary.get("symptoms_mentioned"), 8, 80),
        "conditions_discussed": _clip_list(summary.get("conditions_discussed"), 5, 100),
        "recommendations": _clip_list(summary.get("recommendations"), 5, 160),
        "red_flags": _clip_list(summary.get("red_flags"), 5, 160),
        "follow_up_advised": _clip(summary.get("follow_up_advised"), 200),
        "actions_taken": dict(actions),
    }


def _report_entry(f: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    analysis = f.get("analysis")
    if not isinstance(analysis, dict):
        return None
    entry = {
        "date": _date(f.get("uploaded_at")),
        "file": _clip(f.get("filename"), 80),
        "summary": _clip(analysis.get("summary"), 400),
        "abnormal_values": _clip_list(analysis.get("abnormal_values"), 8, 120),
        "risk_level": _clip(analysis.get("risk_level"), 40),
    }
    return entry if entry["summary"] or entry["abnormal_values"] else None


async def _safe(label: str, coro):
    try:
        return await coro
    except Exception as e:
        logger.warning("Patient context: failed to load %s: %s", label, e)
        return None


async def gather_patient_context(email: str) -> Dict[str, Any]:
    """Collect the patient's records for the voice AI doctor."""
    context: Dict[str, Any] = {
        "today": datetime.now(timezone.utc).date().isoformat(),
    }

    user = await _safe("profile", get_user_by_email(email))
    if user:
        context["patient"] = _patient_profile(user)

    preds = await _safe(
        "predictions",
        db.predictions.find({"email": email}).sort("created_at", -1).limit(MAX_PREDICTIONS).to_list(MAX_PREDICTIONS),
    )
    if preds:
        context["recent_diagnoses"] = [_prediction_entry(p) for p in preds]

    # Only finished calls: the consultation being started now is still "ongoing"
    consults = await _safe(
        "consultations",
        db.consultations.find({"email": email, "status": "completed"}).sort("ended_at", -1).limit(MAX_CONSULTATIONS).to_list(MAX_CONSULTATIONS),
    )
    entries = [e for e in (_consultation_entry(c) for c in consults or []) if e]
    if entries:
        context["past_consultations"] = entries

    files = await _safe(
        "lab reports",
        db.files.find({"email": email, "analyzed": True}).sort("uploaded_at", -1).limit(MAX_REPORTS).to_list(MAX_REPORTS),
    )
    reports = [e for e in (_report_entry(f) for f in files or []) if e]
    if reports:
        context["lab_reports"] = reports

    meds = await _safe(
        "medications",
        db.medications.find({"email": email, "active": True}).to_list(MAX_MEDICATIONS),
    )
    if meds:
        context["active_medications"] = [
            {
                "name": _clip(m.get("name"), 80),
                "dosage": _clip(m.get("dosage"), 40),
                "frequency": _clip(m.get("frequency"), 40),
            }
            for m in meds
        ]

    since = datetime.now(timezone.utc) - timedelta(days=ADHERENCE_WINDOW_DAYS)
    logs = await _safe(
        "medication logs",
        db.medication_logs.find({"email": email, "logged_at": {"$gte": since.replace(tzinfo=None)}}).to_list(500),
    )
    if logs:
        adherence: Dict[str, Dict[str, int]] = {}
        for log in logs:
            name = _clip(log.get("medication_name"), 80) or "Unknown"
            stats = adherence.setdefault(name, {"taken": 0, "skipped": 0})
            stats["skipped" if log.get("skipped") else "taken"] += 1
        context["medication_adherence"] = {
            "window_days": ADHERENCE_WINDOW_DAYS,
            "by_medication": dict(list(adherence.items())[:MAX_MEDICATIONS]),
        }

    journal_since = (datetime.now(timezone.utc) - timedelta(days=JOURNAL_WINDOW_DAYS)).replace(tzinfo=None)
    journals = await _safe(
        "journal",
        db.journal_entries.find({"email": email, "created_at": {"$gte": journal_since}})
        .sort("created_at", -1).limit(MAX_JOURNAL).to_list(MAX_JOURNAL),
    )
    if journals:
        context["recent_journal"] = [
            {
                "date": _date(j.get("created_at")),
                "title": _clip(j.get("title"), 100),
                "mood": _clip(j.get("mood"), 30),
                "pain_level": j.get("pain_level"),
                "symptoms": _clip_list(j.get("symptoms"), 8, 60),
            }
            for j in journals
        ]

    appts = await _safe(
        "appointments",
        db.appointments.find({"user_email": email, "status": {"$ne": "cancelled"}})
        .sort("date", -1).limit(MAX_APPOINTMENTS).to_list(MAX_APPOINTMENTS),
    )
    if appts:
        context["recent_appointments"] = [
            {
                "doctor": _clip(a.get("doctorName") or a.get("doctor_name"), 100),
                "specialization": _clip(a.get("doctorSpecialization"), 80),
                "date": _clip(a.get("date"), 20),
                "time": _clip(a.get("time"), 20),
                "status": _clip(a.get("status"), 30),
            }
            for a in appts
        ]

    family = await _safe("family", db.family_profiles.find({"owner_email": email}).to_list(MAX_FAMILY))
    if family:
        # Only the relationship and conditions: names of relatives aren't needed
        context["family_history"] = [
            {
                "relationship": _clip(f.get("relationship"), 30),
                "conditions": _clip_list(f.get("conditions"), 8, 80),
            }
            for f in family
            if f.get("conditions")
        ]
        if not context["family_history"]:
            del context["family_history"]

    return context
