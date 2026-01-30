"""
Gemini AI Integration Service - 2026 SDK
Uses the new google.genai Client-based architecture
"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
import json
import PyPDF2

logger = logging.getLogger(__name__)

# Global Gemini client
gemini_client = None


# ============================================
# 🔧 INITIALIZATION
# ============================================

def initialize_gemini(api_key: str) -> bool:
    """Initialize Gemini AI with the new 2026 SDK"""
    global gemini_client
    
    if not api_key:
        logger.warning("⚠️ GEMINI_API_KEY not found. Gemini features disabled.")
        return False
    
    try:
        from google import genai
        
        # Create centralized client (new SDK pattern)
        gemini_client = genai.Client(api_key=api_key)
        
        logger.info("✅ Gemini AI initialized with 2026 SDK (google-genai)")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize Gemini: {e}")
        return False


def is_gemini_available() -> bool:
    """Check if Gemini service is available"""
    return gemini_client is not None


# ============================================
# 🔄 CORE API CALL
# ============================================

async def call_gemini(prompt: str, config: Optional[Dict] = None) -> str:
    """
    Simplified Gemini API call
    Uses new SDK client.models.generate_content pattern
    """
    if not gemini_client:
        raise Exception("Gemini client not initialized")
    
    try:
        from google.genai import types
        
        # Default config
        generation_config = config or types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=2048,
        )
        
        # New SDK call pattern
        response = gemini_client.models.generate_content(
            model='gemini-3-flash-preview',  # ✅ Updated model
            contents=prompt,
            config=generation_config
        )
        
        return response.text if response and response.text else ""
        
    except Exception as e:
        error_str = str(e)
        
        # Handle quota errors gracefully
        if "429" in error_str or "quota" in error_str.lower():
            logger.warning("⚠️ Gemini quota exceeded")
            return ""
        
        logger.error(f"Gemini API error: {e}")
        raise


# ============================================
# 🤖 ML PREDICTION ENHANCEMENT
# ============================================

async def get_gemini_enhanced_prediction(
    prediction: str,
    symptoms: List[str],
    description: str,
    precautions: List[str],
    specialize: str,
    user_age: Optional[int] = None,
    user_gender: Optional[str] = None
) -> Dict[str, Any]:
    """Enhanced ML prediction with Gemini AI"""
    if not gemini_client:
        return {
            "enhanced": False,
            "message": "Gemini AI not available",
            "ml_prediction": prediction,
            "ml_description": description
        }
    
    try:
        # Build context
        context = []
        if user_age:
            context.append(f"Age: {user_age}")
        if user_gender:
            context.append(f"Gender: {user_gender}")
        
        context_str = ", ".join(context) if context else "Not specified"
        
        prompt = f"""You are a medical AI assistant. Provide a comprehensive analysis:

**Predicted Condition:** {prediction}
**Symptoms:** {', '.join(symptoms)}
**Specialist:** {specialize}
**Patient Context:** {context_str}

Provide:

## 1. Detailed Explanation
Explain the condition in simple terms (2-3 paragraphs)

## 2. Why These Symptoms?
Connect symptoms to the condition

## 3. Risk Factors
List common risk factors

## 4. When to Seek Immediate Care
Warning signs requiring immediate attention

## 5. Recovery Timeline
Expected progression and recovery

## 6. Questions for Your Doctor
5 important questions to discuss

**Disclaimer:** Educational purposes only. Consult healthcare professionals."""

        response_text = await call_gemini(prompt)
        
        if response_text:
            return {
                "enhanced": True,
                "ml_prediction": prediction,
                "ml_description": description,
                "ml_precautions": precautions,
                "ml_specialist": specialize,
                "gemini_analysis": response_text,
                "generated_at": datetime.utcnow().isoformat()
            }
        
        return {
            "enhanced": False,
            "ml_prediction": prediction,
            "ml_description": description
        }
            
    except Exception as e:
        logger.error(f"Gemini enhancement error: {e}")
        return {
            "enhanced": False,
            "error": str(e),
            "ml_prediction": prediction,
            "ml_description": description
        }


# ============================================
# 💬 HEALTH CHAT
# ============================================

async def gemini_health_chat(message: str, context: Optional[Dict] = None) -> str:
    """Interactive health chatbot"""
    if not gemini_client:
        return "Gemini AI chatbot is currently unavailable."
    
    try:
        # Build context string
        context_info = []
        if context:
            if context.get("recent_prediction"):
                context_info.append(f"Recent Diagnosis: {context['recent_prediction']}")
            if context.get("user_age"):
                context_info.append(f"Age: {context['user_age']}")
            if context.get("user_gender"):
                context_info.append(f"Gender: {context['user_gender']}")
        
        context_str = "\n".join(context_info) if context_info else "No context available"
        
        prompt = f"""You are a compassionate medical AI assistant.

