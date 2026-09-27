# API Contract: Frontend to Backend (v1.0)

Owned jointly by **Josh** (backend) and **Darsh** (frontend). Contract C3 in the team's shared
vocabulary. Written from the actual implemented routes/controllers/Prisma schema on
`feature/josh-backend`, not drafted ahead of the code — every shape and status code below is
what the running service actually does, verified directly (curl transcripts and the automated
test suite, `backend/tests/`), not assumed.

## How this maps to the ML contract (`docs/api-contract.md`, C1)

The backend calls the ML service (`src/services/mlService.js`) and re-shapes its snake_case
response into the camelCase `Recommendation` object below, stored in Postgres
(`prisma/schema.prisma`):

| ML contract (C1) | Backend (`Recommendation`) |
|---|---|
| `cost.estimated_cost_inr_per_acre` | `estimatedCost` |
| `cost.saving_inr_per_acre` | `estimatedSaving` |
| `risk.level` | `riskLevel` (`LOW`\|`MEDIUM`\|`HIGH`, uppercased) |
| `risk.reason` | `riskReason` |
| `risk.soil_health_impact` | `soilHealthImpact` |
| `risk.yield_impact` | `yieldImpact` |
| `explanation.nutrient_balance`, `explanation.formula` | inside the `explanation` Json column, as returned by the ML service |
| `recommendation.schedule` | `schedule` (Json column) |
| `weather.source` | `weatherSource` |
| `explanation.top_factors` | `topFactors` (`String[]`) |
| `model_version` | `modelVersion` |
| request `variety`, `sowing_date` | `Field.cropVariety`, `Field.sowingDate` (already on the schema; sourced from the field unless overridden per-request) |

The soil schema (`n`, `p`, `k`, `ph`, `organicCarbon`, `moisture`) is fixed by the problem
statement and is identical here to the ML contract's `soil` object — never renamed, never
extended.

## Conventions

- Base URL: `/api`.
- All request and response bodies are JSON, **camelCase** (the ML service's snake_case is
  translated at the boundary — see the mapping table above and `mlService.js`/each controller).
- **Error shape:** `{ "error": "<message>", "details"?: <zod .flatten() output> }`. `details`
  is only present on a `422` validation failure (`src/middleware/validate.middleware.js`).
- **Auth:** `Authorization: Bearer <accessToken>` on every route except
  `/auth/register`, `/auth/login`, `/auth/refresh`.
- **Pagination:** `?page=<n>&limit=<n>` (both optional, default page 1 / a default limit,
  capped at a max limit — `src/utils/pagination.js`) on every list endpoint. Response shape:
  `{ "items": [...], "page": 0, "limit": 0, "total": 0 }`.
- **Roles:** `FARMER` (default) and `AGRONOMIST` exist on `User.role`, but **no endpoint is
  currently role-gated** — both roles have identical permissions today. `AGRONOMIST` is
  reserved for the stretch regional-summary feature (J13, not built yet). Documented here as a
  known, deliberate gap, not an oversight.
- **Ownership:** every farm/field-scoped route checks the resource belongs to the
  authenticated user; a resource that exists but belongs to someone else returns the same
  `404 { error: "Not found" }` as a resource that doesn't exist at all (never a `403` that
  would confirm the resource's existence to someone who doesn't own it).

## Status codes used across this API

| Code | Meaning |
|---|---|
| `200` / `201` | Success (`201` for a resource creation; `200` for a duplicate recommendation request within the idempotency window, see below) |
| `204` | Success, no body (`DELETE /farms/:id`, `POST /auth/logout`) |
| `400` | A referenced id isn't valid in context (unknown `cropType`/`cropVariety`/`growthStage` against `/reference/crops`, unknown `fertilizerType` in a risk check, or the ML service rejected the request payload as invalid) |
| `401` | Missing/invalid/expired access token; wrong login credentials; invalid/reused/expired refresh token |
| `404` | Resource not found, **or** found but not owned by the caller |
| `409` | A prerequisite is missing (field has no `cropType`/`growthStage` set yet, or no soil test logged yet) |
| `422` | Request body failed validation (zod) |
| `429` | Rate limited (auth endpoints: 10 requests / 15 min in production; geocode: 30 / min) |
| `502` | The ML service is unreachable or returned something the backend couldn't parse |
| `503` | Live, cached and seasonal-average weather are all unavailable |

## `POST /auth/register`

```json
{ "email": "farmer@example.com", "password": "a-strong-password", "name": "Asha Singh", "role": "FARMER" }
```
`role` is optional, defaults to `FARMER`. `password` must be at least 10 characters.

**201**
```json
{
  "user": { "id": "uuid", "email": "farmer@example.com", "name": "Asha Singh", "role": "FARMER", "createdAt": "2026-...Z" },
  "accessToken": "<jwt>",
  "refreshToken": "<opaque token>"
}
```
`409 { "error": "Email already registered" }` if the email is taken.

