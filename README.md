# KhetGPT

An AI/ML-powered fertilizer optimization system. It recommends the fertilizer type, quantity and a dated application schedule from soil health, crop type, growth stage, previous usage and local weather, and warns about the soil-health and yield impact of over-application. Built for SIH PSAI01, Sustainable Fertilizer Usage Optimizer.

## Docs

- [`docs/PRD.md`](docs/PRD.md): requirements, stack, architecture, team
- [`docs/FEATURES.md`](docs/FEATURES.md): prioritised feature list
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): stack, file structure, decisions log
- [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md): branches, commits, merge order
- [`docs/TEAM_ASSIGNMENTS.md`](docs/TEAM_ASSIGNMENTS.md): who owns what
- [`docs/api-contract.md`](docs/api-contract.md): backend to ML contract
- [`docs/prompt-packs/`](docs/prompt-packs): step-by-step pack for each teammate
- [`AGENTS.md`](AGENTS.md): shared context for AI coding agents

## Structure

- `frontend/`: React + React Three Fiber + GSAP + Tailwind + Zustand
- `backend/`: Node.js/Express + PostgreSQL (Prisma) + JWT auth
- `ml/`: Python + FastAPI (dose engine, model, risk analyzer, weather)

## Team

| Person | Role | Branch |
|---|---|---|
| Saloni | AI/ML: engine, model, serving | `feature/saloni-ml-core` |
| Richa | AI/ML: data, weather, risk, evaluation | `feature/richa-ml-data` |
| Josh | Backend | `feature/josh-backend` |
| Darsh | Frontend | `feature/darsh-frontend` |
