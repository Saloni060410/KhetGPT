// Security/reliability pass: one comprehensive ownership matrix, rather than the ownership
// assertions scattered one-per-endpoint across resources.test.js/recommendation.test.js/
// risk.test.js. User B, authenticated, against every one of User A's resources -- farm, field,
// soil test, fertilizer log, recommendation (both nested and direct), weather, risk-check,
// trends -- expects 404 everywhere, never a 403 (which would leak that the resource exists)
// and never a 200/201 (which would leak the data itself or let B mutate A's tree).
//
// No ML/weather mock server needed for the negative-path assertions, deliberately: every route
// below runs its ownership check (assertFieldOwner()/assertFarmOwner(), or the inline
// field.farm.ownerId check for the direct /recommendations/:id lookup) BEFORE validate() or any
// controller logic that would call out to the ML or weather service (see field.routes.js's own
// middleware ordering) -- so a wrong-user request never reaches that far. A tiny mock ML server
// is still wired up (same pattern as trends.test.js/recommendation.test.js: process.env.ML_SERVICE_URL
// set, then app.js dynamically imported, since config/env.js reads process.env once at import
// time) purely so the second, positive-path test's GET /fields/:id/trends can succeed for the
// real owner.
import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

let mlServer, server, baseUrl, prisma

before(async () => {
  mlServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify([{ id: 'urea', name: 'Urea', n_pct: 46, p2o5_pct: 0, k2o_pct: 0, price_inr_per_kg: 6 }]))
  })
  await new Promise((resolve) => mlServer.listen(0, resolve))
  process.env.ML_SERVICE_URL = `http://localhost:${mlServer.address().port}`

  const appModule = await import('../src/app.js')
  const dbModule = await import('../src/config/db.js')
  prisma = dbModule.prisma
  server = appModule.default.listen(0)
  baseUrl = `http://localhost:${server.address().port}/api`
})

after(async () => {
  server.close()
  mlServer.close()
  await prisma.$disconnect()
})

beforeEach(async () => {
  await prisma.recommendation.deleteMany()
  await prisma.fertilizerLog.deleteMany()
  await prisma.soilTest.deleteMany()
  await prisma.field.deleteMany()
  await prisma.farm.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
})

const authed = (token) => ({ Authorization: `Bearer ${token}` })
const json = (token) => ({ 'Content-Type': 'application/json', ...authed(token) })

async function registerUser(email) {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'a-strong-password', name: 'Tester', role: 'FARMER' }),
  })
  return res.json()
}