## `POST /auth/login`

```json
{ "email": "farmer@example.com", "password": "a-strong-password" }
```
**200**: same shape as register's response. **401 `{ "error": "Invalid email or password" }`**
for either a wrong password or an unknown email — identical message and timing (a real
`bcrypt.compare` always runs, even against a dummy hash, so response time doesn't leak
whether the account exists).

## `POST /auth/refresh`

```json
{ "refreshToken": "<opaque token>" }
```
**200**: a **new** `{ accessToken, refreshToken }` pair — refresh tokens rotate on every use;
the presented token is immediately revoked. **401** if the token is unknown, expired, or
**already revoked** (`"Refresh token reuse detected — session revoked"` — presenting a token a
second time is treated as theft/replay and revokes every refresh token the user has, not just
the reused one).

## `POST /auth/logout`

Requires auth. Body: `{ "refreshToken": "<opaque token>" }`. **204**, no body. Revokes that one
refresh token.

## `GET /auth/me`

Requires auth. **200** `{ "id", "email", "name", "role", "createdAt" }` (no `passwordHash`,
ever, in any auth response).

## `GET /farms` · `POST /farms`

Requires auth. `GET`: paginated list of the caller's own farms
(`{ items: Farm[], page, limit, total }`). `POST` body: `{ "name": "Demo Farm" }` → **201**
`Farm`.

## `GET /farms/:id` · `DELETE /farms/:id`

