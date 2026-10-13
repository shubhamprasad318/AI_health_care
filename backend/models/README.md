# Model files

The disease prediction service (`backend/services/ml_service.py`) loads these files at startup.

| File | In git? | Notes |
|---|---|---|
| `lgbm_model.pkl` | **No** | ~150 MB, over GitHub's file limit. Generate it with the command below. |
| `feature_map.pkl` | Yes | Feature name → column index |
| `label_map.pkl` | Yes | Condition code → class index |
| `release_evidences.json` | Yes | Symptom questions shown in the UI |
| `release_conditions.json` | Yes | Condition names, severity, ICD-10 codes |

## Missing `lgbm_model.pkl`?

From the repo root, run:

```bash
bash training/setup_model.sh
```

It downloads the DDXPlus dataset, trains the model (about 10 minutes) and writes every file
here. Restart the backend afterwards. See [`training/README.md`](../../training/README.md)
for details and manual steps.

Without the model the backend still starts, but `/api/predict` endpoints return an error.
