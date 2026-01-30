"""
Gemini AI Routes - Updated for 2026 SDK
"""
from fastapi import APIRouter, HTTPException, Request, Form
from fastapi.responses import StreamingResponse
from database.models import ChatRequest, DrugInteractionRequest, SymptomAnalysisRequest
from services.gemini_service import (
    gemini_health_chat,
    gemini_explain_medical_term,
    gemini_symptom_checker,
    gemini_drug_interaction_checker,
    gemini_personalized_health_plan,
    gemini_chat_stream,
    is_gemini_available
)
from database.connection import db
from utils.security import require_auth, get_current_user
from utils.helpers import standard_response
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/gemini", tags=["Gemini AI"])


@router.post("/chat")
async def health_chatbot(chat: ChatRequest, request: Request):
    """Interactive health chatbot"""
    if not is_gemini_available():
        raise HTTPException(status_code=503, detail="Gemini unavailable")
    
    try:
        context = chat.context or {}
        email = await get_current_user(request)
        
        # Add user context
        if email:
            user_data = await db.store.find_one({"email": email})
            if user_data:
                context["user_age"] = user_data.get("age")
                context["user_gender"] = user_data.get("gender")
            
            # Get recent prediction
            recent = await db.predictions.find_one(
                {"email": email},
                sort=[("created_at", -1)]
            )
            if recent:
                context["recent_prediction"] = recent.get("ml_prediction")
        
        response_text = await gemini_health_chat(chat.message, context)
        
        # Store chat history
        if email:
            try:
                await db.chat_history.insert_one({
                    "email": email,
                    "message": chat.message,
                    "response": response_text,
                    "created_at": datetime.utcnow()
                })
            except:
                pass
        
        return standard_response(
            message="Chat response generated",
            data={
                "response": response_text,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat failed")


@router.post("/chat/stream")
async def health_chatbot_stream(chat: ChatRequest, request: Request):
    """Streaming chatbot - NEW 2026 SDK feature"""
    if not is_gemini_available():
        raise HTTPException(status_code=503, detail="Gemini unavailable")
    
    try:
        context = chat.context or {}
        email = await get_current_user(request)
        
        if email:
            user_data = await db.store.find_one({"email": email})
            if user_data:
                context["user_age"] = user_data.get("age")
        
        async def generate():
            async for chunk in gemini_chat_stream(chat.message, context):
                yield chunk
        
        return StreamingResponse(generate(), media_type="text/plain")
        
    except Exception as e:
        logger.error(f"Stream error: {e}")
        raise HTTPException(status_code=500, detail="Streaming failed")


@router.get("/medical/explain/{term}")
async def explain_medical_term(term: str):
    """Explain medical terminology"""
    if not is_gemini_available():
        raise HTTPException(status_code=503, detail="Gemini unavailable")
    
    explanation = await gemini_explain_medical_term(term)
    
    return standard_response(
        message=f"Explanation for '{term}'",
        data={
            "term": term,
            "explanation": explanation
        }
    )


@router.post("/symptom/analyze")
async def analyze_symptoms(request: SymptomAnalysisRequest):
    """Symptom analysis"""
    if not is_gemini_available():
        raise HTTPException(status_code=503, detail="Gemini unavailable")
    
    # ✅ Changed from symptoms_text to request.symptoms
    analysis = await gemini_symptom_checker(request.symptoms)
    return standard_response(message="Analysis completed", data=analysis)


@router.post("/drugs/interactions")
async def check_drug_interactions(drug_request: DrugInteractionRequest):
    """Drug interaction checker"""
    if not is_gemini_available():
        raise HTTPException(status_code=503, detail="Gemini unavailable")
    
    if len(drug_request.medications) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 medications")
    
    analysis = await gemini_drug_interaction_checker(drug_request.medications)
    
    return standard_response(
        message="Interaction analysis completed",
        data={
            "medications": drug_request.medications,
            "analysis": analysis
        }
    )


@router.post("/health/personalized-plan")
async def generate_health_plan(request: Request):
    """Generate health plan"""
    if not is_gemini_available():
        raise HTTPException(status_code=503, detail="Gemini unavailable")
    
    email = await require_auth(request)
    
    user_data = await db.store.find_one({"email": email})
    recent = await db.predictions.find_one(
        {"email": email},
        sort=[("created_at", -1)]
    )
    
    if not recent:
        raise HTTPException(
            status_code=404,
            detail="No recent diagnosis. Complete prediction first."
        )
    
    condition = recent.get("ml_prediction")
    user_profile = {
        "age": user_data.get("age"),
        "gender": user_data.get("gender"),
        "weight": user_data.get("weight"),
        "height": user_data.get("height")
    }
    
    health_plan = await gemini_personalized_health_plan(condition, user_profile)
    
    # Store plan
    try:
        await db.health_plans.insert_one({
            "email": email,
            "condition": condition,
            "plan": health_plan,
            "created_at": datetime.utcnow()
        })
    except:
        pass
    
    return standard_response(
        message="Health plan generated",
        data=health_plan
    )


@router.get("/status")
async def gemini_status():
    """Gemini status"""
    return standard_response(
        message="Gemini AI status",
        data={
            "enabled": is_gemini_available(),
            "sdk_version": "2026 (google-genai)",
            "model": "gemini-2.0-flash",
            "features": {
                "chat": is_gemini_available(),
                "streaming": is_gemini_available(),
                "medical_explanations": is_gemini_available(),
                "symptom_analysis": is_gemini_available(),
                "drug_interactions": is_gemini_available(),
                "health_plans": is_gemini_available()
            }
        }
    )
