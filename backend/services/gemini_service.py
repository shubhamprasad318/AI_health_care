"""
Gemini AI Integration Service - 2026 SDK
Uses the new google.genai Client-based architecture.
"""

import asyncio
import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncIterator, Dict, List, Optional

logger = logging.getLogger(__name__)

gemini_client = None

# Tried in order. gemini-2.0-flash and -lite were retired by Google (404).
GEMINI_MODELS = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
]

GEMINI_TIMEOUT_SECONDS = 60
GEMINI_STREAM_CHUNK_TIMEOUT_SECONDS = 30

_MAX_PROMPT_FIELD = 2000
_MAX_LIST_ITEMS = 20
_MAX_LIST_ITEM_LEN = 200

# Strip ASCII control chars (incl. NUL) except \t, \n, \r.
_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
# Bidirectional override codepoints (used in homoglyph attacks).
_BIDI_RE = re.compile(r"[\u202a-\u202e\u2066-\u2069]")


def _sanitize_user_input(value: Any, max_len: int = _MAX_PROMPT_FIELD) -> str:
    """Neutralize untrusted user input before embedding in a Gemini prompt.

    Prevents prompt injection by stripping control chars, bidirectional
    overrides, and escaping markdown fence delimiters. Truncates to max_len.
    """
    if value is None:
        return ""
    text = str(value)
    text = _CONTROL_CHARS_RE.sub("", text)
    text = _BIDI_RE.sub("", text)
    text = text.replace("```", "''' ")
    text = text.strip()
    if len(text) > max_len:
        text = text[:max_len] + "…"
    return text


def _sanitize_list(
    items: Optional[List[Any]],
    max_items: int = _MAX_LIST_ITEMS,
    item_max_len: int = _MAX_LIST_ITEM_LEN,
) -> List[str]:
    if not items:
        return []
    cleaned = [_sanitize_user_input(x, item_max_len) for x in list(items)[:max_items]]
    return [c for c in cleaned if c]


def initialize_gemini(api_key: str) -> bool:
    global gemini_client
    if not api_key:
        logger.warning("GEMINI_API_KEY not found. Gemini features disabled.")
        return False
    try:
        from google import genai

        gemini_client = genai.Client(api_key=api_key)
        logger.info("Gemini AI initialized with 2026 SDK (google-genai)")
        return True
    except ImportError as e:
        logger.error(f"google-genai not installed: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to initialize Gemini: {e}", exc_info=True)
        return False


def is_gemini_available() -> bool:
    return gemini_client is not None


def _extract_text(response) -> str:
    """Extract text from a Gemini response, skipping non-text parts."""
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
    except (AttributeError, ValueError):
        pass
    return ""


def _is_auth_error(err: BaseException) -> bool:
    msg = str(err)
    return "401" in msg or "API key" in msg or "PERMISSION_DENIED" in msg


async def _generate_content_async(
    model: str, contents: Any, config: Any
) -> Any:
    client = gemini_client
    if client is None:
        raise RuntimeError("Gemini client not initialized")

    def _sync_call():
        kwargs: Dict[str, Any] = {"model": model, "contents": contents}
        if config is not None:
            kwargs["config"] = config
        return client.models.generate_content(**kwargs)

    return await asyncio.wait_for(
        asyncio.to_thread(_sync_call), timeout=GEMINI_TIMEOUT_SECONDS
    )


async def call_gemini(prompt: str, config: Optional[Any] = None) -> str:
    if not gemini_client:
        raise RuntimeError("Gemini client not initialized")

    from google.genai import types

    generation_config = config or types.GenerateContentConfig(
        temperature=0.7,
        top_p=0.95,
        top_k=40,
        # 2.5-flash spends part of this budget on hidden "thinking"; 4000 cut
        # long answers such as the 4-week health plan off mid-way
        max_output_tokens=8192,
    )

    last_error: Optional[BaseException] = None

    for model_name in GEMINI_MODELS:
        try:
            response = await _generate_content_async(
                model_name, prompt, generation_config
            )
            if response:
                text = _extract_text(response)
                if text:
                    return text
        except asyncio.TimeoutError as e:
            last_error = e
            logger.warning(f"Gemini timeout on model {model_name}")
            continue
        except Exception as e:
            last_error = e
            if _is_auth_error(e):
                logger.error(f"Gemini auth error: {e}")
                raise
            logger.warning(f"Gemini error on model {model_name}: {e}")
            continue

    logger.error("All Gemini models failed.")
    if last_error:
        raise last_error
    return ""


