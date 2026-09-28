# Backend demo prep

How to bring the backend up with real, story-driven demo data, where the demo login comes
from, and what to do if the ML service or Open-Meteo is unreachable on demo day. Scoped to the
backend/API layer -- for the actual click-through demo script (which screens to show, in what
order), see `frontend/DEMO.md`. The two use **different** logins; see "Demo credentials" below.

## 1. Bring the stack up with demo data

From the repo root, on a clean checkout:

```bash
# One-time: real secrets, never committed (see AGENTS.md's "One-command local stack" section)
cp backend/.env.example backend/.env
openssl rand -hex 32   # paste into backend/.env's JWT_ACCESS_SECRET
openssl rand -hex 32   # paste into backend/.env's JWT_REFRESH_SECRET
# Also set DEMO_FARMER_EMAIL / DEMO_FARMER_PASSWORD in backend/.env -- see "Demo credentials" below.

docker compose up -d --build
```

Wait for all three services to report healthy (`docker compose ps`), then seed the three demo
scenarios:

```bash
docker compose exec backend npm run db:seed:demo
```

This idempotently creates:
- the demo farmer (`DEMO_FARMER_EMAIL`/`DEMO_FARMER_PASSWORD`, see below),
- one farm + field + soil test + fertilizer log(s) per scenario in
  `docs/contract-fixtures/demo_scenarios.json` (wheat over-application, rice low-N + rain hold,
  healthy-looking maize that's actually over-applied -- see `docs/demo-scenarios.md` for the
  full story on each), and
- **one pre-generated recommendation per field**, created by actually calling the real,
  running `POST /fields/:id/recommendations` (so it goes through the real ML service and real
  Open-Meteo weather, not a fabricated row), so a judge clicking into History on any of the
  three fields sees a real entry immediately, not an empty state.

Re-running `npm run db:seed:demo` is safe -- it only creates a recommendation for a field that
doesn't already have one, and it re-applies the same date-anchoring described below on every
run, so it's also safe to run again the morning of the actual demo (see "Demo day" below).

**Verify it worked:**
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_FARMER_EMAIL\",\"password\":\"$DEMO_FARMER_PASSWORD\"}" \
  http://localhost:4000/api/auth/login | python3 -c "import json,sys;print(json.load(sys.stdin)['accessToken'])"