**Patient Context:**
{context_str}

**Question:** {message}

Provide accurate, empathetic medical information in simple language. Always recommend consulting healthcare professionals. Keep response to 2-3 paragraphs."""

        response = await call_gemini(prompt)
        return response if response else "I'm having trouble generating a response. Please try again."
        
    except Exception as e:
        logger.error(f"Gemini chat error: {e}")
        return "I encountered an error. Please try again in a moment."


async def gemini_chat_stream(message: str, context: Optional[Dict] = None):
    """Streaming chat response - NEW 2026 SDK feature"""
    if not gemini_client:
        yield "Gemini AI unavailable"
        return
    
    try:
        from google.genai import types
        
        context_str = ""
        if context:
            if context.get("recent_prediction"):
                context_str += f"\nRecent Diagnosis: {context['recent_prediction']}"
        
        prompt = f"""You are a medical AI assistant.{context_str}

Patient Question: {message}

Provide helpful medical information in simple language."""

        # New SDK streaming pattern
        for chunk in gemini_client.models.generate_content_stream(
            model='gemini-3-flash-preview',
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.7)
        ):
            if chunk.text:
                yield chunk.text
                
    except Exception as e:
        logger.error(f"Streaming error: {e}")
        yield "Error generating response"


# ============================================
# 🩺 SYMPTOM ANALYSIS
# ============================================

async def gemini_symptom_checker(symptoms_text: str) -> Dict[str, Any]:
    """Gemini-powered symptom analysis"""
    if not gemini_client:
        return {"error": "Gemini symptom checker unavailable"}
    
    try:
        prompt = f"""Analyze these symptoms: {symptoms_text}

Provide:
1. **Symptom Clustering:** Group related symptoms
2. **Possible Conditions:** List 3-5 potential conditions
3. **Urgency Level:** Low, Medium, High, or Emergency
4. **Next Steps:** When to see a doctor
5. **Red Flags:** Warning signs

Educational purposes only - not a diagnosis."""

        response_text = await call_gemini(prompt)
        
        return {
            "analysis": response_text,
            "disclaimer": "This is an AI analysis. Consult healthcare professionals."
        } if response_text else {"error": "Unable to analyze symptoms"}
            
    except Exception as e:
        logger.error(f"Symptom checker error: {e}")
        return {"error": "Unable to analyze symptoms at this time"}


# ============================================
# 💊 DRUG INTERACTIONS
# ============================================

async def gemini_drug_interaction_checker(medications: List[str]) -> str:
    """Check drug interactions"""
    if not gemini_client:
        return "Drug interaction checker unavailable."
    
    try:
        meds_list = ", ".join(medications)
        prompt = f"""Analyze drug interactions for: {meds_list}

Provide:
1. **Interaction Level:** None, Minor, Moderate, Major, or Severe
2. **Specific Interactions:** Detail known interactions
3. **Side Effects:** Common side effects
4. **Recommendations:** General precautions
5. **Food/Drink Interactions:** Items to avoid

Always consult a pharmacist or doctor."""

        return await call_gemini(prompt)
        
    except Exception as e:
        logger.error(f"Drug interaction error: {e}")
        return "Unable to check drug interactions at this time."


# ============================================
# 📖 MEDICAL TERMS
# ============================================

async def gemini_explain_medical_term(term: str) -> str:
    """Explain medical terminology"""
    if not gemini_client:
        return f"Medical term: {term} (Explanation unavailable)"
    
    try:
        prompt = f"""Explain the medical term "{term}" in simple language.

Include:
1. Simple definition (1-2 sentences)
2. Why it matters in healthcare
3. Common usage contexts
4. Related terms

