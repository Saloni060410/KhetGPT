import { test, before, after } from 'node:test'
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
  await prisma.$disconnect()
})

test('trends aggregates fertilizer logs into monthly NPK and cost', async () => {
  const reg = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'trends1@test.dev', password: 'a-strong-password', name: 'Tester', role: 'FARMER' }),
  }).then((r) => r.json())
  const farm = await prisma.farm.create({ data: { name: 'Farm', ownerId: reg.user.id } })
  const field = await prisma.field.create({ data: { name: 'Field', farmId: farm.id, cropType: 'wheat', growthStage: 'sowing' } })

  await prisma.soilTest.create({
    data: { fieldId: field.id, n: 200, p: 10, k: 80, ph: 7.2, organicCarbon: 0.4, moisture: 20, testedOn: new Date('2026-01-15') },
  })
  await prisma.fertilizerLog.createMany({
    data: [
      { fieldId: field.id, type: 'urea', quantityKgPerAcre: 40, appliedOn: new Date('2026-03-10') },
      { fieldId: field.id, type: 'urea', quantityKgPerAcre: 60, appliedOn: new Date('2026-03-20') },
    ],
  })

  const res = await fetch(`${baseUrl}/fields/${field.id}/trends`, { headers: { Authorization: `Bearer ${reg.accessToken}` } })
  const data = await res.json()

  assert.equal(res.status, 200)
  assert.equal(data.soilTests.length, 1)
  assert.equal(data.applied.length, 1)
  assert.equal(data.applied[0].month, '2026-03')
  // (40 + 60) kg/acre * 46% N = 46 kg/acre nitrogen
  assert.ok(Math.abs(data.applied[0].nitrogenKgAcre - 46) < 0.001)
  assert.equal(data.applied[0].costInr, 100 * 6)
  assert.deepEqual(data.recommendations, [])
})

test('trends returns empty arrays, not an error, for a brand-new field', async () => {
  const reg = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'trends2@test.dev', password: 'a-strong-password', name: 'Tester', role: 'FARMER' }),
  }).then((r) => r.json())
  const farm = await prisma.farm.create({ data: { name: 'Farm', ownerId: reg.user.id } })
  const field = await prisma.field.create({ data: { name: 'Empty Field', farmId: farm.id } })

  const res = await fetch(`${baseUrl}/fields/${field.id}/trends`, { headers: { Authorization: `Bearer ${reg.accessToken}` } })
  const data = await res.json()

  assert.equal(res.status, 200)
  assert.deepEqual(data, { soilTests: [], applied: [], recommendations: [] })
})