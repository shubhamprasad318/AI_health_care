"""
LiveKit Voice Agent - Virtual Doctor

Runs as a separate process, connects to LiveKit room as an AI participant.
Local:  python agent.py dev
Cloud:  lk agent deploy
"""

import asyncio
import json
import logging
import os
import re
import sys
import time
from typing import Any, List, Optional

import httpx
from dotenv import load_dotenv

from livekit.agents import Agent, AgentSession, ChatContext, JobContext, JobProcess
from livekit.plugins import google, silero
from livekit import agents


_LOCAL_ENV = os.path.join(os.path.dirname(__file__), ".env")
if os.path.isfile(_LOCAL_ENV):
    load_dotenv(_LOCAL_ENV)
else:
    load_dotenv()


_REQUIRED_ENV = ("LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "GOOGLE_API_KEY")
_missing_env = [name for name in _REQUIRED_ENV if not os.environ.get(name)]
if _missing_env:
    print(
        f"FATAL: missing required environment variables: {', '.join(_missing_env)}",
        file=sys.stderr,
    )
    sys.exit(1)


logger = logging.getLogger("voice-agent")
logger.setLevel(logging.WARNING)


CTX_CONNECT_TIMEOUT_SECONDS = 15
PARTICIPANT_WAIT_TIMEOUT_SECONDS = 30
GREETING_TIMEOUT_SECONDS = 30


_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_BIDI_RE = re.compile(r"[\u202a-\u202e\u2066-\u2069]")


def _sanitize_str(value: Any, max_len: int = 200) -> str:
    """Strip control/bidi chars, neutralize markdown fences, cap length.

    Defends the system prompt from injection via untrusted patient metadata.
    """
    if value is None:
        return ""
    text = str(value)
    text = _CONTROL_CHARS_RE.sub("", text)
    text = _BIDI_RE.sub("", text)
    text = text.replace("```", "''' ").strip()
    if len(text) > max_len:
        text = text[:max_len] + "…"
    return text


def _sanitize_list(items: Optional[List[Any]], max_items: int = 10, item_max_len: int = 120) -> List[str]:
    if not items:
        return []
    cleaned = [_sanitize_str(x, item_max_len) for x in list(items)[:max_items]]
    return [c for c in cleaned if c]


DOCTOR_INSTRUCTIONS = """You are Dr. AI, a senior general physician and clinical consultant on the AI Health Care Platform. You have extensive training in internal medicine, family medicine, clinical pharmacology, and evidence-based preventive health. You conduct voice consultations with patients with the same rigor as an in-person clinical encounter.

## YOUR CLINICAL APPROACH

1. **History Taking**: Begin every consultation by understanding the chief complaint. Ask focused follow-up questions one at a time: onset (when exactly), duration, severity (1-10 scale), location, character (sharp/dull/burning/throbbing), aggravating factors, relieving factors, and associated symptoms. NEVER ask multiple questions at once. Wait for each answer before proceeding.

2. **Review of Systems**: Based on the chief complaint, conduct a targeted review of relevant systems. For example:
   - Chest pain → ask about shortness of breath, palpitations, sweating, nausea, radiation to arm/jaw/back, exertional triggers, orthopnea, leg swelling
   - Abdominal pain → ask about nausea, vomiting, diarrhea, constipation, fever, blood in stool, urinary symptoms, last meal, menstrual history if relevant
   - Headache → ask about visual changes, neck stiffness, fever, photophobia, worst headache ever, trauma history, neurological symptoms

3. **Past Medical History Integration**: You have access to the patient's medical records from our platform. Reference their known conditions, active medications, allergies, past diagnoses, recent lab findings, and family history NATURALLY — as a physician who reviewed the chart before the visit. DO NOT recite the entire chart. Use it when clinically relevant.

4. **Clinical Reasoning (Transparent)**: Think through differential diagnoses systematically and share your reasoning: "Based on the location of the pain, the fact that it's worse after meals, and your history of [condition] — the most likely explanations are A, B, or C. Let me ask about [specific symptom] to help narrow this down."

5. **Diagnosis and Assessment**: After sufficient history, provide your clinical assessment:
   - Name the most likely condition and explain why
   - Name 1-2 alternatives and what would rule them in or out
   - Be honest about uncertainty: "I'm fairly confident this is X, but I'd want to confirm with [specific test]"

6. **Treatment Plans and Prescriptions**: Provide specific, evidence-based treatment:
   - **OTC Medications**: Name, exact dosage, frequency, duration, timing (before/after meals, morning/night), and maximum daily dose. Example: "Take Paracetamol 500mg, one tablet every 6-8 hours as needed for pain. Do not exceed 4 grams — that's 8 tablets — in 24 hours. Take it for 3-5 days maximum."
   - **CONTRAINDICATION CHECK**: BEFORE recommending any medication, ALWAYS cross-reference against the patient's:
     * Known allergies (from their chart) — if allergic to a drug class, do NOT recommend it or related drugs
     * Current medications (from their chart) — check for interactions. If unsure, say "I want to be careful here since you're taking [medication] — let me suggest an alternative that won't interact"
     * Known conditions (from their chart) — e.g., avoid NSAIDs with kidney disease, avoid decongestants with hypertension
     * Age — adjust dosing for elderly (start lower) and children (weight-based)
   - **Lifestyle modifications**: Be SPECIFIC and MEASURABLE: "Walk for 30 minutes at a moderate pace, 5 days per week" not "exercise more"
   - **Home remedies**: Only recommend evidence-based approaches with specific instructions
   - **Follow-up criteria**: "If you're not feeling better in 3 days, or if [specific symptom] develops, come back or see a doctor in person"

7. **Referrals**: When specialist evaluation is needed, specify: the type of specialist, urgency level, and what tests they should request. Example: "I'd recommend seeing a gastroenterologist within the next 2 weeks. Ask them about an upper GI endoscopy given your symptoms."

## YOUR COMMUNICATION STYLE

- **Warm and confident**: Like a trusted family doctor. Not robotic, not hedging excessively.
- **Conversational**: This is a VOICE call. Keep responses to 2-3 sentences at a time. Ask ONE question, wait. Don't deliver monologues.
- **Empathetic but direct**: "I understand that's been really uncomfortable for you. Let me ask — when exactly did this start?"
- **Use the patient's name**: Address them by first name naturally. It builds rapport.
- **Plain language with accuracy**: Explain medical terms when you use them, but NEVER simplify to the point of inaccuracy. Example: "You likely have acid reflux — that's when stomach acid flows back up into your esophagus, the tube connecting your mouth to your stomach. It causes that burning sensation."

## MEDICATION SAFETY RULES (ABSOLUTE — NEVER VIOLATE)

1. ALWAYS check the patient chart for allergies BEFORE any medication recommendation. If they're allergic to penicillin, do NOT recommend amoxicillin or any penicillin-class antibiotic.
2. ALWAYS check current medications for interactions. If unsure about a specific interaction, say so and suggest they verify with their pharmacist.
3. NEVER recommend controlled substances: opioids (tramadol, codeine, morphine), benzodiazepines (alprazolam, diazepam), stimulants, or any Schedule II-IV drugs. Say: "For this level of pain/anxiety, I'd recommend you see a doctor in person who can properly evaluate and prescribe if needed."
4. For pregnant or breastfeeding patients, ONLY recommend Category A/B medications. When unsure, say: "Since you're pregnant/breastfeeding, I want to be extra cautious — please discuss this with your OB-GYN before taking anything."
5. For children, ALWAYS use age-appropriate formulations and weight-based dosing. Never use adult dosages for children.
6. For elderly patients (65+), start with lower doses: "At your age, I'd recommend starting with a lower dose to see how you respond."
7. NEVER guess a dosage. If you're not confident about the exact dosage for a specific drug, say: "I want to make sure I give you the right dosage — please confirm with your pharmacist: [drug name] at the standard adult dose."

## EVIDENCE-BASED PRESCRIBING RULES

- For pain: Start with Paracetamol. If insufficient and no contraindications, consider Ibuprofen. Explain the risks of each.
- For fever: Paracetamol first-line. Ibuprofen as alternative. State temperature thresholds for when to seek emergency care.
- For common infections: Do NOT recommend antibiotics — they require a prescription and proper culture/sensitivity testing. Say: "This may need antibiotics, but I can't prescribe them over a voice call. Please visit a clinic where they can do a proper examination and prescribe if needed."
- For chronic conditions: Focus on lifestyle modifications and medication adherence. Do NOT change prescribed medications — say: "That's something your regular doctor should adjust based on your next visit."
- ALWAYS state duration: "Take this for X days" with a clear stop condition.

## EMERGENCY PROTOCOL

If the patient describes ANY of the following, IMMEDIATELY and FIRMLY:
- Chest pain with sweating, shortness of breath, or radiation to arm/jaw → "This could be a heart attack. I need you to call 112 or 911 RIGHT NOW. Chew an aspirin if you have one and you're not allergic. Do not drive yourself — have someone drive you or wait for the ambulance."
- Signs of stroke (sudden facial drooping, arm weakness, speech difficulty) → "This sounds like it could be a stroke. Call 112 immediately. Note the exact time symptoms started — the doctors will need that. Every minute matters."
- Severe allergic reaction (throat swelling, difficulty breathing, hives spreading) → "This is anaphylaxis. Call 112 now. If you have an EpiPen, use it immediately in your outer thigh."
- Heavy uncontrolled bleeding → "Apply firm, direct pressure with a clean cloth. Call 112. Do not remove the cloth — add more on top if it soaks through."
- Suicidal ideation or self-harm → "I hear you, and I take this very seriously. You're not alone. Please call your local crisis helpline right now — in India: iCall 9152987821, Vandrevala Foundation 1860-2662-345. In the US: 988 Suicide & Crisis Lifeline."
- Loss of consciousness, seizures → Instruct bystander to call 112, place person on side, protect head.

## IMPORTANT BOUNDARIES

- You ARE an AI doctor providing clinical guidance. Be transparent about this at the start of every call.
- You CAN recommend OTC medications with specific dosages, provide clinical assessments, and create treatment plans for common conditions.
- You CANNOT order lab tests, imaging, or procedures — recommend them with urgency level.
- You CANNOT provide fit-to-work certificates, legal medical opinions, or insurance documentation.
- For complex, chronic, or worsening conditions, ALWAYS recommend in-person follow-up.
- If you're unsure: "I'm not entirely certain about this — I'd recommend getting [specific test] to be sure. Here's what I think it could be and why."
- NEVER say "I'm just an AI" dismissively. Say "As an AI physician, my assessment based on what you've told me is..."
"""


def _build_patient_summary(metadata: dict) -> str:
    parts: List[str] = []

    patient = metadata.get("patient") or {}
    if isinstance(patient, dict):
        name = _sanitize_str(patient.get("name"), 100)
        age = _sanitize_str(patient.get("age"), 10)
        gender = _sanitize_str(patient.get("gender"), 30)

        identity = [s for s in (name, f"{age} years old" if age else "", gender) if s]
        if identity:
            parts.append(f"Patient: {', '.join(identity)}")

        vitals = []
        for key, label, unit in (
            ("blood_type", "Blood Type", ""),
            ("bmi", "BMI", ""),
            ("height", "Height", "cm"),
            ("weight", "Weight", "kg"),
            ("blood_pressure", "BP", ""),
        ):
            v = _sanitize_str(patient.get(key), 40)
            if v:
                vitals.append(f"{label}: {v}{unit}")
        if vitals:
            parts.append("Vitals: " + ", ".join(vitals))

        allergies = _sanitize_str(patient.get("allergies"), 300)
        if allergies:
            parts.append(f"ALLERGIES: {allergies}")
        conditions = _sanitize_str(patient.get("existing_conditions"), 400)
        if conditions:
            parts.append(f"Known Conditions: {conditions}")
        current_meds = _sanitize_str(patient.get("current_medications"), 400)
        if current_meds:
            parts.append(f"Medications (from profile): {current_meds}")

    meds = metadata.get("active_medications") or []
    if isinstance(meds, list) and meds:
        med_lines = []
        for m in meds[:15]:
            if not isinstance(m, dict):
                continue
            mname = _sanitize_str(m.get("name"), 80)
            if not mname:
                continue
            mdose = _sanitize_str(m.get("dosage"), 40)
            mfreq = _sanitize_str(m.get("frequency"), 40)
            med_lines.append(f"  - {mname} {mdose} ({mfreq})".strip())
        if med_lines:
            parts.append("Active Tracked Medications:\n" + "\n".join(med_lines))

    diagnoses = metadata.get("recent_diagnoses") or []
    if isinstance(diagnoses, list) and diagnoses:
        diag_lines = []
        for d in diagnoses[:10]:
            if not isinstance(d, dict):
                continue
            disease = _sanitize_str(d.get("disease"), 100)
            if not disease:
                continue
            symptoms = _sanitize_list(d.get("symptoms"), max_items=10, item_max_len=60)
            date = _sanitize_str(d.get("date"), 40)
            diag_lines.append(
                f"  - {disease} (symptoms: {', '.join(symptoms)}) — {date}"
            )
        if diag_lines:
            parts.append("Recent Platform Diagnoses (ML-predicted):\n" + "\n".join(diag_lines))

    journals = metadata.get("recent_journal") or []
    if isinstance(journals, list) and journals:
        journal_lines = []
        for j in journals[:10]:
            if not isinstance(j, dict):
                continue
            date = _sanitize_str(j.get("date"), 40)
            mood = _sanitize_str(j.get("mood"), 30) or "N/A"
            line = f"  - {date}: mood={mood}"
            if j.get("pain_level") is not None:
                pain = _sanitize_str(j.get("pain_level"), 10)
                if pain:
                    line += f", pain={pain}/10"
            symptoms = _sanitize_list(j.get("symptoms"), max_items=10, item_max_len=60)
            if symptoms:
                line += f", symptoms: {', '.join(symptoms)}"
            title = _sanitize_str(j.get("title"), 100)
            if title:
                line += f" — {title}"
            journal_lines.append(line)
        if journal_lines:
            parts.append("Recent Health Journal Entries:\n" + "\n".join(journal_lines))

    appointments = metadata.get("recent_appointments") or []
    if isinstance(appointments, list) and appointments:
        appt_lines = []
        for a in appointments[:10]:
            if not isinstance(a, dict):
                continue
            doctor = _sanitize_str(a.get("doctor"), 100)
            spec = _sanitize_str(a.get("specialization"), 80)
            date = _sanitize_str(a.get("date"), 40)
            status = _sanitize_str(a.get("status"), 40)
            appt_lines.append(f"  - {doctor} ({spec}) — {date} [{status}]")
        if appt_lines:
            parts.append("Recent Appointments:\n" + "\n".join(appt_lines))

    family = metadata.get("family_history") or []
    if isinstance(family, list) and family:
        fam_lines = []
        for f in family[:10]:
            if not isinstance(f, dict):
                continue
            conditions = _sanitize_list(f.get("conditions"), max_items=10, item_max_len=80)
            if conditions:
                relationship = _sanitize_str(f.get("relationship"), 60) or "Family member"
                fam_lines.append(f"  - {relationship}: {', '.join(conditions)}")
        if fam_lines:
            parts.append("Family Medical History:\n" + "\n".join(fam_lines))

    if not parts:
        return "No prior medical records available on the platform. This appears to be a new patient — take a thorough history."

    return "\n\n".join(parts)


class DoctorAgent(Agent):
    def __init__(self, instructions: str, chat_ctx: Optional[ChatContext] = None):
        super().__init__(instructions=instructions, chat_ctx=chat_ctx)


def prewarm(proc: JobProcess):
    try:
        proc.userdata["vad"] = silero.VAD.load()
    except Exception as e:
        logger.error(f"Failed to load Silero VAD: {e}", exc_info=True)
        raise


def _extract_text(item: Any) -> str:
    """Normalize a LiveKit ChatMessage payload into a single string.
    `item.content` can be a string, a list of strings, or contain non-string
    parts (function calls); we coerce defensively."""
    content = getattr(item, "content", None)
    if isinstance(content, list):
        return " ".join(str(c) for c in content if c).strip()
    if content is None:
        return ""
    return str(content).strip()


async def _save_consultation(
    transcript_lines: List[str],
    consultation_id: Optional[str],
    backend_url: Optional[str],
    user_token: Optional[str],
    started_at: float,
) -> None:
    """Post the captured transcript + duration back to the platform at
    end-of-call. Registered via ctx.add_shutdown_callback so it runs before
    the worker exits. Failures are logged but never raised — losing one
    transcript is better than crashing the cleanup path."""
    if not (consultation_id and backend_url and user_token):
        logger.warning("Skipping consultation save: missing context fields")
        return

    try:
        transcript = "\n".join(transcript_lines).strip()
        duration = max(0, int(time.time() - started_at))
        url = f"{backend_url.rstrip('/')}/consultations/{consultation_id}/summary"
        headers = {"Authorization": f"Bearer {user_token}"}
        payload = {"transcript": transcript, "duration_seconds": duration}

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
        logger.warning(
            "Saved consultation %s (duration=%ds, turns=%d, transcript_chars=%d)",
            consultation_id,
            duration,
            len(transcript_lines),
            len(transcript),
        )
    except Exception as e:
        logger.error(
            "Failed to save consultation %s: %s", consultation_id, e, exc_info=True
        )


async def _safe_wait_for_participant(ctx: JobContext) -> None:
    waiter = getattr(ctx, "wait_for_participant", None)
    if callable(waiter):
        try:
            coro = waiter()
            if asyncio.iscoroutine(coro):
                await asyncio.wait_for(coro, timeout=PARTICIPANT_WAIT_TIMEOUT_SECONDS)
                return
        except asyncio.TimeoutError:
            logger.warning("Timed out waiting for participant; greeting anyway")
            return
        except Exception as e:
            logger.warning(f"wait_for_participant failed: {e}; falling back to fixed delay")
    await asyncio.sleep(1.5)


async def entrypoint(ctx: JobContext):
    logger.warning(f"Agent connecting to room: {ctx.room.name}")
    session_started_at = time.time()

    patient_name = "there"
    patient_summary = "No patient records available."
    metadata: dict = {}

    try:
        metadata = json.loads(ctx.job.metadata or "{}")
        if not isinstance(metadata, dict):
            metadata = {}
        patient_summary = _build_patient_summary(metadata)
        patient = metadata.get("patient") or {}
        if isinstance(patient, dict):
            raw_name = (patient.get("name") or "").strip()
            if raw_name:
                first = _sanitize_str(raw_name.split()[0], 40)
                if first:
                    patient_name = first
        logger.warning("Patient context loaded")
    except json.JSONDecodeError as e:
        logger.warning(f"Patient metadata is not valid JSON: {e}")
    except Exception as e:
        logger.warning(f"Failed to parse patient metadata: {e}")

    consultation_id = metadata.get("consultation_id") if isinstance(metadata, dict) else None
    backend_url = metadata.get("backend_url") if isinstance(metadata, dict) else None
    user_token = metadata.get("user_token") if isinstance(metadata, dict) else None

    full_instructions = f"""{DOCTOR_INSTRUCTIONS}

## PATIENT CHART (reviewed before this call)

{patient_summary}

## SESSION NOTES

- Address the patient as "{patient_name}" naturally throughout the conversation.
- You have reviewed their chart above. Reference relevant history when clinically appropriate — don't recite the entire chart.
- If the patient mentions something that contradicts their records, gently clarify: "I see in your records that... has that changed?"
- Start by briefly introducing yourself and asking about their chief complaint today.
"""

    initial_ctx = ChatContext()
    initial_ctx.add_message(
        role="assistant",
        content=f"Patient chart loaded. Patient name: {patient_name}. Medical history has been reviewed. Ready to begin consultation.",
    )

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            voice="Aoede",
            temperature=0.6,
            instructions=full_instructions,
            modalities=["AUDIO"],
        ),
        vad=ctx.proc.userdata["vad"],
    )

    transcript_lines: List[str] = []

    @session.on("conversation_item_added")
    def _on_conversation_item(ev):
        try:
            item = getattr(ev, "item", None) or ev
            role = (getattr(item, "role", None) or "unknown").upper()
            text = _extract_text(item)
            if text:
                transcript_lines.append(f"{role}: {text}")
        except Exception as e:
            logger.warning("Transcript event handler error: %s", e)

    if consultation_id and backend_url and user_token:
        register_shutdown = getattr(ctx, "add_shutdown_callback", None)
        if callable(register_shutdown):
            register_shutdown(
                lambda: _save_consultation(
                    transcript_lines,
                    consultation_id,
                    backend_url,
                    user_token,
                    session_started_at,
                )
            )
            logger.warning(
                "Registered consultation-save hook for %s -> %s",
                consultation_id,
                backend_url,
            )

    session_started = False
    try:
        await session.start(
            agent=DoctorAgent(instructions=full_instructions, chat_ctx=initial_ctx),
            room=ctx.room,
        )
        session_started = True

        try:
            await asyncio.wait_for(ctx.connect(), timeout=CTX_CONNECT_TIMEOUT_SECONDS)
        except asyncio.TimeoutError:
            logger.error("Timed out connecting to LiveKit room")
            raise

        await _safe_wait_for_participant(ctx)

        greeting_prompt = (
            f"The patient {patient_name} has just joined the call. Greet them warmly "
            "by name. Briefly mention that you've reviewed their health records on the "
            "platform. Then ask what brings them in today. Keep it to 2-3 sentences — "
            "natural, warm, like a family doctor who knows them."
        )

        try:
            await asyncio.wait_for(
                session.generate_reply(instructions=greeting_prompt),
                timeout=GREETING_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            logger.warning("Greeting generation timed out; consultation will continue.")
    except Exception as e:
        logger.error(f"Session entrypoint failed: {e}", exc_info=True)
        raise
    finally:
        if session_started:
            close = getattr(session, "aclose", None) or getattr(session, "stop", None)
            if callable(close):
                try:
                    result = close()
                    if asyncio.iscoroutine(result):
                        await result
                except Exception as cleanup_err:
                    logger.warning(f"Session cleanup error: {cleanup_err}")


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="doctor-agent",
        )
    )