def _red_flags_note(red_flags: Optional[Dict[str, Any]]) -> str:
    """Prompt line for warning signs found by services/red_flags.py, so the
    analysis reinforces the app's urgent-care advice instead of contradicting it."""
    if not red_flags or not red_flags.get("reasons"):
        return ""
    signs = ", ".join(_sanitize_list(red_flags["reasons"], max_items=10, item_max_len=80))
    advice = (
        "call emergency services (112) or go to an emergency department now"
        if red_flags.get("level") == "emergency"
        else "see a doctor today, and call 112 if symptoms get worse"
    )
    return (
        f"**WARNING SIGNS REPORTED:** {signs}. The app has already told the patient to "
        f"{advice}. Your assessment must reinforce this advice and must never suggest "
        f"waiting, or managing these symptoms at home alone.\n"
    )


async def get_gemini_enhanced_prediction(
    prediction: str,
    symptoms: List[str],
    specialize: str = "Physician",
    user_age: Optional[int] = None,
    user_gender: Optional[str] = None,
    red_flags: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if not gemini_client:
        return {"enhanced": False, "ml_prediction": prediction}

    s_prediction = _sanitize_user_input(prediction, 200)
    s_symptoms = _sanitize_list(symptoms, max_items=15, item_max_len=120)
    s_specialize = _sanitize_user_input(specialize, 100)
    s_age = _sanitize_user_input(user_age, 10) if user_age is not None else ""
    s_gender = _sanitize_user_input(user_gender, 20) if user_gender else ""

    try:
        context_str = ""
        if s_age:
            context_str += f"Age: {s_age} years"
        if s_gender:
            context_str += f", Sex: {s_gender}"
        if not context_str:
            context_str = "Demographics not provided — factor this uncertainty into your assessment"

        symptoms_str = ", ".join(s_symptoms)

        prompt = f"""You are a board-certified internal medicine physician reviewing a machine learning model's provisional diagnosis. Your role is to provide a rigorous, evidence-based clinical assessment that a patient can take to their doctor.

**PATIENT DEMOGRAPHICS:** {context_str}
**PRESENTING SYMPTOMS:** {symptoms_str}
**ML MODEL PREDICTION:** {s_prediction}
{_red_flags_note(red_flags)}
Provide your assessment in the following structure (Markdown format):

### Clinical Assessment of {s_prediction}

**What This Condition Is:**
Explain the pathophysiology of {s_prediction} in clear, accurate language. Include the organ systems involved, what goes wrong at a biological level, and how it manifests. Do NOT oversimplify to the point of inaccuracy. Do NOT use alarming language — be factual.

**Why These Symptoms Occur:**
For each reported symptom ({symptoms_str}), explain the specific pathophysiological mechanism connecting it to {s_prediction}. If a symptom does NOT typically correlate with this condition, explicitly state: "Note: [symptom] is not a classic presentation of {s_prediction} — this warrants discussion with your physician as it may indicate a co-existing condition or alternative diagnosis."

**Differential Diagnoses to Consider:**
List 2-4 alternative conditions that could explain this symptom cluster, ordered by clinical likelihood. For each, state: the condition name, the overlapping symptoms, and one distinguishing feature that differentiates it from {s_prediction}. This is critical — an ML model may misclassify, and the patient must be aware of alternatives.

**Red Flags — Seek Emergency Care Immediately If You Experience:**
List specific, measurable warning signs (e.g., "fever above 103°F / 39.4°C that does not respond to antipyretics within 2 hours", NOT vague statements like "if symptoms worsen"). Each red flag must be an actionable observation the patient can identify.

**Expected Clinical Course (Next 7-14 Days):**
Describe the typical trajectory — what improves first, what may linger, and realistic recovery timelines. Include: when symptoms should start improving with appropriate treatment, when to become concerned if no improvement, and any expected complications.

**Recommended Diagnostic Workup:**
List specific lab tests, imaging, or examinations the {s_specialize} should consider to confirm or rule out this diagnosis. For each test, briefly state what it checks for.

**Questions to Ask Your {s_specialize}:**
Provide 5 specific, high-value questions the patient should bring to their appointment. These should help differentiate the diagnosis, understand treatment options, and establish follow-up criteria.

---
⚕️ **Medical Disclaimer:** This analysis is generated by AI for educational and informational purposes only. It is NOT a diagnosis, NOT a treatment plan, and NOT a substitute for in-person medical evaluation. An ML model prediction has limited accuracy and must be confirmed through proper clinical examination, diagnostic testing, and physician judgment. Always consult a qualified healthcare provider before making any medical decisions."""

        response_text = await call_gemini(prompt)
        if response_text:
            return {
                "enhanced": True,
                "ml_prediction": prediction,
                "gemini_analysis": response_text,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }
        return {"enhanced": False, "ml_prediction": prediction}
    except asyncio.TimeoutError:
        logger.error("Enhanced prediction timed out")
        return {
            "enhanced": False,
            "error": "AI analysis timed out",
            "ml_prediction": prediction,
        }
    except Exception as e:
        logger.error(f"Enhanced prediction failed: {e}", exc_info=True)
        return {
            "enhanced": False,
            "error": str(e),
            "ml_prediction": prediction,
        }


async def gemini_health_chat(message: str, context: Optional[Dict] = None) -> str:
    if not gemini_client:
        return "AI Chat unavailable."

    s_message = _sanitize_user_input(message, 4000)
    if not s_message:
        return "Please provide a question."

    try:
        context_str = ""
        if context:
            recent = _sanitize_user_input(context.get("recent_prediction"), 200)
            age = _sanitize_user_input(context.get("user_age"), 10)
            gender = _sanitize_user_input(context.get("user_gender"), 20)
            if recent:
                context_str += f"\n- Recent AI Prediction: {recent}"
            if age:
                context_str += f"\n- Patient Age: {age}"
            if gender:
                context_str += f"\n- Patient Sex: {gender}"

        patient_context = context_str if context_str else "New patient — no prior data available"

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

**PATIENT CONTEXT:** {patient_context}
**PATIENT QUESTION:** "{s_message}"

**RESPONSE FORMAT:**
- Be empathetic but clinically precise
- Keep responses concise (2-3 paragraphs max) unless the user asks for detail
- Use bullet points for actionable advice
- End every response with a brief note about when to see a doctor for this specific concern
- Include the disclaimer: "This is AI-generated health information, not a medical diagnosis. Always consult a healthcare provider for medical decisions."
"""
        return await call_gemini(prompt)
    except asyncio.TimeoutError:
        logger.warning("Gemini chat timed out")
        return "The AI is taking too long to respond right now. Please try again in a moment."
    except Exception as e:
        logger.error(f"Gemini chat error: {e}", exc_info=True)
        return "I'm having trouble processing that. Please try again."


async def gemini_chat_stream(
    message: str, context: Optional[Dict] = None
) -> AsyncIterator[str]:
    if not gemini_client:
        yield "AI Service Unavailable"
        return

    s_message = _sanitize_user_input(message, 4000)
    if not s_message:
        yield "Please provide a question."
        return

    from google.genai import types

    context_str = ""
    if context:
        age = _sanitize_user_input(context.get("user_age"), 10)
        gender = _sanitize_user_input(context.get("user_gender"), 20)
        if age:
            context_str += f"Patient Age: {age}"
        if gender:
            context_str += f", Sex: {gender}"

    prompt = (
        "You are a clinical health assistant. Provide accurate, evidence-based "
        "medical guidance. RULES: Never fabricate medical facts — say \"I'm "
        "unsure, consult your doctor\" if uncertain. If symptoms suggest an "
        "emergency (chest pain + breathing difficulty, stroke signs, severe "
        "bleeding, anaphylaxis), IMMEDIATELY instruct to call 112/911. Never "
        "minimize symptoms. Never prescribe prescription drugs — only suggest "
        "OTC with dosage limits and contraindications. Always end with "
        '"Consult a healthcare provider for medical decisions."'
        + (" " + context_str if context_str else "")
        + f"\nUser: {s_message}"
    )
    config = types.GenerateContentConfig(temperature=0.7)

    sentinel = object()

    def _next_chunk(it):
        try:
            return next(it)
        except StopIteration:
            return sentinel

    client = gemini_client
    if client is None:
        yield "AI Service Unavailable"
        return

    for model_name in GEMINI_MODELS:
        try:
            stream = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda mn=model_name: client.models.generate_content_stream(
                        model=mn, contents=prompt, config=config
                    )
                ),
                timeout=GEMINI_TIMEOUT_SECONDS,
            )
            while True:
                chunk = await asyncio.wait_for(
                    asyncio.to_thread(_next_chunk, stream),
                    timeout=GEMINI_STREAM_CHUNK_TIMEOUT_SECONDS,
                )
                if chunk is sentinel:
                    return
                text = getattr(chunk, "text", None)
                if text:
                    yield text
            return
        except asyncio.TimeoutError:
            logger.warning(f"Gemini stream timeout on {model_name}")
            continue
        except Exception as e:
            if _is_auth_error(e):
                logger.error(f"Gemini stream auth error: {e}")
                yield "Authentication error. Check API key."
                return
            logger.warning(f"Gemini stream error on {model_name}: {e}")
            continue

    yield "All AI models temporarily unavailable. Please try again."


async def gemini_personalized_health_plan(
    condition: str,
    user_profile: Dict[str, Any],
    report_analysis: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if not gemini_client:
        return {"error": "Health plan unavailable"}

    s_condition = _sanitize_user_input(condition, 200)
    s_age = _sanitize_user_input(user_profile.get("age"), 10)
    s_gender = _sanitize_user_input(user_profile.get("gender"), 20)
    s_weight = _sanitize_user_input(user_profile.get("weight"), 20)
    s_height = _sanitize_user_input(user_profile.get("height"), 20)

    try:
        profile_str = f"{s_age or '?'}yo {s_gender or 'Patient'}, {s_weight or '?'}kg, {s_height or '?'}cm"

        report_str = "No laboratory reports available — recommendations should be conservative and emphasize the need for baseline testing."
        if report_analysis:
            metrics = report_analysis.get("health_metrics", {})
            metric_list: List[str] = []
            if isinstance(metrics, dict):
                for k, v in list(metrics.items())[:_MAX_LIST_ITEMS]:
                    if v:
                        sk = _sanitize_user_input(k, 80)
                        sv = _sanitize_user_input(v, 120)
                        if sk and sv:
                            metric_list.append(f"{sk}: {sv}")
            report_type = _sanitize_user_input(report_analysis.get("report_type"), 80) or "General"
            risk_level = _sanitize_user_input(report_analysis.get("risk_level"), 40) or "Not assessed"
            findings = _sanitize_list(report_analysis.get("key_findings"), max_items=10, item_max_len=240)
            report_str = (
                "**LABORATORY FINDINGS (from uploaded report):**\n"
                f"- Report Type: {report_type}\n"
                f"- Key Metrics: {', '.join(metric_list) if metric_list else 'None extracted'}\n"
                f"- Risk Level: {risk_level}\n"
                f"- Findings: {', '.join(findings)}\n"
                "- NOTE: Interpret these values in context of the patient's demographics and condition. Flag any values outside reference ranges explicitly."
            )

        prompt = f"""You are a board-certified physician creating an evidence-based, personalized health management plan. Your plan must be medically sound, actionable, and safe.

### PATIENT FILE
* **Demographics:** {profile_str}
* **Primary Condition (ML-predicted):** {s_condition}
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
        if response_text:
            return {
                "plan": response_text,
                "condition": condition,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "duration": "4 weeks",
                "source": "Hybrid (ML + Report Analysis)",
            }
        return {"error": "Plan generation failed"}
    except asyncio.TimeoutError:
        logger.error("Health plan generation timed out")
        return {"error": "Plan generation timed out"}
    except Exception as e:
        logger.error(f"Health plan error: {e}", exc_info=True)
        return {"error": str(e)}


async def _analyze_media_content(content_parts: list, prompt: str) -> Dict[str, Any]:
    if gemini_client is None:
        return {"success": False, "error": "Gemini unavailable"}

    response_text = ""
    last_error: Optional[BaseException] = None

    for model_name in GEMINI_MODELS:
        try:
            response = await _generate_content_async(
                model_name, [*content_parts, prompt], None
            )
            if response is not None:
                response_text = _extract_text(response)
                if response_text:
                    break
        except asyncio.TimeoutError as e:
            last_error = e
            logger.warning(f"Media analysis timeout on {model_name}")
            continue
        except Exception as e:
            last_error = e
            if _is_auth_error(e):
                logger.error(f"Auth error in media analysis: {e}")
                return {"success": False, "error": "Authentication failed"}
            logger.warning(f"Media analysis error on {model_name}: {e}")
            continue

    if not response_text:
        if last_error:
            logger.error(f"All models failed for media analysis: {last_error}")
        return {"success": False, "error": "Analysis failed - all models unavailable"}

    clean_text = response_text.replace("```json", "").replace("```", "").strip()

    try:
        return {"success": True, "analysis": json.loads(clean_text)}
    except json.JSONDecodeError:
        logger.info("Media analysis returned non-JSON; falling back to text summary")
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
    except FileNotFoundError:
        logger.error(f"PDF not found: {file_path}")
        return {"success": False, "error": "File not found"}
    except Exception as e:
        logger.error(f"PDF analysis error: {e}", exc_info=True)
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
    except FileNotFoundError:
        logger.error(f"Image not found: {file_path}")
        return {"success": False, "error": "File not found"}
    except Exception as e:
        logger.error(f"Image analysis error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


async def process_medical_report(file_path: str, content_type: str) -> Dict[str, Any]:
    try:
        if content_type == "application/pdf":
            return await analyze_pdf_report(file_path)
        elif content_type.startswith("image/"):
            return await analyze_image_report(file_path)
        return {"success": False, "error": "Unsupported file"}
    except Exception as e:
        logger.error(f"Processing error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


async def gemini_symptom_checker(symptoms_text: str) -> Dict[str, Any]:
    if not gemini_client:
        return {"error": "Unavailable"}

    s_symptoms = _sanitize_user_input(symptoms_text, 3000)
    if not s_symptoms:
        return {"error": "No symptoms provided"}

    try:
        prompt = f"""You are a clinical triage specialist conducting a structured symptom assessment. Analyze the following symptoms with medical rigor. NEVER minimize or dismiss symptoms.

**Patient-Reported Symptoms:** "{s_symptoms}"

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
    except asyncio.TimeoutError:
        return {"error": "Symptom analysis timed out"}
    except Exception as e:
        logger.error(f"Symptom checker error: {e}", exc_info=True)
        return {"error": "Failed"}


async def gemini_drug_interaction_checker(medications: List[str]) -> str:
    if not gemini_client:
        return "Unavailable"

    s_meds = _sanitize_list(medications, max_items=10, item_max_len=100)
    if len(s_meds) < 2:
        return "Need at least 2 valid medications to check interactions."

    try:
        meds_str = ", ".join(s_meds)
        prompt = f"""You are a clinical pharmacist conducting a drug interaction analysis. Provide a thorough, accurate pharmacological assessment. NEVER fabricate interactions — if you are uncertain about a specific interaction, explicitly state: "This interaction requires verification with a pharmacist or drug interaction database (e.g., Lexicomp, Micromedex)."

**Medications to Analyze:** {meds_str}

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
    except asyncio.TimeoutError:
        return "Drug interaction check timed out. Please try again."
    except Exception as e:
        logger.error(f"Drug interaction checker error: {e}", exc_info=True)
        return "Failed"


async def gemini_explain_medical_term(term: str) -> str:
    if not gemini_client:
        return "Unavailable"

    s_term = _sanitize_user_input(term, 200)
    if not s_term:
        return "Please provide a medical term."

    try:
        return await call_gemini(
            f"""Explain the medical term '{s_term}' with clinical accuracy while being accessible to a non-medical audience.

Structure your response as:
1. **Medical Definition:** The precise clinical definition as it would appear in a medical textbook.
2. **In Simple Terms:** A clear, everyday-language explanation that a patient would understand. Use an analogy if it genuinely helps understanding — but NEVER sacrifice accuracy for simplicity.
3. **Why It Matters:** One sentence on the clinical significance — why a doctor would mention or test for this.
4. **Related Terms:** 1-2 related medical terms the patient might also encounter in this context.

RULES: Do NOT oversimplify to the point of inaccuracy. If the term has multiple meanings in different medical contexts, mention the most common one and note the existence of others."""
        )
    except asyncio.TimeoutError:
        return "Medical term explanation timed out."
    except Exception as e:
        logger.error(f"Term explanation error: {e}", exc_info=True)
        return "Failed"
