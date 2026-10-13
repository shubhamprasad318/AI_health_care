"""DDXPlus disease prediction service.

Loads the calibrated LightGBM model produced by ../../training/train.py
and exposes top-K differential diagnosis. The previous RF + GaussianNB +
SVC ensemble was replaced because DDXPlus (NeurIPS 2022) is the SOTA
dataset for this task and gradient-boosted decision trees outperform
both traditional ML ensembles and tabular deep-learning on it.

Public surface:
    load_models()                       async, called at app startup
    are_models_loaded() -> bool
    predict_disease(evidences, age, sex, top_k) -> list[dict]
                                        each dict has rank, pathology,
                                        probability, icd10
    get_available_evidences(language)   evidence catalog for the UI
    get_evidence_label(token, language) human-readable label for one
                                        evidence token, used to translate
                                        E_xx[_@_V_yy] into prompts for
                                        the LLM enhancement step
"""

from __future__ import annotations

import gzip
import json
import logging
import pickle
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)

_MODELS_DIR = Path(__file__).parent.parent / "models"

_MODEL = None
_FEATURE_MAP: Dict[str, int] = {}
_LABEL_MAP: Dict[str, int] = {}
_INDEX_TO_LABEL: Dict[int, str] = {}
_EVIDENCES_META: Dict[str, Any] = {}
_CONDITIONS_META: Dict[str, Any] = {}

_FEATURE_AGE = "__AGE__"
_FEATURE_SEX_F = "__SEX_F__"


async def load_models() -> None:
    global _MODEL, _FEATURE_MAP, _LABEL_MAP, _INDEX_TO_LABEL
    global _EVIDENCES_META, _CONDITIONS_META

    logger.info("[LOADING] DDXPlus LightGBM model + metadata...")
    try:
        # The model ships gzipped so it fits under GitHub's 100 MB file limit;
        # a plain lgbm_model.pkl from older training runs still works
        gz_path = _MODELS_DIR / "lgbm_model.pkl.gz"
        if gz_path.exists():
            with gzip.open(gz_path, "rb") as f:
                _MODEL = pickle.load(f)
        else:
            with open(_MODELS_DIR / "lgbm_model.pkl", "rb") as f:
                _MODEL = pickle.load(f)
        with open(_MODELS_DIR / "feature_map.pkl", "rb") as f:
            _FEATURE_MAP = pickle.load(f)
        with open(_MODELS_DIR / "label_map.pkl", "rb") as f:
            _LABEL_MAP = pickle.load(f)
        _INDEX_TO_LABEL = {v: k for k, v in _LABEL_MAP.items()}

        evidences_path = _MODELS_DIR / "release_evidences.json"
        if evidences_path.exists():
            with open(evidences_path, "r", encoding="utf-8") as f:
                _EVIDENCES_META = json.load(f)

        conditions_path = _MODELS_DIR / "release_conditions.json"
        if conditions_path.exists():
            with open(conditions_path, "r", encoding="utf-8") as f:
                _CONDITIONS_META = json.load(f)

        logger.info(
            "[OK] DDXPlus model loaded: %d features, %d pathologies, "
            "%d evidence definitions, %d condition definitions",
            len(_FEATURE_MAP),
            len(_LABEL_MAP),
            len(_EVIDENCES_META),
            len(_CONDITIONS_META),
        )
    except FileNotFoundError as e:
        logger.error(
            "[ERROR] Model files missing: %s. Run `bash training/setup_model.sh` to "
            "download DDXPlus and train the model (see training/README.md).",
            e,
        )
        _MODEL = None
    except Exception as e:
        logger.error("[ERROR] Failed to load DDXPlus model: %s", e, exc_info=True)
        _MODEL = None


def are_models_loaded() -> bool:
    return _MODEL is not None and bool(_FEATURE_MAP) and bool(_LABEL_MAP)


