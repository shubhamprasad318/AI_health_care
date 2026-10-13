# Disease Prediction Model: Training

This folder builds the model behind the **Predict Disease** feature. It downloads the
[DDXPlus](https://huggingface.co/datasets/aai530-group6/ddxplus) dataset, trains a
calibrated LightGBM classifier and writes the model files into `backend/models/`.

> **You must run this once after cloning.** The trained model (`lgbm_model.pkl`) is
> too large for GitHub (over 100 MB), so it is not in the repo. Until you generate it,
> the backend starts normally but disease prediction is unavailable.

## Quick start

From the repo root:

```bash
bash training/setup_model.sh
```

That's it. The script:

1. Creates a virtual environment in `training/.venv`
2. Installs the dependencies from `requirements.txt`
3. Downloads DDXPlus from Hugging Face (about 1 GB, cached for later runs)
4. Trains and evaluates the model
5. Writes the model files to `backend/models/`

Then restart the backend so it loads the new model.

| Option | What it does |
|---|---|
| *(none)* | Train, unless `backend/models/lgbm_model.pkl` already exists |
| `--force` | Retrain even if the model already exists |
| `--download-only` | Only download and cache the dataset, don't train |

Set `PYTHON=python3.11` (or similar) to choose which Python creates the environment.

## Requirements

- **Python 3.9 or newer**
- **About 8 GB of free RAM.** The full feature matrix is about 1.16M rows × 517 columns.
- **About 2 GB of free disk** for the dataset cache and the model
- **macOS only:** LightGBM needs OpenMP: `brew install libomp`
- **Time:** about 10 minutes on an Apple Silicon laptop, longer on older machines

## Running the steps manually

Use this on Windows, or if you prefer to control each step:

```bash
cd training
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python download_dataset.py         # optional: just download and print a summary
python train.py                    # download (if needed) + train + save
```

## What gets created

All files go to `backend/models/`:

| File | Size | In git? | Purpose |
|---|---|---|---|
| `lgbm_model.pkl` | ~150 MB | No (too large) | The trained, calibrated LightGBM classifier |
| `feature_map.pkl` | ~7 KB | Yes | Maps each feature (symptom, age, sex) to a column index |
| `label_map.pkl` | ~1 KB | Yes | Maps each of the 49 conditions to a class index |
| `release_evidences.json` | ~150 KB | Yes | The symptom questions shown in the UI |
| `release_conditions.json` | ~30 KB | Yes | Condition names, severity and ICD-10 codes |

The small files must stay in sync with `lgbm_model.pkl`. If you retrain and the
feature or label maps change, commit the new versions too.

## How training works

`train.py` runs these steps:

1. **Load:** downloads all DDXPlus splits (about 1.16M synthetic patients, 49 conditions)
   plus the evidence and condition metadata.
2. **Vectorise:** turns each patient's evidences (symptoms and medical history), age and
   sex into a fixed-length feature vector (517 features).
3. **Split:** 80% train, 10% calibration, 10% held-out test, stratified by condition.
4. **Train:** fits a multiclass `LGBMClassifier`.
5. **Calibrate:** wraps it in `CalibratedClassifierCV` so the probabilities shown to users
   are meaningful, not just a ranking.
6. **Evaluate:** prints Top-1, Top-3 and Top-5 accuracy on the test set
   (expect about 99.7% Top-1).
7. **Save:** writes the files listed above.

The hyperparameters (`LGBM_PARAMS`), split sizes and random seed are constants at the
top of `train.py`.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Library not loaded: libomp.dylib` | `brew install libomp` (macOS) |
| Download is slow or rate-limited | Create a free Hugging Face token and run `export HF_TOKEN=...` first |
| Process is killed partway through | Not enough RAM. Close other apps or use a machine with more memory |
| Backend logs `Model files missing` | Training hasn't been run yet, or files were written elsewhere. Check `backend/models/` |
| Predictions look wrong after retraining | Make sure all five files come from the same training run |

## Dataset licence

DDXPlus is released by Mila under
[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). If you use it, cite:

> Fansi Tchango, A., Goel, R., Wen, Z., Martel, J., & Ghosn, J. (2022).
> *DDXPlus: A New Dataset For Automatic Medical Diagnosis.* NeurIPS 2022 Datasets and Benchmarks Track.

Results are on synthetic patients. Real-world accuracy will be lower, and the model is
not a medical device.