# then, with that token:
curl -s -H "Authorization: Bearer <token>" http://localhost:4000/api/farms
# expect 3 farms; GET /fields/fld_demo_wheat_overuse/recommendations should show total: 1
```

## 2. Demo credentials

`DEMO_FARMER_EMAIL` / `DEMO_FARMER_PASSWORD` in `backend/.env` (**never committed** --
`.gitignore` covers `.env`, only `.env.example`'s placeholder values are in the repo). Set these
to whatever you'll actually type in front of judges. If they're left unset, the seed script
falls back to a built-in `demo@khetgpt.local` / `DemoFarmer!2026` login and **says so loudly** in
its own output -- functional for a quick local check, but set real values in `.env` for the
actual demo so nobody's typing a value that's sitting in a public example file.

This is a **separate** login from `frontend/DEMO.md`'s own seed credentials
(`farmer@khetgpt.in` / `khetpass123`) and separate field data (`North Khet`/`East Paddy`/
`South Block`) -- that document's credentials work against the frontend's own built-in mock
fixtures (`VITE_USE_MOCK=true`, no backend involved at all), a different, independent fallback
path from anything here. Decide which login the actual demo will use ahead of time and brief
whoever's driving -- don't mix the two on stage.

The original `npm run db:seed` (no `:demo`) is unrelated to either -- it seeds a generic
`farmer@khetgpt.demo` / `Farmer@123` account with one made-up field, predating the three real
demo scenarios. Left in place for anyone who needs a minimal non-demo dataset (e.g. exercising
an endpoint by hand without caring about the story), but it's not what the actual demo should
use.

## 3. Demo day: reset to a clean state

```bash
docker compose exec backend npm run demo:reset
```

Deletes **only** the demo farmer's own farms (and everything under them, via the schema's
`onDelete: Cascade`) and re-seeds fresh -- never touches any other account, including one a
judge or tester registers during the demo itself. Run this:
- the morning of the demo, even if you already seeded once before -- see "why dates need
  re-anchoring" below, and
- any time the demo data gets into a messy state mid-rehearsal (an extra field added,
  something risk-checked into an odd row) and you want it back to the canonical three-scenario
  state without wiping the whole database (`npm run db:reset` does that instead, and takes
  every other account down with it -- don't reach for that on demo day).

**Why dates need re-anchoring, not just re-running the same fixture:** the three scenarios'
seed data (sowing date, soil-test date, fertilizer-log dates) are fixed 2026 calendar dates in
`docs/contract-fixtures/demo_scenarios.json`, but `POST /fields/:id/recommendations` always
asks the ML service using the real server clock, not a pinned date. `prisma/seed.js` shifts
every date by the same day-offset each scenario already has relative to its own `demo_today`,
so the seeded recommendation tells the same documented story
(`docs/demo-scenarios.md`'s "Verified outcome" tables) regardless of which real day this is run
on -- but that shift is computed fresh each run, so re-running `demo:reset` the morning of the
actual demo (not relying on a seed from days earlier) keeps it correctly anchored. This is the
same problem, and the same fix, as `ml/scripts/demo_requests.py` on the ML side -- see
`ml/DEMO_NOTES.md` for the full background if you want it.

## 4. If the ML service or Open-Meteo is down

**ML service unreachable:** `POST /fields/:id/recommendations` and `POST /fields/:id/risk-check`
return `502`; `GET /reference/*` falls back to a cached copy (fresh under 1h, stale-but-served
under 24h) and only `503`s past that. Two ways to keep the demo moving:

- **Already-seeded recommendations still work.** `GET /fields/:id/recommendations` and
  `GET /fields/:id/trends` read from Postgres, not the ML service -- if `npm run db:seed:demo`
  already ran successfully before the ML service went down, History and Trends for all three
  scenarios are unaffected. Only *creating a new* recommendation live, on stage, needs the ML
  service actually up.
- **`ML_MODE=offline`** (`backend/.env`, or override at the compose level:
  `ML_MODE=offline docker compose up backend`) serves `backend/config/reference.dev.json`
  instead of calling the ML service for `GET /reference/*` -- keeps crop/fertilizer/soil-rating
  reference data available so field creation's crop-type check doesn't silently degrade, but
  **does not** make `/recommendations` or `/risk-check` work without the ML service; those
  still need it reachable. If the ML service itself can't be brought back up in time, fall back
  to showing the three **already-seeded** recommendations (previous bullet) rather than trying
  to create new ones live.
- The ML service has its own equivalent fallback, `PREDICT_MODE=mock` (see `ml/DEMO_NOTES.md`)
  -- if the *model* is the problem (not the whole service being down), that keeps `/recommend`
  answering with clearly-labeled sample output instead of a hard failure, which still lets
  `POST /fields/:id/recommendations` succeed end to end.

**Open-Meteo (weather/geocode) unreachable:** `GET /fields/:id/weather` degrades through a real
fallback chain, not a hard failure -- `source` in the response is `"live"`, `"cached"` (serving
a copy under 6h old after a live failure), or `"seasonal_average"` (both live and cache failed);
`stale: true` for anything but a fresh live read. Only `503`s if all three are unavailable. This
also affects `POST /fields/:id/recommendations` internally (it calls the same weather lookup) --
a `weatherSource` of `"cached"` or `"seasonal_average"` on a live-created recommendation is
expected, not a bug, worth mentioning if a judge notices it rather than treating it as broken.
`GET /geocode` has no fallback (it's a direct proxy) -- if Open-Meteo's geocoding endpoint is
down, that one call fails; nothing else depends on it.
