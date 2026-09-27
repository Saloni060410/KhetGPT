import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { readFileSync } from 'node:fs'

let mlServer, weatherServer, server, baseUrl, prisma, fixtureResponse

before(async () => {
  fixtureResponse = JSON.parse(
    readFileSync(new URL('../../docs/contract-fixtures/recommend_response.json', import.meta.url))
  )
  mlServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(fixtureResponse))
  })
  await new Promise((resolve) => mlServer.listen(0, resolve))
  process.env.ML_SERVICE_URL = `http://localhost:${mlServer.address().port}`

weatherServer = http.createServer((req, res) => {
  if (req.url.startsWith('/v1/forecast')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      current: {
        temperature_2m: 28,
        relative_humidity_2m: 70,
      },
      daily: {
        precipitation_sum: [2, 3, 1, 0, 4],
      },
    }))
    return
  }

  res.writeHead(404)
  res.end()
})

await new Promise((resolve) => weatherServer.listen(0, resolve))

process.env.WEATHER_SERVICE_URL =
  `http://localhost:${weatherServer.address().port}/v1`

const appModule = await import('../src/app.js')
  const dbModule = await import('../src/config/db.js')
  prisma = dbModule.prisma
  server = appModule.default.listen(0)
  baseUrl = `http://localhost:${server.address().port}/api`

  await prisma.fertilizerLog.deleteMany()
  await prisma.recommendation.deleteMany()
  await prisma.soilTest.deleteMany()
  await prisma.field.deleteMany()
  await prisma.farm.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
})

after(async () => {
  server?.close()
  mlServer?.close()
  weatherServer?.close()
  await prisma.$disconnect()
})

test('POST /fields/:id/recommendations returns a plan and persists it', async () => {
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rec@test.dev', password: 'a-strong-password', name: 'Rec Tester', role: 'FARMER' }),
  })
  const reg = await regRes.json()

  const farm = await prisma.farm.create({ data: { name: 'Test Farm', ownerId: reg.user.id } })
  const field = await prisma.field.create({
    data: {
      name: 'Test Field',
      farmId: farm.id,
      latitude: 19.9975,
      longitude: 73.7898,
      cropType: 'wheat',
      growthStage: 'sowing',
      sowingDate: new Date('2026-11-05'),
    },
  })
  await prisma.soilTest.create({
    data: { fieldId: field.id, n: 210, p: 9, k: 90, ph: 7.4, organicCarbon: 0.42, moisture: 18 },
  })

  const res = await fetch(`${baseUrl}/fields/${field.id}/recommendations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${reg.accessToken}` },
  })
  const data = await res.json()

  assert.equal(res.status, 201)
  assert.equal(data.fertilizerType, fixtureResponse.recommendation.fertilizer_type)

  const stored = await prisma.recommendation.findFirst({ where: { fieldId: field.id } })
  assert.ok(stored)
  assert.equal(stored.modelVersion, fixtureResponse.model_version)
})

test('POST /fields/:id/recommendations returns 409 with no soil test', async () => {
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rec-nossoil@test.dev',
      password: 'a-strong-password',
      name: 'No Soil Tester',
      role: 'FARMER',
    }),
  })

  const reg = await regRes.json()

  const farm = await prisma.farm.create({
    data: {
      name: 'No Soil Farm',
      ownerId: reg.user.id,
    },
  })

  const field = await prisma.field.create({
    data: {
      name: 'No Soil Field',
      farmId: farm.id,
      cropType: 'wheat',
      growthStage: 'sowing',
    },
  })

  const res = await fetch(`${baseUrl}/fields/${field.id}/recommendations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${reg.accessToken}`,
    },
  })

  assert.equal(res.status, 409)
})

test('GET /fields/:id/recommendations returns history newest-first, paginated', async () => {
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'history@test.dev', password: 'a-strong-password', name: 'History Tester', role: 'FARMER' }),
  })
  const reg = await regRes.json()

  const farm = await prisma.farm.create({ data: { name: 'History Farm', ownerId: reg.user.id } })
  const field = await prisma.field.create({
    data: {
      name: 'History Field',
      farmId: farm.id,
      latitude: 19.9975,
      longitude: 73.7898,
      cropType: 'wheat',
      growthStage: 'sowing',
      sowingDate: new Date('2026-11-05'),
    },
  })
  await prisma.soilTest.create({
    data: { fieldId: field.id, n: 210, p: 9, k: 90, ph: 7.4, organicCarbon: 0.42, moisture: 18 },
  })

  // listRecommendationsForField orders by createdAt desc -- three real inserts, oldest to
  // newest, made through the same endpoint the app actually uses (not seeded directly with
  // out-of-order timestamps), so this exercises the real code path, not just the ORDER BY.
  // Each call passes a different growthStage: createRecommendation is deliberately
  // idempotent for an identical input within IDEMPOTENCY_WINDOW_MS (30s) -- three genuinely
  // identical calls in a row would collapse to one stored recommendation, which is correct
  // behavior, just not what this test is checking.
  const ids = []
  for (const growthStage of ['sowing', 'tillering', 'flowering']) {
    const created = await fetch(`${baseUrl}/fields/${field.id}/recommendations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${reg.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ growthStage }),
    })
    ids.push((await created.json()).id)
  }

  const listRes = await fetch(`${baseUrl}/fields/${field.id}/recommendations`, {
    headers: { Authorization: `Bearer ${reg.accessToken}` },
  })
  const list = await listRes.json()

  assert.equal(listRes.status, 200)
  assert.equal(list.total, 3)
  assert.equal(list.items.length, 3)
  // Newest-first: the third (last-created) recommendation is items[0].
  assert.deepEqual(list.items.map((item) => item.id), [...ids].reverse())

  const page2 = await fetch(`${baseUrl}/fields/${field.id}/recommendations?page=1&limit=2`, {
    headers: { Authorization: `Bearer ${reg.accessToken}` },
  })
  const page2Body = await page2.json()
  assert.equal(page2Body.items.length, 2)
  assert.equal(page2Body.page, 1)
  assert.equal(page2Body.limit, 2)
  assert.equal(page2Body.total, 3)
})

test('GET /fields/:id/recommendations enforces ownership', async () => {
  const ownerReg = await (await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'historyowner@test.dev', password: 'a-strong-password', name: 'Owner', role: 'FARMER' }),
  })).json()
  const otherReg = await (await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'historyother@test.dev', password: 'a-strong-password', name: 'Other', role: 'FARMER' }),
  })).json()

  const farm = await prisma.farm.create({ data: { name: 'Owner Farm', ownerId: ownerReg.user.id } })
  const field = await prisma.field.create({
    data: { name: 'Owner Field', farmId: farm.id, cropType: 'wheat', growthStage: 'sowing' },
  })

  const res = await fetch(`${baseUrl}/fields/${field.id}/recommendations`, {
    headers: { Authorization: `Bearer ${otherReg.accessToken}` },
  })

  assert.equal(res.status, 404)
})