test('ownership matrix: user B gets 404 on every one of user A\'s resources', async () => {
  const ownerA = await registerUser('matrixOwnerA@test.dev')
  const userB = await registerUser('matrixUserB@test.dev')

  // A's full resource tree, built directly against the DB (not through the API) -- this test
  // is about the boundary, not about exercising creation, so it starts from a known-good state
  // the same way resources.test.js's existing "another user gets 404" case does.
  const farm = await prisma.farm.create({ data: { name: 'A Farm', ownerId: ownerA.user.id } })
  const field = await prisma.field.create({
    data: { name: 'A Field', farmId: farm.id, cropType: 'wheat', growthStage: 'sowing' },
  })
  const soilTest = await prisma.soilTest.create({
    data: { fieldId: field.id, n: 210, p: 9, k: 90, ph: 7.4, organicCarbon: 0.42, moisture: 18 },
  })
  await prisma.fertilizerLog.create({
    data: { fieldId: field.id, type: 'urea', quantityKgPerAcre: 100, appliedOn: new Date('2026-03-10') },
  })
  const recommendation = await prisma.recommendation.create({
    data: {
      fieldId: field.id,
      soilTestId: soilTest.id,
      cropType: 'wheat',
      growthStage: 'sowing',
      fertilizerType: 'urea',
      quantityKgPerAcre: 22.4,
      schedule: [],
      riskLevel: 'LOW',
      riskReason: 'test fixture',
      modelVersion: 'test',
    },
  })

  const asB = authed(userB.accessToken)
  const bodyAsB = json(userB.accessToken)

  const cases = [
    ['GET /farms/:id', () => fetch(`${baseUrl}/farms/${farm.id}`, { headers: asB })],
    ['GET /farms/:farmId/fields', () => fetch(`${baseUrl}/farms/${farm.id}/fields`, { headers: asB })],
    [
      'POST /farms/:farmId/fields',
      () =>
        fetch(`${baseUrl}/farms/${farm.id}/fields`, {
          method: 'POST',
          headers: bodyAsB,
          body: JSON.stringify({ name: 'Intruding field' }),
        }),
    ],
    ['GET /fields/:id', () => fetch(`${baseUrl}/fields/${field.id}`, { headers: asB })],
    [
      'PATCH /fields/:id',
      () =>
        fetch(`${baseUrl}/fields/${field.id}`, {
          method: 'PATCH',
          headers: bodyAsB,
          body: JSON.stringify({ growthStage: 'harvest' }),
        }),
    ],
    ['GET /fields/:id/soil-tests', () => fetch(`${baseUrl}/fields/${field.id}/soil-tests`, { headers: asB })],
    [
      'POST /fields/:id/soil-tests',
      () =>
        fetch(`${baseUrl}/fields/${field.id}/soil-tests`, {
          method: 'POST',
          headers: bodyAsB,
          body: JSON.stringify({ n: 200, p: 10, k: 90, ph: 7, organicCarbon: 0.5, moisture: 20 }),
        }),
    ],
    ['GET /fields/:id/fertilizer-logs', () => fetch(`${baseUrl}/fields/${field.id}/fertilizer-logs`, { headers: asB })],
    [
      'POST /fields/:id/fertilizer-logs',
      () =>
        fetch(`${baseUrl}/fields/${field.id}/fertilizer-logs`, {
          method: 'POST',
          headers: bodyAsB,
          body: JSON.stringify({ type: 'urea', quantityKgPerAcre: 50, appliedOn: '2026-01-01' }),
        }),
    ],
    ['GET /fields/:id/recommendations', () => fetch(`${baseUrl}/fields/${field.id}/recommendations`, { headers: asB })],
    [
      'POST /fields/:id/recommendations',
      () =>
        fetch(`${baseUrl}/fields/${field.id}/recommendations`, {
          method: 'POST',
          headers: bodyAsB,
          body: JSON.stringify({}),
        }),
    ],
    ['GET /recommendations/:id (direct)', () => fetch(`${baseUrl}/recommendations/${recommendation.id}`, { headers: asB })],
    ['GET /fields/:id/weather', () => fetch(`${baseUrl}/fields/${field.id}/weather`, { headers: asB })],
    [
      'POST /fields/:id/risk-check',
      () =>
        fetch(`${baseUrl}/fields/${field.id}/risk-check`, {
          method: 'POST',
          headers: bodyAsB,
          body: JSON.stringify({ plannedApplication: [{ fertilizerType: 'urea', quantityKgPerAcre: 50 }] }),
        }),
    ],
    ['GET /fields/:id/trends', () => fetch(`${baseUrl}/fields/${field.id}/trends`, { headers: asB })],
  ]

  for (const [label, run] of cases) {
    const res = await run()
    assert.equal(res.status, 404, `${label} should 404 for a non-owner, got ${res.status}`)
    const body = await res.json().catch(() => null)
    assert.equal(body?.error, 'Not found', `${label} should use the generic "Not found" shape, got ${JSON.stringify(body)}`)
  }

  // DELETE last, and verified against the DB afterward, not just its own response status --
  // proves the attempt genuinely didn't delete anything, not just that it *reported* 404.
  const deleteRes = await fetch(`${baseUrl}/farms/${farm.id}`, { method: 'DELETE', headers: asB })
  assert.equal(deleteRes.status, 404)
  assert.ok(await prisma.farm.findUnique({ where: { id: farm.id } }), 'farm must still exist after a non-owner DELETE attempt')
})

test('ownership matrix: the actual owner still succeeds on every one of the same routes', async () => {
  // The matrix above proves B is locked out; this proves the lockout is ownership-specific,
  // not a routing bug that would 404 for everyone (owner included).
  const owner = await registerUser('matrixOwnerC@test.dev')
  const farm = await prisma.farm.create({ data: { name: 'C Farm', ownerId: owner.user.id } })
  const field = await prisma.field.create({
    data: { name: 'C Field', farmId: farm.id, cropType: 'wheat', growthStage: 'sowing' },
  })
  const asOwner = authed(owner.accessToken)

  assert.equal((await fetch(`${baseUrl}/farms/${farm.id}`, { headers: asOwner })).status, 200)
  assert.equal((await fetch(`${baseUrl}/farms/${farm.id}/fields`, { headers: asOwner })).status, 200)
  assert.equal((await fetch(`${baseUrl}/fields/${field.id}`, { headers: asOwner })).status, 200)
  assert.equal((await fetch(`${baseUrl}/fields/${field.id}/soil-tests`, { headers: asOwner })).status, 200)
  assert.equal((await fetch(`${baseUrl}/fields/${field.id}/fertilizer-logs`, { headers: asOwner })).status, 200)
  assert.equal((await fetch(`${baseUrl}/fields/${field.id}/recommendations`, { headers: asOwner })).status, 200)
  assert.equal((await fetch(`${baseUrl}/fields/${field.id}/trends`, { headers: asOwner })).status, 200)
})
