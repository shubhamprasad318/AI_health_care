#!/usr/bin/env bash
# One-command setup for the disease prediction model.
#
# Creates training/.venv, installs dependencies, downloads DDXPlus and
# trains the model, writing all artifacts to backend/models/.
#
# Usage (from anywhere):
#   bash training/setup_model.sh            # skip if a trained model already exists
#   bash training/setup_model.sh --force    # retrain even if it exists
#   bash training/setup_model.sh --download-only

set -euo pipefail

TRAINING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$TRAINING_DIR/../backend/models"
VENV="$TRAINING_DIR/.venv"
PYTHON="${PYTHON:-python3}"

FORCE=0
DOWNLOAD_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    --download-only) DOWNLOAD_ONLY=1 ;;
    -h|--help)
      sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (use --help)" >&2
      exit 1
      ;;
  esac
done

if [[ $DOWNLOAD_ONLY -eq 0 && $FORCE -eq 0 ]] && \
   [[ -f "$MODELS_DIR/lgbm_model.pkl.gz" || -f "$MODELS_DIR/lgbm_model.pkl" ]]; then
  echo "A trained model already exists in backend/models/. Use --force to retrain."
  exit 0
fi

if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "Python 3.9+ is required but '$PYTHON' was not found." >&2
  exit 1
fi

# LightGBM on macOS needs the OpenMP runtime
if [[ "$(uname)" == "Darwin" ]] && command -v brew >/dev/null 2>&1; then
  if ! brew list libomp >/dev/null 2>&1; then
    echo "LightGBM needs libomp on macOS. Install it with: brew install libomp" >&2
    exit 1
  fi
fi

if [[ ! -d "$VENV" ]]; then
  echo "==> Creating virtual environment in training/.venv"
  "$PYTHON" -m venv "$VENV"
fi

echo "==> Installing dependencies"
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet -r "$TRAINING_DIR/requirements.txt"

cd "$TRAINING_DIR"
if [[ $DOWNLOAD_ONLY -eq 1 ]]; then
  echo "==> Downloading DDXPlus (no training)"
  "$VENV/bin/python" -u download_dataset.py
else
  echo "==> Downloading DDXPlus and training (takes roughly 10-30 minutes)"
  "$VENV/bin/python" -u train.py
  echo
  echo "Done. Model files are in backend/models/. Restart the backend to load them."
fi
