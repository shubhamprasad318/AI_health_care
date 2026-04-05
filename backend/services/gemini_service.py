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
    "gemini-2.5-flash",  # Stable 2.5 alias — best quality/speed tradeoff
    "gemini-2.0-flash",  # Proven stable fallback
    "gemini-2.0-flash-lite",  # Lightweight fallback
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


def _extract_text(response) -> str:
    """Extract text from response, skipping non-text parts (thought_signature, etc.)."""
    try:
        if response and response.candidates:
            parts = response.candidates[0].content.parts
            text_parts = [p.text for p in parts if hasattr(p, "text") and p.text]
            return "".join(text_parts)
    except (AttributeError, IndexError):
        pass
    try:
        if response and response.text:
            return response.text
    except Exception:
        pass
    return ""


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
                    model=model_name, contents=prompt, config=generation_config
                )
                if response:
                    text = _extract_text(response)
                    if text:
                        return text
            except Exception as e:
                last_error = e
                # Don't retry on Auth errors
                if "401" in str(e) or "API key" in str(e):
                    raise e
                continue

        logger.error("❌ All Gemini models failed.")
        if last_error:
            raise last_error
        return ""
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise


# ============================================
# 🤖 ML PREDICTION ENHANCEMENT (Pro Prompt)
# ============================================


async def get_gemini_enhanced_prediction(
    prediction: str,
    symptoms: List[str],
    description: str,
    precautions: List[str],
    specialize: str,
    user_age: Optional[int] = None,
    user_gender: Optional[str] = None,
) -> Dict[str, Any]:
    if not gemini_client:
        return {
            "enhanced": False,
            "ml_prediction": prediction,
            "ml_description": description,
        }
    try:
        context_str = ""
        if user_age:
            context_str += f"Age: {user_age} years"
        if user_gender:
            context_str += f", Sex: {user_gender}"
        if not context_str:
            context_str = "Demographics not provided — factor this uncertainty into your assessment"

        prompt = f"""You are a board-certified internal medicine physician reviewing a machine learning model's provisional diagnosis. Your role is to provide a rigorous, evidence-based clinical assessment that a patient can take to their doctor.

**PATIENT DEMOGRAPHICS:** {context_str}
**PRESENTING SYMPTOMS:** {", ".join(symptoms)}
**ML MODEL PREDICTION:** {prediction}

Provide your assessment in the following structure (Markdown format):

### Clinical Assessment of {prediction}

**What This Condition Is:**
Explain the pathophysiology of {prediction} in clear, accurate language. Include the organ systems involved, what goes wrong at a biological level, and how it manifests. Do NOT oversimplify to the point of inaccuracy. Do NOT use alarming language — be factual.

**Why These Symptoms Occur:**
For each reported symptom ({", ".join(symptoms)}), explain the specific pathophysiological mechanism connecting it to {prediction}. If a symptom does NOT typically correlate with this condition, explicitly state: "Note: [symptom] is not a classic presentation of {prediction} — this warrants discussion with your physician as it may indicate a co-existing condition or alternative diagnosis."

**Differential Diagnoses to Consider:**
List 2-4 alternative conditions that could explain this symptom cluster, ordered by clinical likelihood. For each, state: the condition name, the overlapping symptoms, and one distinguishing feature that differentiates it from {prediction}. This is critical — an ML model may misclassify, and the patient must be aware of alternatives.

**Red Flags — Seek Emergency Care Immediately If You Experience:**
List specific, measurable warning signs (e.g., "fever above 103°F / 39.4°C that does not respond to antipyretics within 2 hours", NOT vague statements like "if symptoms worsen"). Each red flag must be an actionable observation the patient can identify.

**Expected Clinical Course (Next 7-14 Days):**
Describe the typical trajectory — what improves first, what may linger, and realistic recovery timelines. Include: when symptoms should start improving with appropriate treatment, when to become concerned if no improvement, and any expected complications.

**Recommended Diagnostic Workup:**
List specific lab tests, imaging, or examinations the {specialize} should consider to confirm or rule out this diagnosis. For each test, briefly state what it checks for.

**Questions to Ask Your {specialize}:**
Provide 5 specific, high-value questions the patient should bring to their appointment. These should help differentiate the diagnosis, understand treatment options, and establish follow-up criteria.

---
⚕️ **Medical Disclaimer:** This analysis is generated by AI for educational and informational purposes only. It is NOT a diagnosis, NOT a treatment plan, and NOT a substitute for in-person medical evaluation. An ML model prediction has limited accuracy and must be confirmed through proper clinical examination, diagnostic testing, and physician judgment. Always consult a qualified healthcare provider before making any medical decisions."""

        response_text = await call_gemini(prompt)
        return (
            {
                "enhanced": True,
                "ml_prediction": prediction,
                "ml_description": description,
                "ml_precautions": precautions,
                "ml_specialist": specialize,
                "gemini_analysis": response_text,
                "generated_at": datetime.utcnow().isoformat(),
            }
            if response_text
            else {
                "enhanced": False,
                "ml_prediction": prediction,
                "ml_description": description,
            }
        )
    except Exception as e:
        return {
            "enhanced": False,
            "error": str(e),
            "ml_prediction": prediction,
            "ml_description": description,
        }