Keep it concise and patient-friendly (3-4 paragraphs max)."""

        return await call_gemini(prompt)
        
    except Exception as e:
        logger.error(f"Medical term error: {e}")
        return f"Unable to explain {term} at this time."


# ============================================
# 📋 HEALTH PLAN GENERATION
# ============================================

async def gemini_personalized_health_plan(
    condition: str,
    user_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate personalized health plan"""
    if not gemini_client:
        return {"error": "Health plan generator unavailable"}
    
    try:
        age = user_profile.get("age", "unknown")
        gender = user_profile.get("gender", "unknown")
        weight = user_profile.get("weight", "unknown")
        height = user_profile.get("height", "unknown")
        
        prompt = f"""Create a 4-week health management plan:

**Condition:** {condition}
**Age:** {age}, **Gender:** {gender}
**Weight:** {weight} kg, **Height:** {height} cm

Include:

## Week 1-4 Goals
Specific, measurable goals

## Daily Routine
Morning/afternoon/evening activities, exercise, sleep

## Nutrition Plan
Meal timing, foods to emphasize/avoid, hydration

## Monitoring Metrics
Daily tracking, warning signs

## Mental Health
Stress management, support resources

## Medical Follow-up
Check-up schedule, tests needed

Make it practical and achievable."""

        response_text = await call_gemini(prompt)
        
        return {
            "plan": response_text,
            "condition": condition,
            "generated_at": datetime.utcnow().isoformat(),
            "duration": "4 weeks",
            "note": "Review with your healthcare provider before starting"
        } if response_text else {"error": "Unable to generate health plan"}
            
    except Exception as e:
        logger.error(f"Health plan error: {e}")
        return {"error": str(e)}


