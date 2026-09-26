# AGENTS.md — KhetGPT

Canonical context for any AI coding agent (Claude Code, Antigravity/Gemini CLI, Codex, Cursor, etc.)
working in this repo. `CLAUDE.md` and `GEMINI.md` at the root just point here — this file is the
one to keep up to date.

## What this project is

KhetGPT — a data-driven fertilizer optimization app (PSAI01: Sustainable Fertilizer Usage
Optimizer). It recommends fertilizer type, quantity, and application schedule based on soil
health, crop type, growth stage, prior fertilizer usage, and local weather, and flags the
soil-degradation risk of over-/under-application. Full requirements: `docs/PRD.md`.

## Repo layout (see docs/PRD.md §7 for the full tree)

- `frontend/` — React (Vite, JS) + React Three Fiber/drei + GSAP + Tailwind + Zustand. Owner: Darsh.
- `backend/` — Node.js/Express + PostgreSQL (Prisma) + JWT auth. Owner: Josh.
- `ml/` — Python + scikit-learn/XGBoost + FastAPI serving. Owners: Saloni (models/api),
  Richa (data/weather/evaluation).
- `docs/` — PRD, architecture notes, and `api-contract.md` — the source of truth for the
  backend ⇄ ML request/response shape. Read `api-contract.md` before changing either side
  of that boundary.

Each of `frontend/`, `backend/`, `ml/` has its own `AGENTS.md` with area-specific conventions.
An agent working inside one of those folders should read the nearer file too.

## Cross-cutting rules

- Stay inside your area's folder. Don't reach into another service's folder to "fix" something —
  flag it in `docs/api-contract.md` or ask the human instead; the four areas are owned by
  different people working on separate git branches (see `docs/PRD.md` §8), so cross-folder
  edits are the most common source of merge conflicts.
- Never commit secrets. Each service has its own `.env`, none of them committed — see `.gitignore`.
  Add new env vars to that service's `.env.example`, not `.env`.
- Keep the backend ⇄ ML contract (`docs/api-contract.md`) in sync with the actual request/response
  code on both sides. If you change one, update the doc in the same change.
- Region/crop/fertilizer reference numbers belong in data/config files (`ml/data/`, or a backend
  config table), never hardcoded in application logic.
- Commit messages: `<area>: <what changed>`, e.g. `ml: add XGBoost quantity regressor`.

## Commands

Run these from inside the relevant service folder, not the repo root.

```bash
# frontend
npm install && npm run dev

# backend
npm install && npx prisma migrate dev && npm run dev

# ml
pip install -r requirements.txt
uvicorn src.api.main:app --reload --port 8001
```

`docker-compose up` at the repo root brings up backend + ml + Postgres together.

## Team

| Person | Area |
|---|---|
| Saloni | AI/ML — models, FastAPI serving |
| Richa | AI/ML — data pipeline, weather, evaluation |
| Josh | Backend — auth, database, API |
| Darsh | Frontend — UI, 3D, animation |

Full work breakdown and rationale: `docs/PRD.md` §9.
