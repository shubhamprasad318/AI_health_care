"""
Disease Prediction Routes
"""

from fastapi import APIRouter, HTTPException, Request
from database.models import SymptomPredictionRequest
from services.ml_service import predict_disease
from services.gemini_service import get_gemini_enhanced_prediction
from utils.helpers import standard_response
from utils.validators import validate_symptoms
from utils.security import get_current_user
from database.connection import db, get_user_by_email
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post("/disease")
async def predict_disease_endpoint(
    request: Request, symptoms: SymptomPredictionRequest
):
    """Disease prediction with ML ensemble + Gemini clinical analysis"""
    try:
        symptom_list = validate_symptoms(symptoms.symptoms)

        if not symptom_list:
            raise HTTPException(status_code=400, detail="No valid symptoms provided")

        logger.info(f"[ANALYZE] Symptoms: {symptom_list}")

        prediction, description, precautions, specialist = await predict_disease(
            symptom_list
        )

        email = await get_current_user(request)

        user_age = None
        user_gender = None
        if email:
            user_data = await get_user_by_email(email)
            if user_data:
                user_age = user_data.get("age")
                user_gender = user_data.get("gender")

        enhanced_result = await get_gemini_enhanced_prediction(
            prediction=prediction,
            symptoms=symptom_list,
            description=description,
            precautions=precautions,
            specialize=specialist,
            user_age=user_age,
            user_gender=user_gender,
        )

        gemini_analysis = enhanced_result.get("gemini_analysis", "")

        if email:
            try:
                await db.predictions.insert_one(
                    {
                        "email": email,
                        "symptoms": symptom_list,
                        "ml_prediction": prediction,
                        "specialist": specialist,
                        "enhanced": enhanced_result.get("enhanced", False),
                        "created_at": datetime.utcnow(),
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to store prediction: {e}")

        response_data = {
            "ml_prediction": prediction,
            "ml_description": description,
            "ml_precautions": precautions,
            "ml_specialist": specialist,
            "symptoms_analyzed": symptom_list,
            "gemini_enhanced": enhanced_result.get("enhanced", False),
            "gemini_analysis": gemini_analysis,
            "generated_at": enhanced_result.get(
                "generated_at", datetime.utcnow().isoformat()
            ),
        }

        logger.info(
            f"[PREDICT] Final: {prediction}, Enhanced: {enhanced_result.get('enhanced', False)}"
        )

        return standard_response(
            message="Disease prediction completed", data=response_data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[PREDICT] Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="Prediction failed. Please try again."
        )