# ============================================
# 📄 REPORT ANALYSIS - PDF
# ============================================
async def analyze_pdf_report(file_path: str) -> Dict[str, Any]:
    """Analyze PDF medical report directly using Gemini"""
    if not gemini_client:
        return {"success": False, "error": "Gemini service not available"}
    
    try:
        from google.genai import types
        
        filepath = Path(file_path)
        
        prompt = """
You are a medical report analyzer. Analyze this medical report PDF and extract key information.

Please provide:
1. Report Type (e.g., Blood Test, X-Ray, MRI, etc.)
2. Key Findings (list important results)
3. Abnormal Values (if any, with normal ranges)
4. Health Metrics (extract specific values like blood pressure, glucose, cholesterol, etc.)
5. Recommendations (if mentioned)
6. Risk Level (Low, Medium, High based on findings)
7. Summary (2-3 sentences)

Format as JSON:
{
  "report_type": "type",
  "date": "extracted date or null",
  "key_findings": ["finding1", "finding2"],
  "abnormal_values": [{"parameter": "name", "value": "X", "normal_range": "Y-Z", "status": "high/low"}],
  "health_metrics": {
    "blood_pressure": "120/80",
    "glucose": "95 mg/dL",
    "cholesterol": "180 mg/dL"
  },
  "recommendations": ["rec1", "rec2"],
  "risk_level": "Low/Medium/High",
  "summary": "Brief summary"
}
"""
        
        # Read PDF and send to Gemini
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash-lite-preview-09-2025',
            contents=[
                types.Part.from_bytes(
                    data=filepath.read_bytes(),
                    mime_type='application/pdf',
                ),
                prompt
            ]
        )
        
        # ✅ Extract text from response
        try:
            response_text = ""
            
            # New SDK returns response.text as property
            if hasattr(response, 'text'):
                text_value = response.text
                # Handle if it's a list
                if isinstance(text_value, list):
                    response_text = "".join(str(item) for item in text_value)
                else:
                    response_text = str(text_value)
            # Fallback to candidates
            elif hasattr(response, 'candidates') and response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                        for part in candidate.content.parts:
                            if hasattr(part, 'text'):
                                response_text += str(part.text)
            
            response_text = response_text.strip()
            
            if not response_text:
                logger.error(f"Empty response from Gemini")
                return {"success": False, "error": "Empty response from AI"}
            
            logger.info(f"Response received, length: {len(response_text)}")
            
            # ✅ Clean up markdown code blocks
            if "```json" in response_text:
                parts = response_text.split("```json")
                if len(parts) > 1:
                    response_text = parts[1].split("```")[0].strip()  # ✅ FIXED
            elif response_text.count("```") >= 2:
                parts = response_text.split("```")
                if len(parts) >= 3:
                    response_text = parts[1].strip()  # ✅ FIXED[1]
            
            # Parse JSON
            analysis = json.loads(response_text)
            
            logger.info(f"✅ PDF report analyzed successfully")
            return {
                "success": True,
                "analysis": analysis
            }
            
        except json.JSONDecodeError as je:
            logger.error(f"JSON parse error: {je}")
            logger.error(f"Response text (first 500 chars): {response_text[:500]}")
            return {
                "success": False,
                "error": "Failed to parse AI response as JSON"
            }
        
    except Exception as e:
        logger.error(f"PDF analysis error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


async def analyze_image_report(file_path: str) -> Dict[str, Any]:
    """Analyze image medical report using Gemini Vision"""
    if not gemini_client:
        return {"success": False, "error": "Gemini service not available"}
    
    try:
        from google.genai import types
        
        filepath = Path(file_path)
        
        prompt = """
You are a medical report analyzer. Analyze this medical report image and extract key information.

Please provide:
1. Report Type (e.g., Blood Test, X-Ray, MRI, etc.)
2. Key Findings (list important results)
3. Abnormal Values (if any, with normal ranges)
4. Health Metrics (extract specific values like blood pressure, glucose, cholesterol, etc.)
5. Recommendations (if mentioned)
6. Risk Level (Low, Medium, High based on findings)
7. Summary (2-3 sentences)

Format as JSON:
{
  "report_type": "type",
  "date": "extracted date or null",
  "key_findings": ["finding1", "finding2"],
  "abnormal_values": [{"parameter": "name", "value": "X", "normal_range": "Y-Z", "status": "high/low"}],
  "health_metrics": {
    "blood_pressure": "120/80",
    "glucose": "95 mg/dL"
  },
  "recommendations": ["rec1", "rec2"],
  "risk_level": "Low/Medium/High",
  "summary": "Brief summary"
}
"""
        
        # Determine MIME type
        suffix = filepath.suffix.lower()
        mime_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        mime_type = mime_types.get(suffix, 'image/jpeg')
        
        # Read image and send to Gemini
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash-lite-preview-09-2025',
            contents=[
                types.Part.from_bytes(
                    data=filepath.read_bytes(),
                    mime_type=mime_type,
                ),
                prompt
            ]
        )
        
        # ✅ Extract text from response
        try:
            response_text = ""
            
            # New SDK returns response.text as property
            if hasattr(response, 'text'):
                text_value = response.text
                # Handle if it's a list
                if isinstance(text_value, list):
                    response_text = "".join(str(item) for item in text_value)
                else:
                    response_text = str(text_value)
            # Fallback to candidates
            elif hasattr(response, 'candidates') and response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                        for part in candidate.content.parts:
                            if hasattr(part, 'text'):
                                response_text += str(part.text)
            
            response_text = response_text.strip()
            
            if not response_text:
                logger.error(f"Empty response from Gemini")
                return {"success": False, "error": "Empty response from AI"}
            
            logger.info(f"Response received, length: {len(response_text)}")
            
            # ✅ Clean up markdown code blocks
            if "```json" in response_text:
                parts = response_text.split("```json")
                if len(parts) > 1:
                    response_text = parts[1].split("```")[0].strip()  # ✅ FIXED
            elif response_text.count("```") >= 2:
                parts = response_text.split("```")
                if len(parts) >= 3:
                    response_text = parts[1].strip()  # ✅ FIXED
            
            # Parse JSON
            analysis = json.loads(response_text)
            
            logger.info(f"✅ Image report analyzed successfully")
            return {
                "success": True,
                "analysis": analysis
            }
            
        except json.JSONDecodeError as je:
            logger.error(f"JSON parse error: {je}")
            logger.error(f"Response text (first 500 chars): {response_text[:500]}")
            return {
                "success": False,
                "error": "Failed to parse AI response as JSON"
            }
        
    except Exception as e:
        logger.error(f"Image analysis error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


# ============================================
# 🔄 UNIFIED REPORT PROCESSOR
# ============================================

async def process_medical_report(file_path: str, content_type: str) -> Dict[str, Any]:
    """
    Main entry point for report analysis
    Routes to appropriate analyzer based on file type
    """
    try:
        # For PDFs
        if content_type == "application/pdf":
            logger.info(f"Processing PDF report: {file_path}")
            return await analyze_pdf_report(file_path)
        
        # For images
        elif content_type.startswith("image/"):
            logger.info(f"Processing image report: {file_path}")
            return await analyze_image_report(file_path)
        
        else:
            return {
                "success": False,
                "error": f"Unsupported file type: {content_type}"
            }
            
    except Exception as e:
        logger.error(f"Report processing error: {e}")
        return {
            "success": False,
            "error": str(e)
        }