# ============================================
# 💬 HEALTH CHAT (Empathy + Safety)
# ============================================


async def gemini_health_chat(message: str, context: Optional[Dict] = None) -> str:
    if not gemini_client:
        return "AI Chat unavailable."
    try:
        context_str = ""
        if context:
            if context.get("recent_prediction"):
                context_str += (
                    f"\n- Recent AI Prediction: {context['recent_prediction']}"
                )
            if context.get("user_age"):
                context_str += f"\n- Patient Age: {context['user_age']}"
            if context.get("user_gender"):
                context_str += f"\n- Patient Sex: {context['user_gender']}"

        prompt = f"""You are a clinical health assistant on the AI Health Care Platform. You provide accurate, evidence-based medical information grounded in current clinical guidelines (WHO, CDC, NIH, NICE).

**YOUR RULES — NEVER VIOLATE THESE:**

1. **ACCURACY ABOVE ALL**: Never fabricate medical facts. If you are uncertain about a specific dosage, interaction, or recommendation, say "I'm not certain about this specific detail — please verify with your physician" rather than guessing.

2. **EMERGENCY DETECTION**: If the user describes ANY of the following, your FIRST response must be: "⚠️ This may be a medical emergency. Please call emergency services (112/911) immediately or go to your nearest emergency room."
   - Chest pain with shortness of breath, sweating, or arm/jaw radiation
   - Sudden severe headache ("worst headache of my life")
   - Signs of stroke (facial drooping, arm weakness, speech difficulty)
   - Difficulty breathing or choking
   - Severe allergic reaction (throat swelling, anaphylaxis)
   - Heavy uncontrolled bleeding
   - Suicidal thoughts or self-harm
   - Loss of consciousness
   - Severe abdominal pain with fever and rigidity
   - Sudden vision loss

3. **NEVER MINIMIZE**: Do not dismiss symptoms with phrases like "it's probably nothing" or "don't worry." Instead: "While this could be benign, it's important to have it evaluated because [specific reason]."

4. **DRUG SAFETY**: Never recommend specific prescription medications. For OTC medications, always include: dosage limits, contraindications, and when NOT to take them. Always ask about current medications and allergies before any recommendation.

5. **NO DIAGNOSIS**: You may discuss possible conditions based on symptoms, but always frame as: "Based on what you're describing, this could potentially be related to X, Y, or Z — but only a proper clinical examination can determine the actual cause."

6. **CITE WHEN POSSIBLE**: Reference clinical guidelines when making recommendations (e.g., "According to WHO guidelines..." or "Current evidence suggests...").

**PATIENT CONTEXT:** {context_str if context_str else "New patient — no prior data available"}
**PATIENT QUESTION:** "{message}"

**RESPONSE FORMAT:**
- Be empathetic but clinically precise
- Keep responses concise (2-3 paragraphs max) unless the user asks for detail
- Use bullet points for actionable advice
- End every response with a brief note about when to see a doctor for this specific concern
- Include the disclaimer: "This is AI-generated health information, not a medical diagnosis. Always consult a healthcare provider for medical decisions."
"""
        return await call_gemini(prompt)
    except Exception:
        return "I'm having trouble processing that. Please try again."


