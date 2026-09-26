# AGENTS.md — ml

Read the root `AGENTS.md` first. This file is ML-only conventions. Owners: **Saloni**
(`src/models/`, `src/api/`) and **Richa** (`src/data_pipeline/`, `src/weather/`, `src/evaluation/`).

## Stack

- Python 3.11+, pandas/numpy for data handling, scikit-learn + XGBoost for modeling.
- FastAPI for serving (`src/api/main.py`), Pydantic schemas for request/response validation.
- `joblib` for model persistence; trained artifacts go in `models_artifacts/` (gitignored —
  see the root `.gitignore`), not committed to git.

## Folder map

```
data/{raw,processed,external}/   # gitignored except a README + small samples — see data/README.md
notebooks/                        # EDA.ipynb, model_experiments.ipynb — exploration only,
                                   # nothing here is imported by src/
src/
├── data_pipeline/    # ingest.py, clean.py, feature_engineering.py         → Richa
├── weather/          # weather_client.py (OpenWeatherMap)                  → Richa
├── evaluation/        # metrics.py, explainability.py                      → Richa
├── models/            # train.py, predict.py, model_registry/               → Saloni
└── api/               # main.py (FastAPI app), schemas.py, endpoints/       → Saloni
```

## Conventions

- The `/predict` endpoint's request/response schema (`src/api/schemas.py`) must match
  `docs/api-contract.md` exactly — that's what Josh's backend builds against. Update the doc
  in the same change if the schema changes.
- Feature engineering lives in `data_pipeline/`, not inline in `train.py` or `main.py` — both
  training and serving import the same feature functions so they can never drift apart.
- Every trained model is saved with a version tag in `model_registry/` (filename or a small
  `registry.json` — don't overwrite the previous model file silently).
- Cross-check ML output against the ICAR/soil-health-card nutrient norms in `data/external/`
  as a sanity check, not just raw model output — this is also what feeds the
  "why this recommendation" explanation in `evaluation/explainability.py`.
- Don't commit raw datasets or `.pkl`/`.joblib` files — see the root `.gitignore`; document
  where to fetch each dataset in `data/README.md` instead.

## Commands

```bash
pip install -r requirements.txt
jupyter notebook                                  # for notebooks/
uvicorn src.api.main:app --reload --port 8001      # serve /predict locally
```
