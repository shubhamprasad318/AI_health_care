"""
Red flags for the symptom checker: when to tell the patient to seek care.

Two independent checks:
1. Warning-sign symptoms, a fixed rule list that runs whatever the model
   predicts. The model can miss a dangerous cause (it once ranked a heart
   condition 5th for breathlessness with near-fainting).
2. Life-threatening conditions the model itself rates as likely, for cases
   where no single warning sign was selected (e.g. fever after travel to West
   Africa, which points to Ebola).

Codes are DDXPlus evidences (see models/release_evidences.json).
"""

from typing import Dict, List, Optional

EMERGENCY = "emergency"
URGENT = "urgent"

# code -> (level on its own, plain-language label)
RED_FLAG_EVIDENCES: Dict[str, tuple] = {
    # Emergency on their own: possible heart attack, stroke, airway, bleeding
    "E_14": (EMERGENCY, "Chest pain at rest"),
    "E_159": (EMERGENCY, "Loss of consciousness"),
    "E_43": (EMERGENCY, "Seizure or fit"),
    "E_156": (EMERGENCY, "Weakness or drooping on one side of the face"),
    "E_63": (EMERGENCY, "Difficulty speaking"),
    "E_194": (EMERGENCY, "High-pitched noise when breathing in"),
    "E_210": (EMERGENCY, "Vomiting blood"),
    # Need medical care the same day
    "E_66": (URGENT, "Significant difficulty breathing"),
    "E_82": (URGENT, "Feeling faint or about to pass out"),
    "E_75": (URGENT, "Feeling of choking or suffocating"),
    "E_220": (URGENT, "Pain when breathing in deeply"),
    "E_164": (URGENT, "Very irregular heartbeat"),
    "E_13": (URGENT, "Symptoms brought on by less and less effort"),
    "E_45": (URGENT, "Coughing up blood"),
    "E_140": (URGENT, "Black, tar-like stools"),
    "E_179": (URGENT, "Blood in stools"),
    "E_178": (URGENT, "Unusual bleeding or bruising"),
    "E_39": (URGENT, "Confusion or disorientation"),
    "E_84": (URGENT, "Weakness in both arms or legs"),
    "E_52": (URGENT, "Double vision"),
    "E_205": (URGENT, "Sudden difficulty opening the mouth"),
}

# "Where is the swelling located?": the mouth, lips, tongue or throat can
# close the airway (anaphylaxis). Tonsils, cheeks and neck are left out.
SWELLING_LOCATION = "E_152"
AIRWAY_SWELLING_VALUES = {
    "V_32",   # mouth
    "V_33",   # thyroid cartilage (larynx)
    "V_61",   # above tongue
    "V_115",  # uvula
    "V_116",  # bottom lip
    "V_117",  # upper lip
    "V_148",  # pharynx
    "V_162",  # under tongue
}
AIRWAY_SWELLING_LABEL = "Swelling of the mouth, lips, tongue or throat"

# DDXPlus severity 1 = life-threatening. On held-out patients reduced to 3
# symptoms, warning at >= 20% catches ~91% of these cases with ~3.6% false
# alarms; 30% would miss ~20% of them.
LIFE_THREATENING_SEVERITY = 1
LIFE_THREATENING_MIN_PROBABILITY = 0.20
LIFE_THREATENING_LABELS = {
    "Possible NSTEMI / STEMI": "Possible heart attack",
    "Acute pulmonary edema": "Possible fluid on the lungs (acute pulmonary oedema)",
    "Anaphylaxis": "Possible severe allergic reaction (anaphylaxis)",
    "Larygospasm": "Possible spasm of the vocal cords (laryngospasm)",
    "Ebola": "Possible Ebola infection",
}

MESSAGES = {
    EMERGENCY: (
        "Some of your symptoms can be signs of a medical emergency. "
        "Call 112 or go to the nearest emergency department now. "
        "Don't wait for this result."
    ),
    URGENT: (
        "Some of your symptoms need prompt medical attention. "
        "See a doctor today, and call 112 if they get worse."
    ),
}


def assess_red_flags(
    evidences: List[str], differential: Optional[List[Dict]] = None
) -> Optional[Dict]:
    """Return {"level", "reasons", "message"} if the patient should seek
    care, else None. Two or more warning signs together count as an
    emergency (e.g. breathlessness with near-fainting)."""
    found: List[tuple] = []
    for token in evidences or []:
        if not isinstance(token, str):
            continue
        base, _, value = token.partition("_@_")
        hit = RED_FLAG_EVIDENCES.get(base)
        if base == SWELLING_LOCATION and value in AIRWAY_SWELLING_VALUES:
            hit = (EMERGENCY, AIRWAY_SWELLING_LABEL)
        if hit and hit not in found:
            found.append(hit)

    for d in differential or []:
        if (
            d.get("severity") == LIFE_THREATENING_SEVERITY
            and (d.get("probability") or 0) >= LIFE_THREATENING_MIN_PROBABILITY
        ):
            name = d.get("pathology", "")
            found.append((EMERGENCY, LIFE_THREATENING_LABELS.get(name, f"Possible {name}")))

    if not found:
        return None
    level = EMERGENCY if len(found) >= 2 or any(lvl == EMERGENCY for lvl, _ in found) else URGENT
    return {
        "level": level,
        "reasons": [label for _, label in found],
        "message": MESSAGES[level],
    }