async def gemini_chat_stream(message: str, context: Optional[Dict] = None):
    if not gemini_client:
        yield "AI Service Unavailable"
        return
    try:
        from google.genai import types

        context_str = ""
        if context:
            if context.get("user_age"):
                context_str += f"Patient Age: {context.get('user_age', 'Unknown')}"
            if context.get("user_gender"):
                context_str += f", Sex: {context.get('user_gender', 'Unknown')}"

        prompt = f"""You are a clinical health assistant. Provide accurate, evidence-based medical guidance. RULES: Never fabricate medical facts — say "I'm unsure, consult your doctor" if uncertain. If symptoms suggest an emergency (chest pain + breathing difficulty, stroke signs, severe bleeding, anaphylaxis), IMMEDIATELY instruct to call 112/911. Never minimize symptoms. Never prescribe prescription drugs — only suggest OTC with dosage limits and contraindications. Always end with "Consult a healthcare provider for medical decisions."{" " + context_str if context_str else ""}
User: {message}"""
        config = types.GenerateContentConfig(temperature=0.7)

        for model_name in GEMINI_MODELS:
            try:
                for chunk in gemini_client.models.generate_content_stream(
                    model=model_name, contents=prompt, config=config
                ):
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                if "401" in str(e) or "API key" in str(e):
                    yield "Authentication error. Check API key."
                    return
                continue
        yield "All AI models temporarily unavailable. Please try again."
    except Exception:
        yield "Error generating response."


# ============================================
# 📋 HYBRID HEALTH PLAN (The Masterpiece)
# ============================================


