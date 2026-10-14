"""
Disease prediction model retraining script.

Source dataset: DDXPlus (chandrashekar8/ddxplus on HuggingFace)
    NeurIPS 2022 benchmark, ~1.29M synthetic patient records,
    49 pathologies, 110 symptoms, 113 antecedents, plus
    age / sex / region / travel features.
    Released CC-BY by Mila / Quebec AI Institute.

Model: a single calibrated LightGBM multiclass classifier replaces the
previous RF + GaussianNB + SVC hard-voting ensemble.

Why this combo: DDXPlus is the academic SOTA dataset for
symptom-based differential diagnosis. Gradient-boosted decision trees
(LightGBM in particular) consistently outperform both traditional ML
ensembles and tabular deep-learning models on medical tabular
benchmarks (Yildiz & Kalayci 2024; Shmuel 2024). A single
CalibratedClassifierCV(LightGBM) gives calibrated probabilities
suitable for rendering a ranked differential diagnosis with confidence
scores at ~1 ms inference per request.

Outputs (written to ../backend/models/):
    lgbm_model.pkl.gz           CalibratedClassifierCV(LGBMClassifier), gzipped
    feature_map.pkl             dict: feature_name -> column_index
    label_map.pkl               dict: pathology_code -> class_index
    release_evidences.json      E_xx -> {question, type, possible_values, ...}
    release_conditions.json     patho_code -> {name, severity, icd10, ...}

backend/services/ml_service.py loads these at startup. The repo ships a
trained lgbm_model.pkl.gz, so running this script is only needed to retrain.

One-time install:
    pip install -r requirements.txt

Run:
    cd training
    python train.py
"""

from __future__ import annotations

import ast
import gzip
import json
import logging
import pickle
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, top_k_accuracy_score
from sklearn.model_selection import train_test_split

logging.basicConfig(format="%(asctime)s [%(levelname)s] %(message)s", level=logging.INFO)
log = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = REPO_ROOT / "backend" / "models"

DATASET_REPO = "aai530-group6/ddxplus"
DATASET_FILES = (
    ("train.csv",                "release_train_patients.csv"),
    ("validate.csv",             "release_validate_patients.csv"),
    ("test.csv",                 "release_test_patients.csv"),
    ("release_evidences.json",   None),
    ("release_conditions.json",  None),
)
RANDOM_STATE = 42
TEST_SIZE = 0.1
VAL_SIZE = 0.1
# Small trees, more boosting rounds: with short-symptom training data, 127-leaf
# trees all grow to the cap (2.4M leaves, ~880 MB of RAM). 31 leaves x 300
# rounds keeps ~450K leaves (~340 MB) with the same few-symptom accuracy.
LGBM_PARAMS = dict(
    n_estimators=300,
    learning_rate=0.10,
    max_depth=-1,
    num_leaves=31,
    min_child_samples=20,
    reg_lambda=1.0,
    n_jobs=-1,
    objective="multiclass",
    random_state=RANDOM_STATE,
    verbosity=-1,
)
SUBSAMPLE_FOR_CALIBRATION = 200_000

# The backend must fit in 512 MB (Render free tier). Memory grows with the
# total number of tree leaves: ~460K leaves -> ~340 MB, ~2.4M -> ~880 MB.
MAX_TOTAL_LEAVES = 600_000

# Real users enter only a few symptoms, but each DDXPlus patient has ~20.
# Training on extra copies of patients reduced to a random 2-8 evidences
# teaches the model to rank sensibly from short inputs (top-3 accuracy with
# 3 symptoms: ~57% without this, ~97% with it) without hurting full inputs.
MASKED_FRACTION = 0.5
MASK_MIN_EVIDENCES = 2
MASK_MAX_EVIDENCES = 8
EVAL_EVIDENCE_COUNTS = (2, 3, 4, 8)


