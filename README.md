# KhetGPT

An AI/ML-powered fertilizer optimization system that recommends the right fertilizer type,
quantity, and application time based on soil health, crop type, growth stage, and weather
conditions. Built for SIH PSAI01 — Sustainable Fertilizer Usage Optimizer.

Full requirements, tech stack, architecture, and team ownership: [`docs/PRD.md`](docs/PRD.md).

## Structure

- `frontend/` — React + React Three Fiber + GSAP + Tailwind + Zustand
- `backend/` — Node.js/Express + PostgreSQL (Prisma) + JWT auth
- `ml/` — Python + scikit-learn/XGBoost + FastAPI serving

See each folder's `AGENTS.md` for setup commands and conventions. AI coding agents (Claude
Code, Antigravity, etc.) should read `AGENTS.md` at the repo root first.

## Team

Saloni & Richa (AI/ML) · Josh (Backend) · Darsh (Frontend) — see `docs/PRD.md` §9 for the
detailed breakdown.
