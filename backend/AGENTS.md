# AGENTS.md — backend

Read the root `AGENTS.md` first. This file is backend-only conventions. Owner: **Josh**.

## Stack

- Node.js + Express.
- PostgreSQL via Prisma (`prisma/schema.prisma` is the source of truth for the schema —
  run a migration, don't hand-edit the database).
- Auth: JWT (short-lived access token + refresh token), passwords hashed with bcrypt.
- Calls out to the ML service over REST — never import Python or reimplement ML logic here.

## Folder map

```
src/
├── server.js / app.js
├── config/       # db.js, env.js — all env var reads happen here, nowhere else
├── models/       # Prisma-generated + any thin domain wrappers: User, Farm, Field,
│                 # SoilTest, Recommendation, FertilizerLog
├── routes/       # auth, farm, field, recommendation, weather
├── controllers/   # request handling per route
├── middleware/    # auth.middleware.js, error.middleware.js, validate.middleware.js
├── services/      # mlService.js (calls the ML FastAPI service), weatherService.js
└── utils/
```

## Conventions

- The request/response shape you send to and expect from the ML service (`services/mlService.js`)
  must match `docs/api-contract.md` exactly. If the shape needs to change, update that doc in
  the same PR — Saloni builds against it independently.
- Validate all incoming request bodies (a `validate.middleware.js` schema per route) before they
  hit a controller — don't trust frontend input.
- Every route that touches user/farm data checks the authenticated user owns that resource.
- Migrations: `npx prisma migrate dev --name <what_changed>`, committed alongside the schema change.
- Don't call the weather API or the ML service directly from a controller — always go through
  `services/`, so retries/timeouts/mocking live in one place.

## Commands

```bash
npm install
npx prisma migrate dev
npm run dev
```

`docker-compose up` at the repo root starts Postgres + this service + the ML service together.
