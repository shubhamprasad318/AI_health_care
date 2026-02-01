"""
Gemini AI Integration Service - 2026 SDK
Uses the new google.genai Client-based architecture
"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
import json

logger = logging.getLogger(__name__)

# Global Gemini client
gemini_client = None

# ============================================
# 📋 MODEL CONFIGURATION
# ============================================
GEMINI_MODELS = [               
    'gemini-2.5-flash-lite-preview-09-2025', 
    'gemini-3-flash-preview',
    'gemini-2.5-flash-preview-09-2025',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
]

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
        gemini_client = genai.Client(api_key=api_key)
        logger.info("✅ Gemini AI initialized with 2026 SDK (google-genai)")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize Gemini: {e}")
        return False

def is_gemini_available() -> bool:
    return gemini_client is not None

# ============================================
# 🔄 CORE API CALL (Robust Fallback)
# ============================================

async def call_gemini(prompt: str, config: Optional[Dict] = None) -> str:
    if not gemini_client:
        raise Exception("Gemini client not initialized")
    
    try:
        from google.genai import types
        # Increase token limit for detailed health plans
        generation_config = config or types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=4000, 
        )
        
        last_error = None

        for model_name in GEMINI_MODELS:
            try:
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=generation_config
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                last_error = e
                # Don't retry on Auth errors
                if "401" in str(e) or "API key" in str(e): raise e
                continue

        logger.error("❌ All Gemini models failed.")
        if last_error: raise last_error
        return ""
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise

# ============================================
# 🤖 ML PREDICTION ENHANCEMENT (Pro Prompt)
# ============================================

async def get_gemini_enhanced_prediction(
    prediction: str, symptoms: List[str], description: str, precautions: List[str], specialize: str,
    user_age: Optional[int] = None, user_gender: Optional[str] = None
) -> Dict[str, Any]:
    if not gemini_client: return {"enhanced": False, "ml_prediction": prediction, "ml_description": description}
    try:
        context_str = f"Age: {user_age}, Gender: {user_gender}" if user_age else "Demographics not provided"
        
        # PROMPT: Clinical Consultant Persona
        prompt = f"""
        Act as a Senior Clinical Consultant. 
        A machine learning model has flagged the following provisional diagnosis. Provide a detailed clinical assessment.

        **Patient Profile:** {context_str}
        **Reported Symptoms:** {', '.join(symptoms)}
        **ML Prediction:** {prediction}

        Please analyze and output the following in structured Markdown:
        
        ### 🩺 Clinical Explanation
        (Explain the pathology of {prediction} in clear, non-alarmist language suitable for a patient.)

        ### 🔍 Symptom Correlation
        (Explain WHY the patient is feeling {', '.join(symptoms)} based on this condition.)

        ### ⚠️ Red Flags (Immediate Action)
        (List specific scenarios where they must go to the ER immediately.)

        ### 📅 Recovery Trajectory
        (What does the next 7-14 days look like? What is the expected prognosis?)

        ### ❓ Doctor Discussion Guide
        (3-5 high-value questions to ask the {specialize} to ensure they get the best care.)

        **Disclaimer:** Educational aid only. Not a substitute for professional diagnosis.
        """

        response_text = await call_gemini(prompt)
        return {
            "enhanced": True,
            "ml_prediction": prediction,
            "ml_description": description,
            "ml_precautions": precautions,
            "ml_specialist": specialize,
            "gemini_analysis": response_text,
            "generated_at": datetime.utcnow().isoformat()
        } if response_text else {"enhanced": False, "ml_prediction": prediction, "ml_description": description}
    except Exception as e:
        return {"enhanced": False, "error": str(e), "ml_prediction": prediction, "ml_description": description}

# ============================================
# 💬 HEALTH CHAT (Empathy + Safety)
# ============================================

async def gemini_health_chat(message: str, context: Optional[Dict] = None) -> str:
    if not gemini_client: return "AI Chat unavailable."
    try:
        context_str = ""
        if context:
            if context.get("recent_prediction"): context_str += f"\n- Recent AI Prediction: {context['recent_prediction']}"
            if context.get("user_age"): context_str += f"\n- Patient Age: {context['user_age']}"
        
        # PROMPT: Empathetic Guide Persona
        prompt = f"""
        You are 'AI Health Assistant', a compassionate and knowledgeable medical guide.
        
        **Patient Context:** {context_str if context_str else "New User"}
        **User Query:** "{message}"

        **Guidelines:**
        1. Be empathetic but professional.
        2. If the user mentions severe pain, chest pressure, or difficulty breathing, IMMEDIATELY tell them to call emergency services.
        3. Keep answers concise (max 3 paragraphs) unless asked for details.
        4. Use bullet points for clarity.
        """
        return await call_gemini(prompt)
    except Exception: return "I'm having trouble processing that. Please try again."

async def gemini_chat_stream(message: str, context: Optional[Dict] = None):
    """Streaming Version of the Chat"""
    if not gemini_client:
        yield "AI Service Unavailable"
        return
    try:
        from google.genai import types
        context_str = f"Patient Age: {context.get('user_age', 'Unknown')}" if context else ""
        prompt = f"You are a medical AI. {context_str}\nUser: {message}\nProvide helpful, safe medical guidance."
        
        for chunk in gemini_client.models.generate_content_stream(
            model=GEMINI_MODELS[0], contents=prompt, config=types.GenerateContentConfig(temperature=0.7)
        ):
            if chunk.text: yield chunk.text
    except Exception: yield "Error generating response."

# ============================================
# 📋 HYBRID HEALTH PLAN (The Masterpiece)
# ============================================

async def gemini_personalized_health_plan(
    condition: str,
    user_profile: Dict[str, Any],
    report_analysis: Optional[Dict[str, Any]] = None 
) -> Dict[str, Any]:
    """
    Generates a 'Hybrid' plan by synthesizing:
    1. The ML Disease Prediction (Condition)
    2. The PDF Report Data (Blood work, etc.)
    3. User Demographics
    """
    if not gemini_client: return {"error": "Health plan unavailable"}
    
    try:
        # 1. Format User Data
        profile_str = f"{user_profile.get('age', '?')}yo {user_profile.get('gender', 'Patient')}, {user_profile.get('weight', '?')}kg"
        
        # 2. Format Report Data (The 'Hard Evidence')
        report_str = "No specific lab reports available."
        if report_analysis:
            metrics = report_analysis.get("health_metrics", {})
            # Convert dict to clean string list safely
            if isinstance(metrics, dict):
                metric_list = [f"{k}: {v}" for k, v in metrics.items() if v]
                report_str = f"""
                **LAB REPORT FINDINGS:**
                - Report Type: {report_analysis.get('report_type', 'General')}
                - Critical Metrics: {', '.join(metric_list) if metric_list else 'None extracted'}
                - Key Observations: {', '.join(report_analysis.get('key_findings', []))}
                """

        # 3. The 'Master' Prompt - Chief Medical Officer Persona
        prompt = f"""
        Act as a Chief Medical Officer creating a Personalized Care Plan.
        
        ### 🏥 CASE FILE
        * **Patient:** {profile_str}
        * **Primary Concern (Predicted):** {condition}
        * **Clinical Evidence:**
        {report_str}

        ### 🎯 OBJECTIVE
        Synthesize the predicted condition with the lab evidence. 
        *IF* the lab report shows specific issues (e.g., High Cholesterol), prioritize diet/lifestyle for that *even if* the predicted condition is different.
        
        ### 📝 4-WEEK ACTION PLAN (Output in Markdown)

        ### 🗓️ Phase 1: Stabilization (Week 1)
        * **Focus:** Immediate symptom relief and metric control.
        * **Daily Routine:** Specific wake/sleep and activity guidance.
        * **Dietary Shift:** 3 foods to ADD and 3 foods to REMOVE immediately.

        ### 🏃 Phase 2: Activation (Weeks 2-3)
        * **Movement:** Safe exercise protocol considering {profile_str}.
        * **Habit Stacking:** One mental health practice + one physical habit.

        ### 🏆 Phase 3: Maintenance (Week 4)
        * **Long-term Strategy:** How to prevent recurrence.
        * **Re-testing:** Specifically which lab tests (from the evidence list) need re-checking.

        ### 🥗 Nutritional Micro-Strategy
        * **Macronutrient Goal:** (e.g., High Protein/Low Carb or Balanced)
        * **Hydration:** Specific target in Liters.

        ⚠️ **Disclaimer:** This plan is AI-generated for wellness support. Consult your physician before changing medications.
        """

        response_text = await call_gemini(prompt)
        
        return {
            "plan": response_text,
            "condition": condition,
            "generated_at": datetime.utcnow().isoformat(),
            "duration": "4 weeks",
            "source": "Hybrid (ML + Report Analysis)"
        } if response_text else {"error": "Plan generation failed"}
            
    except Exception as e:
        logger.error(f"Health plan error: {e}")
        return {"error": str(e)}

# ============================================
# 📄 REPORT ANALYSIS (Strict JSON)
# ============================================

async def _analyze_media_content(content_parts: list, prompt: str) -> Dict[str, Any]:
    """Helper to handle model fallback and JSON cleaning"""
    response_text = ""
    for model_name in GEMINI_MODELS:
        try:
            response = gemini_client.models.generate_content(
                model=model_name, contents=[*content_parts, prompt]
            )
            if hasattr(response, 'text'):
                response_text = str(response.text)
                if response_text: break
        except Exception: continue

    if not response_text: return {"success": False, "error": "Analysis failed"}

    # Clean JSON markdown
    clean_text = response_text.replace("```json", "").replace("```", "").strip()
    
    try:
        return {"success": True, "analysis": json.loads(clean_text)}
    except json.JSONDecodeError:
        # Fallback if AI fails to give strict JSON
        return {"success": True, "analysis": {"summary": clean_text, "health_metrics": {}}}

async def analyze_pdf_report(file_path: str) -> Dict[str, Any]:
    if not gemini_client: return {"success": False, "error": "Gemini unavailable"}
    try:
        from google.genai import types
        file_bytes = Path(file_path).read_bytes()
        pdf_content = types.Part.from_bytes(data=file_bytes, mime_type='application/pdf')
        
        # PROMPT: Strict JSON extractor
        prompt = """
        Analyze this medical report. Extract data into this STRICT JSON format:
        {
          "report_type": "string (e.g. Lipid Profile, CBC)",
          "summary": "2 sentence summary of health status",
          "health_metrics": {
            "Test Name 1": "Value Unit (e.g. 180 mg/dL)",
            "Test Name 2": "Value Unit"
          },
          "key_findings": ["Finding 1", "Finding 2"],
          "risk_level": "Low/Medium/High",
          "recommendations": ["Rec 1", "Rec 2"]
        }
        RULES:
        1. 'health_metrics' values MUST be simple strings. No nested objects.
        2. If a value is not found, do not invent it.
        """
        return await _analyze_media_content([pdf_content], prompt)
    except Exception as e: return {"success": False, "error": str(e)}

async def analyze_image_report(file_path: str) -> Dict[str, Any]:
    if not gemini_client: return {"success": False, "error": "Gemini unavailable"}
    try:
        from google.genai import types
        fpath = Path(file_path)
        mime = 'image/png' if fpath.suffix == '.png' else 'image/jpeg'
        file_bytes = fpath.read_bytes()
        img_content = types.Part.from_bytes(data=file_bytes, mime_type=mime)
        
        prompt = """
        Analyze this medical image/report. Extract data into STRICT JSON:
        {
          "report_type": "string",
          "summary": "string",
          "health_metrics": { "Parameter": "Value" },
          "key_findings": ["string"],
          "risk_level": "string"
        }
        """
        return await _analyze_media_content([img_content], prompt)
    except Exception as e: return {"success": False, "error": str(e)}

# ============================================
# 🔄 UNIFIED PROCESSOR
# ============================================
async def process_medical_report(file_path: str, content_type: str) -> Dict[str, Any]:
    try:
        if content_type == "application/pdf":
            return await analyze_pdf_report(file_path)
        elif content_type.startswith("image/"):
            return await analyze_image_report(file_path)
        return {"success": False, "error": "Unsupported file"}
    except Exception as e:
        logger.error(f"Processing error: {e}")
        return {"success": False, "error": str(e)}

# ============================================
# 🩺 EXTRAS (Symptom & Drug)
# ============================================

async def gemini_symptom_checker(symptoms_text: str) -> Dict[str, Any]:
    if not gemini_client: return {"error": "Unavailable"}
    try:
        # PROMPT: Triage Nurse
        prompt = f"""
        Act as a Triage Nurse. Analyze symptoms: "{symptoms_text}"
        
        Output Markdown:
        ### 🚨 Triage Level
        (Emergency / Urgent Care / Routine / Self-care)
        
        ### 📋 Assessment
        (Potential causes ordered by likelihood)
        
        ### 👣 Next Steps
        (Clear action items)
        """
        response = await call_gemini(prompt)
        return {"analysis": response}
    except Exception: return {"error": "Failed"}

async def gemini_drug_interaction_checker(medications: List[str]) -> str:
    if not gemini_client: return "Unavailable"
    try:
        # PROMPT: Pharmacist
        prompt = f"""
        Pharmacist Review for: {', '.join(medications)}
        
        Output Markdown:
        ### ⚠️ Interaction Status
        (Severe / Moderate / Minor / None)
        
        ### 💊 Mechanism
        (Why they interact)
        
        ### 🛡️ Safety Advice
        (What the patient should do)
        """
        return await call_gemini(prompt)
    except Exception: return "Failed"

async def gemini_explain_medical_term(term: str) -> str:
    if not gemini_client: return "Unavailable"
    try:
        return await call_gemini(f"Explain medical term '{term}' to a 12-year-old using an analogy.")
    except Exception: return "Failed"