def load_dataset() -> Tuple[pd.DataFrame, Dict[str, Any], Dict[str, Any]]:
    try:
        from datasets import load_dataset as hf_load
    except ImportError:
        log.error("Install dependencies: pip install -r requirements.txt")
        sys.exit(1)

    log.info("Downloading %s ...", DATASET_REPO)
    splits = hf_load(DATASET_REPO)
    dfs = []
    for split_name in ("train", "validation", "test"):
        if split_name in splits:
            d = splits[split_name].to_pandas()
            d["__split__"] = split_name
            dfs.append(d)
    if not dfs:
        log.error("No expected splits in dataset; got %s", list(splits.keys()))
        sys.exit(1)
    df = pd.concat(dfs, ignore_index=True)
    log.info("Loaded %d rows total", len(df))

    evidences_meta = _fetch_companion_json("release_evidences.json")
    conditions_meta = _fetch_companion_json("release_conditions.json")
    return df, evidences_meta, conditions_meta


def _fetch_companion_json(filename: str) -> Dict[str, Any]:
    """DDXPlus parquet bundles don't include the standalone JSON metadata
    files, so download them directly from the HF Hub repo instead."""
    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        log.warning("huggingface_hub unavailable; %s will be empty.", filename)
        return {}
    try:
        path = hf_hub_download(
            repo_id=DATASET_REPO,
            filename=filename,
            repo_type="dataset",
        )
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        log.warning("Failed to download %s from %s: %s", filename, DATASET_REPO, exc)
        return {}


def _parse_evidences(raw: Any) -> List[str]:
    """The EVIDENCES field is a Python-literal list-of-strings (or
    already-decoded list). Each entry is either:
        E_xx              binary evidence present
        E_xx_@_V_yy       categorical/multi-choice with value V_yy
    Returns the raw tokens; each unique token becomes one binary feature.
    """
    if isinstance(raw, list):
        items = raw
    elif isinstance(raw, str) and raw.strip().startswith("["):
        try:
            items = ast.literal_eval(raw)
        except (ValueError, SyntaxError):
            return []
    else:
        return []
    return [str(s).strip() for s in items if s]


def build_feature_map(df: pd.DataFrame) -> Dict[str, int]:
    tokens: Counter = Counter()
    for raw in df["EVIDENCES"].values:
        tokens.update(_parse_evidences(raw))
    log.info("Found %d unique evidence tokens", len(tokens))

    feature_names = sorted(tokens.keys())
    feature_names.append("__AGE__")
    feature_names.append("__SEX_F__")
    return {name: idx for idx, name in enumerate(feature_names)}


def vectorize(df: pd.DataFrame, feature_map: Dict[str, int]) -> np.ndarray:
    n = len(df)
    d = len(feature_map)
    X = np.zeros((n, d), dtype=np.float32)

    age_col = feature_map["__AGE__"]
    sex_col = feature_map["__SEX_F__"]

    for row_idx, raw in enumerate(df["EVIDENCES"].values):
        for tok in _parse_evidences(raw):
            col = feature_map.get(tok)
            if col is not None:
                X[row_idx, col] = 1.0

    if "AGE" in df.columns:
        ages = pd.to_numeric(df["AGE"], errors="coerce").fillna(0).to_numpy(dtype=np.float32)
        X[:, age_col] = ages
    if "SEX" in df.columns:
        X[:, sex_col] = (df["SEX"].astype(str).str.upper() == "F").to_numpy(dtype=np.float32)
    return X


def build_labels(df: pd.DataFrame) -> Tuple[np.ndarray, Dict[str, int]]:
    if "PATHOLOGY" not in df.columns:
        log.error("Expected PATHOLOGY column; got %s", df.columns.tolist())
        sys.exit(1)
    labels_str = df["PATHOLOGY"].astype(str).str.strip().to_numpy()
    classes = sorted(set(labels_str))
    label_map = {name: idx for idx, name in enumerate(classes)}
    y = np.array([label_map[name] for name in labels_str], dtype=np.int32)
    log.info("Label space: %d pathologies", len(classes))
    return y, label_map


