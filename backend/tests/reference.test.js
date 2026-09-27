import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

let server
let hits
let available

before(async () => {
  hits = 0
  available = true

  server = http.createServer((req, res) => {
    hits += 1

    if (!available) {
      res.writeHead(503)
      res.end()
      return
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify([
        {
          id: 'wheat',
          name_en: 'Wheat',
          varieties: [],
          stages: [],
        },
      ])
    )
  })

  await new Promise((resolve) => server.listen(0, resolve))

  process.env.ML_SERVICE_URL =
    `http://localhost:${server.address().port}`
  process.env.ML_MODE = 'online'
})

after(() => server.close())

test('getCrops fetches from ML once, then serves from cache', async () => {
  const { getCrops } =
    await import('../src/services/referenceService.js')

  const first = await getCrops()
  const second = await getCrops()

  assert.equal(hits, 1)
  assert.deepEqual(first, second)
})

test('serves a stale copy while ML is down, then 503 once past 24h', async () => {
  const mod =
    await import('../src/services/referenceService.js?stale=' + Date.now())

  await mod.getCrops()

  available = false

  const originalNow = Date.now
  const start = originalNow()

  Date.now = () => start + 2 * 60 * 60_000

  const stale = await mod.getCrops()

  assert.equal(stale[0].id, 'wheat')

  Date.now = () => start + 25 * 60 * 60_000

  await assert.rejects(
    () => mod.getCrops(),
    mod.ReferenceUnavailableError
  )

  Date.now = originalNow
})

test('ML_MODE=offline serves backend/config/reference.dev.json without calling ML', async () => {
  const originalMode = process.env.ML_MODE

  process.env.ML_MODE = 'offline'

  const mod =
    await import('../src/services/referenceService.js?offline=' + Date.now())

  const fertilizers = await mod.getFertilizers()

  assert.ok(fertilizers.some((f) => f.id === 'urea'))

  process.env.ML_MODE = originalMode
})