async def gemini_personalized_health_plan(
    condition: str,
    user_profile: Dict[str, Any],
    report_analysis: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generates a 'Hybrid' plan by synthesizing:
    1. The ML Disease Prediction (Condition)
    2. The PDF Report Data (Blood work, etc.)
    3. User Demographics
    """
    if not gemini_client:
        return {"error": "Health plan unavailable"}

    try:
        # 1. Format User Data
        profile_str = f"{user_profile.get('age', '?')}yo {user_profile.get('gender', 'Patient')}, {user_profile.get('weight', '?')}kg, {user_profile.get('height', '?')}cm"

        report_str = "No laboratory reports available — recommendations should be conservative and emphasize the need for baseline testing."
        if report_analysis:
            metrics = report_analysis.get("health_metrics", {})
            if isinstance(metrics, dict):
                metric_list = [f"{k}: {v}" for k, v in metrics.items() if v]
                report_str = f"""**LABORATORY FINDINGS (from uploaded report):**
- Report Type: {report_analysis.get("report_type", "General")}
- Key Metrics: {", ".join(metric_list) if metric_list else "None extracted"}
- Risk Level: {report_analysis.get("risk_level", "Not assessed")}
- Findings: {", ".join(report_analysis.get("key_findings", []))}
- NOTE: Interpret these values in context of the patient's demographics and condition. Flag any values outside reference ranges explicitly."""

        prompt = f"""You are a board-certified physician creating an evidence-based, personalized health management plan. Your plan must be medically sound, actionable, and safe.

### PATIENT FILE
* **Demographics:** {profile_str}
* **Primary Condition (ML-predicted):** {condition}
* **Clinical Evidence:**
{report_str}

### CLINICAL RULES — YOU MUST FOLLOW THESE:

1. **CONTRAINDICATION CHECK**: Before recommending ANY exercise, dietary change, or supplement, consider the patient's condition. For example: do NOT recommend high-intensity exercise for a cardiac condition, do NOT recommend high-potassium foods if kidney disease is suspected, do NOT recommend fasting if the patient is diabetic.

2. **LAB-DRIVEN PRIORITIES**: If lab results show specific abnormalities (e.g., high LDL, low hemoglobin, elevated HbA1c), the plan MUST prioritize addressing those specific values with targeted interventions, even if the ML-predicted condition is different.

3. **REALISTIC TIMELINES**: Do not promise outcomes. Use language like "typically improves within" or "many patients see improvement by" with citation of clinical norms.

4. **NO PRESCRIPTION DRUGS**: Do not prescribe medications. You may recommend OTC supplements (Vitamin D, Iron, Omega-3) with standard dosages and contraindications. For anything requiring a prescription, say "Discuss with your physician: [medication class] may be appropriate."

5. **MEASURABLE TARGETS**: Every recommendation must include a specific, measurable target (e.g., "Walk 30 minutes, 5 days/week" not "exercise more"; "Limit sodium to <2,300mg/day" not "reduce salt").

### OUTPUT FORMAT (Markdown):

### Phase 1: Stabilization (Week 1)
* **Primary Goal:** (address the most urgent metric or symptom)
* **Daily Routine:** (specific wake/sleep times, activity windows)
* **Dietary Changes:**
  - ADD: 3 specific foods with quantities and frequency, explaining the clinical reason for each
  - REMOVE: 3 specific foods/habits, explaining what harm they cause for this condition
* **Monitoring:** What to track daily (weight, BP, glucose, symptom diary — be specific to the condition)

### Phase 2: Active Recovery (Weeks 2-3)
* **Exercise Protocol:** Specific type, duration, frequency, intensity (use heart rate zones or RPE scale). Include warm-up and contraindicated movements.
* **Nutritional Targets:** Macronutrient goals with daily gram targets appropriate for the condition.
* **Mental Health:** One evidence-based stress reduction technique with specific daily duration.
* **Hydration:** Specific daily target in liters, adjusted for condition (e.g., fluid restriction for heart failure).

### Phase 3: Maintenance (Week 4+)
* **Long-term Prevention:** Lifestyle modifications to prevent recurrence, grounded in clinical guidelines.
* **Follow-up Testing:** Specific lab tests or imaging to request at 4-week and 12-week marks, based on the condition and any lab abnormalities.
* **When to Seek Urgent Care:** Specific warning signs during recovery that require immediate medical attention.

### Nutritional Strategy Summary
* **Caloric Target:** (based on demographics and condition)
* **Macro Split:** Protein/Carbs/Fat in grams and percentages
* **Key Micronutrients:** Specific vitamins/minerals relevant to this condition with recommended daily amounts

---
⚕️ **IMPORTANT**: This is an AI-generated wellness plan for educational support only. It is NOT a substitute for physician-directed treatment. Do NOT alter any prescribed medications based on this plan. Consult your healthcare provider before making dietary or exercise changes, especially if you have pre-existing conditions."""

        response_text = await call_gemini(prompt)

        return (
            {
                "plan": response_text,
                "condition": condition,
                "generated_at": datetime.utcnow().isoformat(),
                "duration": "4 weeks",
                "source": "Hybrid (ML + Report Analysis)",
            }
            if response_text
            else {"error": "Plan generation failed"}
        )

    except Exception as e:
        logger.error(f"Health plan error: {e}")
        return {"error": str(e)}


# ============================================
# 📄 REPORT ANALYSIS (Strict JSON)
# ============================================


async def _analyze_media_content(content_parts: list, prompt: str) -> Dict[str, Any]:
    response_text = ""
    last_error = None
    for model_name in GEMINI_MODELS:
        try:
            response = gemini_client.models.generate_content(
                model=model_name, contents=[*content_parts, prompt]
            )
            if hasattr(response, "candidates") or hasattr(response, "text"):
                response_text = _extract_text(response)
                if response_text:
                    break
        except Exception as e:
            last_error = e
            if "401" in str(e) or "API key" in str(e):
                logger.error(f"Auth error in media analysis: {e}")
                return {"success": False, "error": "Authentication failed"}
            continue

    if not response_text:
        if last_error:
            logger.error(f"All models failed for media analysis: {last_error}")
        return {"success": False, "error": "Analysis failed - all models unavailable"}

    clean_text = response_text.replace("```json", "").replace("```", "").strip()

    try:
        return {"success": True, "analysis": json.loads(clean_text)}
    except json.JSONDecodeError:
        return {
            "success": True,
            "analysis": {"summary": clean_text, "health_metrics": {}},
        }


async def analyze_pdf_report(file_path: str) -> Dict[str, Any]:
    if not gemini_client:
        return {"success": False, "error": "Gemini unavailable"}
    try:
        from google.genai import types

        file_bytes = Path(file_path).read_bytes()
        pdf_content = types.Part.from_bytes(
            data=file_bytes, mime_type="application/pdf"
        )

        prompt = """You are a clinical laboratory specialist analyzing a medical report. Extract data with absolute precision — do NOT infer, estimate, or fabricate any value that is not explicitly present in the document.

Output STRICT JSON in this exact format:
{
  "report_type": "string (e.g., Complete Blood Count, Lipid Profile, Liver Function Test, Metabolic Panel, Urinalysis, Thyroid Panel, HbA1c)",
  "patient_info": "string (name, age, sex if visible — 'Not specified' if not found)",
  "report_date": "string (date if visible — 'Not specified' if not found)",
  "summary": "2-3 sentence clinical summary — state what is normal and what is abnormal. Be specific.",
  "health_metrics": {
    "Test Name": "Value Unit [Reference Range] (NORMAL/HIGH/LOW/CRITICAL)"
  },
  "key_findings": ["Finding 1 with clinical significance", "Finding 2 with clinical significance"],
  "abnormal_values": ["List ONLY values outside reference range with their actual vs expected range"],
  "risk_level": "Low / Moderate / High / Critical — based on the severity of abnormal findings",
  "recommendations": ["Specific, actionable recommendation 1", "Specific recommendation 2"],
  "limitations": "Note any values that were unclear, partially visible, or could not be reliably extracted"
}

RULES:
1. health_metrics values MUST be simple strings in format: "value unit [ref range] (status)". No nested objects.
2. If a value is not clearly legible in the document, do NOT include it — add it to "limitations" instead.
3. For EVERY extracted metric, include the reference range if visible on the report.
4. Flag any CRITICAL values (values dangerously outside reference range) prominently in key_findings.
5. recommendations must be evidence-based and specific to the findings — not generic health advice."""
        return await _analyze_media_content([pdf_content], prompt)
    except Exception as e:
        return {"success": False, "error": str(e)}


async def analyze_image_report(file_path: str) -> Dict[str, Any]:
    if not gemini_client:
        return {"success": False, "error": "Gemini unavailable"}
    try:
        from google.genai import types

        fpath = Path(file_path)
        mime = "image/png" if fpath.suffix == ".png" else "image/jpeg"
        file_bytes = fpath.read_bytes()
        img_content = types.Part.from_bytes(data=file_bytes, mime_type=mime)

        prompt = """You are a clinical laboratory specialist analyzing a medical report image. Extract data with absolute precision — do NOT infer or fabricate values not clearly visible in the image.

Output STRICT JSON:
{
  "report_type": "string (e.g., Blood Test, Imaging Report, Prescription, Diagnostic Report)",
  "patient_info": "string (name, age, sex if visible — 'Not specified' if not found)",
  "report_date": "string (date if visible — 'Not specified' if not found)",
  "summary": "2-3 sentence clinical summary of findings",
  "health_metrics": { "Parameter": "Value Unit [Reference Range] (NORMAL/HIGH/LOW)" },
  "key_findings": ["Finding with clinical significance"],
  "abnormal_values": ["Values outside reference range with actual vs expected"],
  "risk_level": "Low / Moderate / High / Critical",
  "recommendations": ["Specific actionable recommendation"],
  "limitations": "Note any values unclear due to image quality, partial visibility, or handwriting legibility"
}

RULES:
1. health_metrics values MUST be simple strings. No nested objects.
2. If a value is not clearly legible, do NOT include it — note in limitations.
3. Include reference ranges where visible.
4. Flag CRITICAL values prominently.
5. If the image quality makes reliable extraction impossible, return: {"report_type": "Unclear", "summary": "Image quality insufficient for reliable extraction", "health_metrics": {}, "key_findings": [], "risk_level": "Unable to assess", "recommendations": ["Please upload a clearer image or the original PDF"], "limitations": "Specific quality issue description"}"""
        return await _analyze_media_content([img_content], prompt)
    except Exception as e:
        return {"success": False, "error": str(e)}


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
    if not gemini_client:
        return {"error": "Unavailable"}
    try:
        prompt = f"""You are a clinical triage specialist conducting a structured symptom assessment. Analyze the following symptoms with medical rigor. NEVER minimize or dismiss symptoms.

**Patient-Reported Symptoms:** "{symptoms_text}"

Provide your assessment in the following structure (Markdown):

### Triage Classification
State ONE of the following levels with clear justification:
- **EMERGENCY (Call 112/911 NOW):** Symptoms suggest an immediately life-threatening condition
- **URGENT (See a doctor within 24 hours):** Symptoms suggest a condition that could worsen significantly without prompt evaluation
- **SEMI-URGENT (Schedule appointment within 1 week):** Symptoms suggest a condition requiring medical evaluation but not immediately dangerous
- **ROUTINE (Schedule at next available):** Symptoms are consistent with common, self-limiting conditions
- **SELF-CARE (with monitoring):** Symptoms are mild and typically resolve with appropriate home management

### Clinical Assessment
For each potential cause, provide:
1. **Condition name** — likelihood (Most Likely / Possible / Less Likely)
2. **Why it fits:** Which reported symptoms support this diagnosis
3. **What would distinguish it:** One test or observation that would confirm or rule it out

List conditions in order from most to least likely. Include at least 3 possibilities.

### Immediate Actions
Provide specific, actionable steps ordered by priority:
- What to do RIGHT NOW (e.g., "Apply cold compress for 15 minutes every 2 hours")
- What to monitor (e.g., "Check temperature every 4 hours — seek care if above 101.3°F / 38.5°C")
- What to AVOID (e.g., "Do not take ibuprofen if you have stomach pain or are on blood thinners")

### When to Escalate
List specific, measurable criteria for seeking immediate medical attention (e.g., "If pain intensity increases to 8/10 or above", "If symptoms persist beyond 48 hours without improvement", "If you develop [specific new symptom]").

---
⚕️ This is an AI-generated symptom assessment for informational purposes only. It is NOT a clinical diagnosis. Always consult a qualified healthcare provider for proper evaluation and treatment."""
        response = await call_gemini(prompt)
        return {"analysis": response}
    except Exception:
        return {"error": "Failed"}


async def gemini_drug_interaction_checker(medications: List[str]) -> str:
    if not gemini_client:
        return "Unavailable"
    try:
        prompt = f"""You are a clinical pharmacist conducting a drug interaction analysis. Provide a thorough, accurate pharmacological assessment. NEVER fabricate interactions — if you are uncertain about a specific interaction, explicitly state: "This interaction requires verification with a pharmacist or drug interaction database (e.g., Lexicomp, Micromedex)."

**Medications to Analyze:** {", ".join(medications)}

Provide your analysis in the following structure (Markdown):

### Interaction Summary
State the overall risk level:
- **SEVERE / CONTRAINDICATED:** These drugs should NOT be taken together. Immediate physician consultation required.
- **MODERATE:** Use with caution. Dose adjustment or monitoring may be needed.
- **MINOR:** Interaction exists but is generally clinically insignificant at standard doses.
- **NO CLINICALLY SIGNIFICANT INTERACTION:** These medications are generally safe to use together at standard doses.

### Detailed Interaction Analysis
For EACH drug pair that interacts, provide:
1. **Drug A + Drug B:** Interaction classification (Severe/Moderate/Minor)
2. **Mechanism:** The pharmacological mechanism (e.g., "Both drugs inhibit CYP3A4", "Additive CNS depression", "Reduced absorption due to chelation")
3. **Clinical Effect:** What happens to the patient (e.g., "Increased bleeding risk", "Enhanced sedation", "Reduced efficacy of Drug A")
4. **Risk Factors:** Patient populations at higher risk (e.g., elderly, renal impairment, hepatic disease)
5. **Management:** Specific clinical recommendation (e.g., "Separate doses by at least 2 hours", "Monitor INR weekly", "Consider alternative: [specific drug]")

If NO interactions are found, explicitly state for each pair: "[Drug A] and [Drug B]: No clinically significant interaction identified at standard therapeutic doses."

### Important Considerations
- Any drugs in the list that have narrow therapeutic indices (e.g., warfarin, digoxin, lithium, phenytoin)
- Any drugs that should be taken at specific times relative to meals or other medications
- Any common side effects that may be additive when these drugs are combined

### Patient Safety Notes
- Specific symptoms to watch for that may indicate an adverse interaction
- When to contact a healthcare provider

---
⚕️ This is an AI-generated pharmacological analysis for informational purposes only. It does NOT replace a professional pharmacist consultation or a verified drug interaction database. Always verify interactions with your pharmacist or physician, especially for complex medication regimens."""
        return await call_gemini(prompt)
    except Exception:
        return "Failed"


async def gemini_explain_medical_term(term: str) -> str:
    if not gemini_client:
        return "Unavailable"
    try:
        return await call_gemini(
            f"""Explain the medical term '{term}' with clinical accuracy while being accessible to a non-medical audience.

Structure your response as:
1. **Medical Definition:** The precise clinical definition as it would appear in a medical textbook.
2. **In Simple Terms:** A clear, everyday-language explanation that a patient would understand. Use an analogy if it genuinely helps understanding — but NEVER sacrifice accuracy for simplicity.
3. **Why It Matters:** One sentence on the clinical significance — why a doctor would mention or test for this.
4. **Related Terms:** 1-2 related medical terms the patient might also encounter in this context.

RULES: Do NOT oversimplify to the point of inaccuracy. If the term has multiple meanings in different medical contexts, mention the most common one and note the existence of others."""
        )
    except Exception:
        return "Failed"