def train_lightgbm(X_train, y_train, num_classes: int):
    try:
        from lightgbm import LGBMClassifier
    except ImportError:
        log.error("lightgbm not installed; run pip install -r requirements.txt")
        sys.exit(1)

    params = dict(LGBM_PARAMS)
    params["num_class"] = num_classes

    log.info(
        "Training LGBMClassifier (n=%d, classes=%d, features=%d)...",
        X_train.shape[0],
        num_classes,
        X_train.shape[1],
    )
    base = LGBMClassifier(**params)
    base.fit(X_train, y_train)

    total_leaves = sum(
        int(n) for n in re.findall(r"^num_leaves=(\d+)", base.booster_.model_to_string(), re.M)
    )
    log.info("Model size: %d trees, %d leaves in total", base.booster_.num_trees(), total_leaves)
    if total_leaves > MAX_TOTAL_LEAVES:
        log.warning(
            "Model has %d leaves (budget %d): the backend may exceed 512 MB of RAM. "
            "Lower num_leaves or n_estimators in LGBM_PARAMS.",
            total_leaves, MAX_TOTAL_LEAVES,
        )
    return base


def calibrate(base, X_cal, y_cal):
    """Calibrate the already-trained model on the held-out calibration split.

    The base model is frozen, so the calibrated classifier holds a single
    LightGBM copy (trained on the full train split) plus small isotonic
    regressors. Cross-validated calibration (cv=N) would instead refit N
    fresh models on the much smaller calibration split, discarding the main
    model and multiplying memory use (~3x), which no longer fits a 512 MB host.
    """
    log.info("Calibrating the trained model on %d held-out samples...", len(X_cal))
    try:
        from sklearn.frozen import FrozenEstimator  # scikit-learn >= 1.6

        calibrated = CalibratedClassifierCV(FrozenEstimator(base), method="isotonic")
    except ImportError:
        calibrated = CalibratedClassifierCV(base, method="isotonic", cv="prefit")
    calibrated.fit(X_cal, y_cal)
    return calibrated


def mask_evidences(X: np.ndarray, feature_map: Dict[str, int], rng: np.random.Generator,
                   k_min: int, k_max: int) -> np.ndarray:
    """Copy of X where each row keeps only k random evidence columns
    (k drawn from [k_min, k_max]); age and sex are always kept."""
    keep_cols = {feature_map["__AGE__"], feature_map["__SEX_F__"]}
    evidence_mask = np.ones(X.shape[1], dtype=bool)
    evidence_mask[list(keep_cols)] = False
    out = X.copy()
    for i in range(out.shape[0]):
        present = np.flatnonzero(out[i] * evidence_mask)
        k = int(rng.integers(k_min, k_max + 1))
        if len(present) > k:
            drop = rng.choice(present, len(present) - k, replace=False)
            out[i, drop] = 0.0
    return out


def evaluate(model, X_test, y_test, label_map: Dict[str, int],
             feature_map: Optional[Dict[str, int]] = None) -> None:
    probs = model.predict_proba(X_test)
    preds = probs.argmax(axis=1)
    classes = np.arange(len(label_map))

    top1 = accuracy_score(y_test, preds)
    top3 = top_k_accuracy_score(y_test, probs, k=3, labels=classes)
    top5 = top_k_accuracy_score(y_test, probs, k=5, labels=classes)

    print()
    print("=" * 64)
    print(f"{'Metric':<24} {'Value':<12}")
    print("-" * 64)
    print(f"{'Top-1 accuracy':<24} {top1:.4f}")
    print(f"{'Top-3 accuracy':<24} {top3:.4f}")
    print(f"{'Top-5 accuracy':<24} {top5:.4f}")
    print("=" * 64)

    if feature_map is not None:
        # How the model does when a user enters only a few symptoms
        rng = np.random.default_rng(RANDOM_STATE + 1)
        print(f"{'Symptoms entered':<24} {'Top-1':<10} {'Top-3':<10}")
        print("-" * 64)
        for k in EVAL_EVIDENCE_COUNTS:
            Xk = mask_evidences(X_test, feature_map, rng, k, k)
            pk = model.predict_proba(Xk)
            t1 = accuracy_score(y_test, pk.argmax(axis=1))
            t3 = top_k_accuracy_score(y_test, pk, k=3, labels=classes)
            print(f"{k:<24} {t1:<10.4f} {t3:<10.4f}")
        print("=" * 64)
    print()