def _vectorize(
    evidences: List[str], age: Optional[int], sex: Optional[str]
) -> np.ndarray:
    x = np.zeros((1, len(_FEATURE_MAP)), dtype=np.float32)
    for tok in evidences:
        if not tok:
            continue
        col = _FEATURE_MAP.get(tok)
        if col is not None:
            x[0, col] = 1.0
    if age is not None and _FEATURE_AGE in _FEATURE_MAP:
        x[0, _FEATURE_MAP[_FEATURE_AGE]] = float(age)
    if sex and _FEATURE_SEX_F in _FEATURE_MAP:
        x[0, _FEATURE_MAP[_FEATURE_SEX_F]] = 1.0 if sex.upper() == "F" else 0.0
    return x


async def predict_disease(
    evidences: List[str],
    age: Optional[int] = None,
    sex: Optional[str] = None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    if not are_models_loaded():
        raise RuntimeError("ML model not loaded - prediction service unavailable")

    x = _vectorize(evidences, age, sex)
    probs = _MODEL.predict_proba(x)[0]
    top_k = max(1, min(top_k, len(probs)))
    top_indices = np.argsort(probs)[::-1][:top_k]

    differential = []
    for rank, idx in enumerate(top_indices, start=1):
        pathology = _INDEX_TO_LABEL.get(int(idx), "Unknown")
        meta = _CONDITIONS_META.get(pathology, {})
        differential.append(
            {
                "rank": rank,
                "pathology": pathology,
                "probability": float(probs[idx]),
                "icd10": meta.get("icd10-id"),
                "severity": meta.get("severity"),
            }
        )

    logger.info(
        "[PREDICT] top-1=%s (%.4f), evidences=%d, top-5 sum=%.4f",
        differential[0]["pathology"],
        differential[0]["probability"],
        len(evidences),
        sum(d["probability"] for d in differential),
    )
    return differential


def get_evidence_label(token: str, language: str = "en") -> str:
    """Translate `E_xx` or `E_xx_@_V_yy` into a human-readable string
    suitable for inclusion in prompts or UI labels. Falls back to the
    raw token when the evidence metadata file is missing."""
    if not token or token.startswith("__"):
        return token
    if "_@_" in token:
        base, value = token.split("_@_", 1)
    else:
        base, value = token, None

    meta = _EVIDENCES_META.get(base, {})
    question = (
        meta.get(f"question_{language}") or meta.get("question_en") or base
    )
    if value is None:
        return question
    value_meta = (meta.get("value_meaning") or {}).get(value, {})
    value_label = (
        value_meta.get(language) or value_meta.get("en") or value
    )
    return f"{question} - {value_label}"


def get_available_evidences(language: str = "en") -> List[Dict[str, Any]]:
    """Catalog of distinct evidence questions for the symptom picker.
    Each entry collapses all `E_xx_@_V_yy` variants of the same `E_xx`
    into a single record with its possible values."""
    catalog: Dict[str, Dict[str, Any]] = {}
    for token in _FEATURE_MAP:
        if token.startswith("__"):
            continue
        base = token.split("_@_", 1)[0]
        meta = _EVIDENCES_META.get(base, {})
        entry = catalog.setdefault(
            base,
            {
                "code": base,
                "question": meta.get(f"question_{language}")
                or meta.get("question_en")
                or base,
                "type": meta.get("data_type", "B"),
                "is_antecedent": bool(meta.get("is_antecedent")),
                "possible_values": [],
            },
        )
        if "_@_" in token:
            value_code = token.split("_@_", 1)[1]
            value_meta = (meta.get("value_meaning") or {}).get(value_code, {})
            entry["possible_values"].append(
                {
                    "code": value_code,
                    "token": token,
                    "label": value_meta.get(language)
                    or value_meta.get("en")
                    or value_code,
                }
            )

    for entry in catalog.values():
        entry["possible_values"].sort(key=lambda v: v["label"].lower())
    return sorted(catalog.values(), key=lambda e: e["question"].lower())
