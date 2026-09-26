# AGENTS.md — ml

Read the root `AGENTS.md` first. This file is ML-only conventions. Owners: **Saloni** (`src/api/`, `src/engine/`, `src/models/`) and **Richa** (`data/`, `src/data_pipeline/`, `src/weather/`, `src/degradation/`, `src/evaluation/`).

## Stack

- Python 3.11+, pandas/numpy, scikit-learn + XGBoost.
- FastAPI for serving (`src/api/main.py`), Pydantic schemas for request and response validation.
- `joblib` for model persistence. Artifacts go in `models_artifacts/` (gitignored), not in git.
- The service is stateless: no database access.

## Folder map

```
data/{raw,processed,external}/   raw and processed are gitignored. external/ holds sourced reference tables. See data/README.md
notebooks/                        exploration only. Nothing in src/ imports from it
src/
├── api/             SALONI  main.py, schemas.py, endpoints/ (recommend, risk_score, health, reference)
├── engine/          SALONI  npk_calculator.py (deficit formula), recommendation_engine.py (schedule, cost, blend)
├── models/          SALONI  train.py, fertilizer_model.py, predict.py, model_registry/
├── degradation/     RICHA   risk_analyzer.py (over/under-application risk and impact text)
├── data_pipeline/   RICHA   ingest.py, clean.py, feature_engineering.py, soil_data_loader.py
├── weather/         RICHA   weather_client.py (Open-Meteo)
└── evaluation/      RICHA   metrics.py, explainability.py
```

## Conventions

- The soil schema (`n`, `p`, `k`, `ph`, `organic_carbon`, `moisture`) is fixed by the problem statement. Never change it.
- `src/api/schemas.py` must match `docs/api-contract.md` exactly, and both must match `docs/contract-fixtures/`. Update the doc and fixtures in the same change.
- The core is the deficit formula in `engine/npk_calculator.py`. Every decision appends a rule-trace entry so explanations can be produced. The model only refines the product choice.
- Feature engineering lives in `data_pipeline/`. Training and serving import the same functions so they cannot drift.
- No agronomy number in code. Crop demand, efficiencies, prices, cut-offs and thresholds come from `data/external/` and every value has a source.
- Every trained model is saved with a version tag in `model_registry/`. Never overwrite a previous version silently. `model_version` is `<model>-<semver>+rules-<hash8>`.
- Seed everything and record it. Report metrics with baselines and confidence intervals. Use the test split once.
- Do not commit raw datasets or model artifacts. Document where to fetch each dataset in `data/README.md`.

## Commands

```bash
pip install -r requirements.txt
pytest -q && ruff check .
jupyter notebook                                  # for notebooks/
uvicorn src.api.main:app --reload --port 8001     # serve locally
```