def save_artifacts(
    model,
    feature_map: Dict[str, int],
    label_map: Dict[str, int],
    evidences_meta: Dict[str, Any],
    conditions_meta: Dict[str, Any],
) -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # Gzipped (~53 MB -> ~20 MB) to keep the repo small
    log.info("Writing lgbm_model.pkl.gz (calibrated LightGBM, gzipped)")
    with gzip.open(MODELS_DIR / "lgbm_model.pkl.gz", "wb", compresslevel=9) as f:
        pickle.dump(model, f)
    # Remove an uncompressed model from older runs so it can't go stale
    (MODELS_DIR / "lgbm_model.pkl").unlink(missing_ok=True)

    log.info("Writing feature_map.pkl (%d features)", len(feature_map))
    with open(MODELS_DIR / "feature_map.pkl", "wb") as f:
        pickle.dump(feature_map, f)

    log.info("Writing label_map.pkl (%d pathologies)", len(label_map))
    with open(MODELS_DIR / "label_map.pkl", "wb") as f:
        pickle.dump(label_map, f)

    with open(MODELS_DIR / "release_evidences.json", "w", encoding="utf-8") as f:
        json.dump(evidences_meta, f, ensure_ascii=False, indent=2)
    log.info("Writing release_evidences.json (%d entries)", len(evidences_meta))

    with open(MODELS_DIR / "release_conditions.json", "w", encoding="utf-8") as f:
        json.dump(conditions_meta, f, ensure_ascii=False, indent=2)
    log.info("Writing release_conditions.json (%d entries)", len(conditions_meta))


def main() -> None:
    log.info("Models will be written to %s", MODELS_DIR)
    df, evidences_meta, conditions_meta = load_dataset()

    log.info("Building feature map from EVIDENCES tokens + age/sex...")
    feature_map = build_feature_map(df)
    log.info(
        "Vectorising %d rows into (%d, %d) feature matrix...",
        len(df),
        len(df),
        len(feature_map),
    )
    X = vectorize(df, feature_map)
    y, label_map = build_labels(df)
    del df

    X_train_full, X_test, y_train_full, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )
    del X
    X_train, X_cal, y_train, y_cal = train_test_split(
        X_train_full, y_train_full,
        test_size=VAL_SIZE,
        random_state=RANDOM_STATE,
        stratify=y_train_full,
    )
    del X_train_full, y_train_full
    log.info(
        "Splits: train=%d, calibration=%d, test=%d",
        X_train.shape[0],
        X_cal.shape[0],
        X_test.shape[0],
    )

    rng = np.random.default_rng(RANDOM_STATE)
    n_masked = int(len(X_train) * MASKED_FRACTION)
    log.info(
        "Adding %d copies of training patients reduced to %d-%d evidences...",
        n_masked, MASK_MIN_EVIDENCES, MASK_MAX_EVIDENCES,
    )
    pick = rng.choice(len(X_train), n_masked, replace=False)
    X_masked = mask_evidences(X_train[pick], feature_map, rng, MASK_MIN_EVIDENCES, MASK_MAX_EVIDENCES)
    X_train = np.vstack([X_train, X_masked])
    y_train = np.concatenate([y_train, y_train[pick]])
    del X_masked

    base = train_lightgbm(X_train, y_train, num_classes=len(label_map))
    del X_train, y_train

    if len(X_cal) > SUBSAMPLE_FOR_CALIBRATION:
        idx = rng.choice(len(X_cal), SUBSAMPLE_FOR_CALIBRATION, replace=False)
        X_cal_sub, y_cal_sub = X_cal[idx], y_cal[idx]
        log.info(
            "Subsampled calibration set to %d for tractable wall-time.",
            SUBSAMPLE_FOR_CALIBRATION,
        )
    else:
        X_cal_sub, y_cal_sub = X_cal, y_cal

    # Calibrate on the same full/short mix the model was trained for
    half = rng.choice(len(X_cal_sub), len(X_cal_sub) // 2, replace=False)
    X_cal_sub = X_cal_sub.copy()
    X_cal_sub[half] = mask_evidences(X_cal_sub[half], feature_map, rng, MASK_MIN_EVIDENCES, MASK_MAX_EVIDENCES)

    model = calibrate(base, X_cal_sub, y_cal_sub)
    evaluate(model, X_test, y_test, label_map, feature_map)
    save_artifacts(model, feature_map, label_map, evidences_meta, conditions_meta)

    log.info(
        "Done. Restart the backend to load the new model."
    )


if __name__ == "__main__":
    main()
