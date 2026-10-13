# Model files

The disease prediction service (`backend/services/ml_service.py`) loads these files at startup.

| File | In git? | Notes |
|---|---|---|
| `lgbm_model.pkl.gz` | Yes | Trained model, gzipped to ~50 MB to fit GitHub's 100 MB limit |
| `feature_map.pkl` | Yes | Feature name → column index |
| `label_map.pkl` | Yes | Condition code → class index |
| `release_evidences.json` | Yes | Symptom questions shown in the UI |
| `release_conditions.json` | Yes | Condition names, severity, ICD-10 codes |

## Retraining or missing model

To regenerate the model, from the repo root run:

```bash
bash training/setup_model.sh --force
```

It downloads the DDXPlus dataset, trains the model (about 10 minutes) and writes every file
here. Restart the backend afterwards. See [`training/README.md`](../../training/README.md)
for details and manual steps.

Without the model the backend still starts, but `/api/predict` endpoints return an error.
