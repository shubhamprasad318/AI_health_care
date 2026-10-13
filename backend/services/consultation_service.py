"""Voice consultation transcript summarization (Gemini-backed)."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict

from services.gemini_service import (
    _sanitize_user_input,
    call_gemini,
    is_gemini_available,
)

logger = logging.getLogger(__name__)

_MAX_TRANSCRIPT_CHARS = 12_000


async def summarize_consultation(transcript: str) -> Dict[str, Any]:
    """Extract a structured clinical summary from a voice-consultation
    transcript. Returns either the parsed JSON object or an error dict
    so the caller can persist whichever shape comes back."""
    if not is_gemini_available():
        return {"error": "AI summarization unavailable"}
    sanitized = _sanitize_user_input(transcript, max_len=_MAX_TRANSCRIPT_CHARS)
    if not sanitized:
        return {"error": "Empty transcript"}

    prompt = f"""You are reviewing a transcript of a voice consultation between
a patient and an AI doctor. Produce a structured clinical summary in STRICT JSON
that a physician can scan in 30 seconds.

TRANSCRIPT:
{sanitized}

Output STRICT JSON exactly in this format (no preamble, no markdown fences):
{{
  "chief_complaint": "1-2 sentence summary of why the patient sought consultation",
  "symptoms_mentioned": ["..."],
  "conditions_discussed": ["any pathologies the AI doctor named"],
  "recommendations": ["specific actions the AI suggested - OTC meds, lifestyle, follow-up"],
  "red_flags": ["any emergency advice given, empty list if none"],
  "follow_up_advised": "what the AI advised for follow-up, or empty string"
}}"""

    try:
        raw = await call_gemini(prompt)
    except asyncio.TimeoutError:
        return {"error": "Summary timed out"}
    except Exception as e:
        logger.error("Consultation summary call failed: %s", e, exc_info=True)
        return {"error": str(e)}

    clean = raw.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return {"summary": clean, "error": "Model returned non-JSON; raw text preserved"}
