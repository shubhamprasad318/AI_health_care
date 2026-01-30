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
from database.connection import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post("/disease")
async def predict_disease_basic(request: Request, symptoms: SymptomPredictionRequest):
    """Basic disease prediction using ML models"""
    try:
        symptom_list = validate_symptoms(symptoms.symptoms)
        
        if not symptom_list:
            raise HTTPException(status_code=400, detail="No valid symptoms provided")
        
        logger.info(f"[ANALYZE] Symptoms: {symptom_list}")
        
        # Get ML prediction
        prediction, description, precautions, specialist = await predict_disease(symptom_list)
        
        # Store prediction
        email = await get_current_user(request)
        if email:
            try:
                await db.predictions.insert_one({
                    "email": email,
                    "symptoms": symptom_list,
                    "ml_prediction": prediction,
                    "specialist": specialist,
                    "created_at": datetime.utcnow()
                })
            except:
                pass
        
        return standard_response(
            message="Disease prediction completed",
            data={
                "prediction": prediction,
                "description": description,
                "precautions": precautions,
                "specialist": specialist,
                "symptoms_analyzed": symptom_list
            }
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")


@router.post("/enhanced")
async def predict_disease_enhanced(request: Request, symptoms: SymptomPredictionRequest):
    """AI-enhanced disease prediction with Gemini"""
    try:
        symptom_list = validate_symptoms(symptoms.symptoms)
        
        if not symptom_list:
            raise HTTPException(status_code=400, detail="No valid symptoms provided")
        
        logger.info(f"[ENHANCED] Analyzing symptoms: {symptom_list}")
        
        # Get ML prediction
        prediction, description, precautions, specialist = await predict_disease(symptom_list)
        
        logger.info(f"[ENHANCED] ML prediction: {prediction}, Specialist: {specialist}")
        
        # Get user context
        email = await get_current_user(request)
        user_age = None
        user_gender = None
        
        if email:
            user_data = await db.store.find_one({"email": email})
            if user_data:
                user_age = user_data.get("age")
                user_gender = user_data.get("gender")
        
        logger.info(f"[ENHANCED] User context: Age={user_age}, Gender={user_gender}")
        
        # Enhance with Gemini
        logger.info(f"[ENHANCED] Calling Gemini for {prediction}...")
        enhanced_result = await get_gemini_enhanced_prediction(
            prediction, symptom_list, description, precautions, specialist,
            user_age, user_gender
        )
        
        # ✅ ADD: Debug the Gemini response
        logger.info(f"[ENHANCED] Gemini response keys: {list(enhanced_result.keys())}")
        logger.info(f"[ENHANCED] Enhanced status: {enhanced_result.get('enhanced')}")
        
        gemini_analysis = enhanced_result.get('gemini_analysis', '')
        logger.info(f"[ENHANCED] Analysis length: {len(gemini_analysis)} characters")
        
        if gemini_analysis:
            logger.info(f"[ENHANCED] Analysis preview: {gemini_analysis[:150]}...")
        else:
            logger.warning(f"[ENHANCED] WARNING: Gemini analysis is EMPTY!")
        
        # Store prediction
        if email:
            try:
                await db.predictions.insert_one({
                    "email": email,
                    "symptoms": symptom_list,
                    "ml_prediction": prediction,
                    "specialist": specialist,
                    "enhanced": enhanced_result.get("enhanced", False),
                    "created_at": datetime.utcnow()
                })
            except:
                pass
        
        # ✅ IMPORTANT: Ensure consistent response structure
        response_data = {
            "ml_prediction": prediction,
            "ml_description": description,
            "ml_precautions": precautions,
            "ml_specialist": specialist,
            "symptoms_analyzed": symptom_list,
            "gemini_enhanced": enhanced_result.get("enhanced", False),
            "gemini_analysis": gemini_analysis,  # ✅ Explicitly include this
            "generated_at": enhanced_result.get("generated_at", datetime.utcnow().isoformat())
        }
        
        logger.info(f"[ENHANCED] Response data keys: {list(response_data.keys())}")
        logger.info(f"[ENHANCED] Sending response with analysis length: {len(response_data['gemini_analysis'])}")
        
        return standard_response(
            message="Enhanced prediction completed",
            data=response_data
        )
        
    except Exception as e:
        logger.error(f"[ENHANCED] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Enhanced prediction failed: {str(e)}")