Requires auth + ownership. `GET` → `Farm`. `DELETE` → **204** (cascades to every field, soil
test, fertilizer log and recommendation under it — see the schema's `onDelete: Cascade`).

## `GET /farms/:farmId/fields` · `POST /farms/:farmId/fields`

Requires auth + farm ownership. `GET`: paginated `Field[]`. `POST` body (all but `name`
optional):
```json
{
  "name": "Wheat Field 1", "areaAcres": 2.5, "latitude": 19.9975, "longitude": 73.7898,
  "pincode": "422001", "cropType": "wheat", "cropVariety": null, "growthStage": "sowing",
  "irrigation": "irrigated", "sowingDate": "2026-11-05"
}
```
`cropType`/`cropVariety`/`growthStage`, if given, are checked against `GET /reference/crops`
(`400` if unknown) -- **but if the reference service itself is down, field creation is not
blocked on it** (the check is skipped, not failed). **201** `Field`.

## `GET /fields/:id` · `PATCH /fields/:id`

Requires auth + ownership (via the field's farm). `GET` → `Field`. `PATCH` accepts the same
optional fields as field creation (minus `name`/`pincode`) → **200** updated `Field`.

## `GET /geocode?q=<place name>`

Requires auth. Rate-limited (30/min). Proxies Open-Meteo geocoding.

**200**
```json
[{ "name": "Mumbai", "admin": "Maharashtra", "latitude": 19.076, "longitude": 72.8777 }]
```
(Up to 5 results, India-scoped. Cached 24h per query.)

## `POST /fields/:id/soil-tests` · `GET /fields/:id/soil-tests`

Requires auth + field ownership. `POST` body: `{ "n", "p", "k", "ph", "organicCarbon",
"moisture", "testedOn"? }` (the same six fixed soil fields as the ML contract; `testedOn`
defaults to now) → **201** `SoilTest`. `GET`: paginated, newest-tested-first.

## `POST /fields/:id/fertilizer-logs` · `GET /fields/:id/fertilizer-logs`

Requires auth + field ownership. `POST` body: `{ "type": "urea", "quantityKgPerAcre": 200,
"appliedOn": "2026-03-25" }` (`appliedOn` cannot be in the future — **422** if it is) →
**201** `FertilizerLog`. `GET`: paginated, newest-applied-first.

## `GET /fields/:id/weather`

Requires auth + field ownership. **400** if the field has no latitude/longitude set.

**200**
```json
{
  "temperatureC": 28, "humidityPct": 70, "rainfallMmForecast": 10,
  "source": "live", "fetchedAt": "2026-...Z", "stale": false
}
```
`source` is `"live"`, `"cached"` (network hiccup, serving a copy under 6h old) or
`"seasonal_average"` (both live and cache failed). `stale` is `true` for anything but a fresh
live read. **503** if all three fail.

## `POST /fields/:id/recommendations` · `GET /fields/:id/recommendations` · `GET /recommendations/:id`

Requires auth + field ownership (the single-recommendation route checks ownership through the
recommendation's own field).

`POST` body (all optional -- override the field's own crop/variety/stage for this one call):
```json
{ "soilTestId": "uuid", "cropType": "wheat", "cropVariety": null, "growthStage": "sowing" }
```
Uses the field's latest soil test if `soilTestId` isn't given. **409** if the field (after any
override) still has no `cropType` or `growthStage`, or if there's no soil test at all.
**Idempotent for 30 seconds**: an identical request (same resolved crop/variety/stage/soil
test/weather/previous-usage) within 30s of the last one returns the **existing** recommendation
with **200**, not a new row -- a real repeated network retry doesn't create duplicate history
entries. Calls the ML service and Open-Meteo weather internally; **502** if the ML service is
unreachable or its response doesn't validate, **400** if the ML service reports the request
itself was invalid.

**201** (or 200 if idempotent-matched)
```json
{
  "id": "uuid", "fieldId": "uuid", "soilTestId": "uuid",
  "cropType": "wheat", "cropVariety": null, "growthStage": "sowing",
  "fertilizerType": "urea", "quantityKgPerAcre": 87.5,
  "schedule": [ { "stage": "sowing", "fertilizerType": "dap", "quantityKgPerAcre": 54.4, "applyBy": "2026-11-05", "timingNote": null } ],
  "risk": { "level": "medium", "reason": "...", "soilHealthImpact": "...", "yieldImpact": "..." },
  "topFactors": ["..."],
  "explanation": { "...": "the ML service's full explanation object, nutrient_balance/formula included" },
  "weatherSource": "live", "weatherStale": false,
  "estimatedCost": 2667, "estimatedSaving": 677, "savingTotal": 1692.5,
  "modelVersion": "fertilizer-classifier-0.1.0+rules-f22bca59",
  "createdAt": "2026-...Z"
}
```
`savingTotal` is `estimatedSaving * field.areaAcres` (null if either is null) -- the ML
contract's saving is per acre, this is the whole field.

`GET /fields/:id/recommendations`: paginated, **newest-first** (`orderBy createdAt desc`).
`GET /recommendations/:id`: a single recommendation by id (still ownership-checked).

## `POST /fields/:id/risk-check`

Requires auth + field ownership. Same prerequisite checks as creating a recommendation (409 if
no crop type/growth stage/soil test). Body:
```json
{ "plannedApplication": [{ "fertilizerType": "urea", "quantityKgPerAcre": 200 }] }
```
`plannedApplication` needs at least one item; each `fertilizerType` is checked against
`GET /reference/fertilizers` (**400** if unknown, before calling the ML service at all).

**200**
```json
{
  "risk": { "level": "high", "reason": "...", "soilHealthImpact": "...", "yieldImpact": "...", "overApplicationPct": 83.9 },
  "nutrientBalance": {
    "n": { "appliedKgHa": 227.3, "recommendedKgHa": 123.6, "ratio": 1.84 },
    "p": { "...": "same keys" },
    "k": { "...": "same keys" }
  }
}
```
This is a pure check -- nothing is written to the database.

## `GET /fields/:id/trends`

Requires auth + field ownership. Last 24 months, three independent time series a chart can
draw directly:

```json
{
  "soilTests": [{ "testedOn": "2026-...Z", "n": 210, "p": 9, "k": 90, "ph": 7.4, "organicCarbon": 0.42, "moisture": 18 }],
  "applied": [{ "month": "2026-03", "nitrogenKgAcre": 0, "p2o5KgAcre": 0, "k2oKgAcre": 0, "costInr": 0 }],
  "recommendations": [{ "createdAt": "2026-...Z", "fertilizerType": "urea", "quantityKgPerAcre": 87.5, "estimatedCost": 2667, "riskLevel": "MEDIUM", "fertilizerNeededN": 123.6, "fertilizerNeededP": 61.8, "fertilizerNeededK": 29.7 }]
}
```
`applied` aggregates logged `fertilizerLogs` into calendar months using each product's N/P2O5/K2O
percentages and price from `/reference/fertilizers` (a log for a product no longer in that
list is silently excluded from `applied`, not errored). Empty arrays, not an error, for a field
with no history yet.

## `GET /reference/crops` · `/reference/soil-ratings` · `/reference/fertilizers`

Requires auth. Proxied from the ML service (`ml/src/api/endpoints/reference.py`), cached with a
stale-while-revalidate fallback (fresh under 1h, stale-but-served under 24h, `503` past that
if the ML service is also down). Shapes are exactly the ML contract's
(`docs/api-contract.md`'s `GET /reference/*` section) -- this backend doesn't rename these
fields to camelCase since the ML service's own `id`/`name_en`/`n_pct` etc. are already the
public shape both frontend and backend consume as-is.

## Known gaps (flagged, not hidden)

- No dedicated `.env.test` / CI job runs this test suite yet against a real Postgres instance
  (the CI workflow currently only runs `npm run lint` for the backend) -- the 34 tests in
  `backend/tests/` are currently only verified to pass locally. Worth closing before J10's
  "CI run is green" is truly meaningful for the backend.
- `AGRONOMIST` role has no differentiated permissions yet (see "Roles" above).
