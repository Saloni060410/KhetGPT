import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { readFileSync } from 'node:fs'

let mlServer, weatherServer, server, baseUrl, prisma, riskFixture

before(async () => {
  riskFixture = JSON.parse(
    readFileSync(new URL('../../docs/contract-fixtures/risk_score_response.json', import.meta.url))
  )

  mlServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    if (req.url.startsWith('/reference/fertilizers')) {
      res.end(JSON.stringify([{ id: 'urea', name: 'Urea', n_pct: 46, p2o5_pct: 0, k2o_pct: 0, price_inr_per_kg: 6 }]))
      return
    }
    res.end(JSON.stringify(riskFixture))
  })
  await new Promise((resolve) => mlServer.listen(0, resolve))
  process.env.ML_SERVICE_URL = `http://localhost:${mlServer.address().port}`

  weatherServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ current: { temperature_2m: 24, relative_humidity_2m: 55 }, daily: { precipitation_sum: [1, 1, 1, 0, 0] } }))
  })
  await new Promise((resolve) => weatherServer.listen(0, resolve))
  process.env.WEATHER_SERVICE_URL = `http://localhost:${weatherServer.address().port}`

  const appModule = await import('../src/app.js')
  const dbModule = await import('../src/config/db.js')
  prisma = dbModule.prisma
  server = appModule.default.listen(0)
  baseUrl = `http://localhost:${server.address().port}/api`

  await prisma.recommendation.deleteMany()
  await prisma.fertilizerLog.deleteMany()
  await prisma.soilTest.deleteMany()
  await prisma.field.deleteMany()
  await prisma.farm.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
})

after(async () => {
  server.close()
  mlServer.close()
  weatherServer.close()
  await prisma.$disconnect()
})

async function setupOwnedField(email) {
  const reg = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'a-strong-password', name: 'Tester', role: 'FARMER' }),
  }).then((r) => r.json())
  const farm = await prisma.farm.create({ data: { name: 'Farm', ownerId: reg.user.id } })
  const field = await prisma.field.create({
    data: { name: 'Field', farmId: farm.id, latitude: 20, longitude: 74, cropType: 'wheat', growthStage: 'sowing' },
  })
  await prisma.soilTest.create({ data: { fieldId: field.id, n: 210, p: 9, k: 90, ph: 7.4, organicCarbon: 0.42, moisture: 18 } })
  return { reg, field }
}

test('risk-check maps a 2x urea dose to a high-risk response with both impact sentences', async () => {
  const { reg, field } = await setupOwnedField('risk1@test.dev')

  const res = await fetch(`${baseUrl}/fields/${field.id}/risk-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${reg.accessToken}` },
    body: JSON.stringify({ plannedApplication: [{ fertilizerType: 'urea', quantityKgPerAcre: 200 }] }),
  })
  const data = await res.json()

  assert.equal(res.status, 200)
  assert.equal(data.risk.level, 'high')
  assert.ok(data.risk.soilHealthImpact.length > 0)
  assert.ok(data.risk.yieldImpact.length > 0)
  assert.equal(data.nutrientBalance.n.ratio, riskFixture.nutrient_balance.n.ratio)
})

test('risk-check rejects an unknown fertilizerType', async () => {
  const { reg, field } = await setupOwnedField('risk2@test.dev')

  const res = await fetch(`${baseUrl}/fields/${field.id}/risk-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${reg.accessToken}` },
    body: JSON.stringify({ plannedApplication: [{ fertilizerType: 'moon-dust', quantityKgPerAcre: 50 }] }),
  })
  assert.equal(res.status, 400)
})

test('risk-check enforces ownership', async () => {
  const { field } = await setupOwnedField('risk3@test.dev')
  const other = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'risk3other@test.dev', password: 'a-strong-password', name: 'Other', role: 'FARMER' }),
  }).then((r) => r.json())

  const res = await fetch(`${baseUrl}/fields/${field.id}/risk-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${other.accessToken}` },
    body: JSON.stringify({ plannedApplication: [{ fertilizerType: 'urea', quantityKgPerAcre: 50 }] }),
  })
  assert.equal(res.status, 404)
})

test('risk-check rejects an empty plannedApplication with 422', async () => {
  const { reg, field } = await setupOwnedField('risk4@test.dev')

  const res = await fetch(`${baseUrl}/fields/${field.id}/risk-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${reg.accessToken}` },
    body: JSON.stringify({ plannedApplication: [] }),
  })
  assert.equal(res.status, 422)
})