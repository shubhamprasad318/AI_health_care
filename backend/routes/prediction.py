"""Disease Prediction Routes (DDXPlus model)."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Request

from database.connection import db, get_user_by_email
from database.models import SymptomPredictionRequest
from services.gemini_service import get_gemini_enhanced_prediction
from services.ml_service import (
    get_available_evidences,
    get_evidence_label,
    predict_disease,
)
from services.red_flags import assess_red_flags
from utils.helpers import standard_response
from utils.security import require_auth

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.get("/evidences")
async def list_evidences(
    request: Request, language: str = Query("en", pattern="^(en|fr)$")
):
    await require_auth(request)
    catalog = get_available_evidences(language=language)
    return standard_response(
        message="Evidence catalog",
        data={
            "count": len(catalog),
            "language": language,
            "evidences": catalog,
        },
    )


@router.post("/disease")
@router.post("/enhanced")
async def predict_disease_endpoint(
    request: Request, payload: SymptomPredictionRequest
):
    """Differential disease prediction backed by the DDXPlus LightGBM
    model, with optional Gemini clinical analysis (auth required)."""
    email = await require_auth(request)

    if not payload.evidences:
        raise HTTPException(status_code=400, detail="No evidences provided")

    try:
        age = payload.age
        sex = payload.sex.upper() if payload.sex else None
        user_data = await get_user_by_email(email)
        if user_data:
            if age is None:
                try:
                    age = int(user_data.get("age"))
                except (TypeError, ValueError):
                    age = None
            if not sex:
                gender = (user_data.get("gender") or "").strip().upper()
                if gender.startswith("F"):
                    sex = "F"
                elif gender.startswith("M"):
                    sex = "M"

        logger.info(
            "[ANALYZE] evidences=%d, age=%s, sex=%s, top_k=%d",
            len(payload.evidences),
            age,
            sex,
            payload.top_k,
        )

        differential = await predict_disease(
            evidences=payload.evidences,
            age=age,
            sex=sex,
            top_k=payload.top_k,
        )
        if not differential:
            raise HTTPException(status_code=500, detail="No prediction returned")

        primary = differential[0]
        human_evidences = [get_evidence_label(t) for t in payload.evidences if t]
        # Warning signs (rule-based) and likely life-threatening conditions
        red_flags = assess_red_flags(payload.evidences, differential)
        if red_flags:
            logger.info(
                "[TRIAGE] level=%s, reasons=%d",
                red_flags["level"],
                len(red_flags["reasons"]),
            )

        use_gemini = request.url.path.endswith("/enhanced")
        if use_gemini:
            enhanced_result = await get_gemini_enhanced_prediction(
                prediction=primary["pathology"],
                symptoms=human_evidences,
                specialize="Physician",
                user_age=age,
                user_gender="Female" if sex == "F" else "Male" if sex == "M" else None,
                red_flags=red_flags,
            )
        else:
            enhanced_result = {"enhanced": False, "gemini_analysis": ""}
        gemini_analysis = enhanced_result.get("gemini_analysis", "")

        try:
            await db.predictions.insert_one(
                {
                    "email": email,
                    "evidences": payload.evidences,
                    "age": age,
                    "sex": sex,
                    "ml_prediction": primary["pathology"],
                    "ml_probability": primary["probability"],
                    "ml_icd10": primary.get("icd10"),
                    "differential": differential,
                    "red_flags": red_flags,
                    "enhanced": enhanced_result.get("enhanced", False),
                    "created_at": datetime.now(timezone.utc),
                }
            )
        except Exception as e:
            logger.warning("Failed to store prediction: %s", e)

        return standard_response(
            message="Disease prediction completed",
            data={
                "ml_prediction": primary["pathology"],
                "ml_probability": primary["probability"],
                "ml_icd10": primary.get("icd10"),
                "differential_diagnosis": differential,
                "red_flags": red_flags,
                "evidences_analyzed": human_evidences,
                "gemini_enhanced": enhanced_result.get("enhanced", False),
                "gemini_analysis": gemini_analysis,
                "generated_at": enhanced_result.get(
                    "generated_at", datetime.now(timezone.utc).isoformat()
                ),
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("[PREDICT] Error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500, detail="Prediction failed. Please try again."
        )
