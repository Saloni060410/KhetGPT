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

process.env.WEATHER_API_URL =
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