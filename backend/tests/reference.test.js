import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

let server, hits

before(async () => {
  hits = 0
  server = http.createServer((req, res) => {
    hits += 1
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify([{ id: 'wheat', name_en: 'Wheat', varieties: [], stages: [] }]))
  })
  await new Promise((resolve) => server.listen(0, resolve))
  process.env.ML_SERVICE_URL = `http://localhost:${server.address().port}`
  process.env.ML_MODE = 'online'
})

after(() => server.close())

test('getCrops fetches from ML once, then serves from cache', async () => {
  const { getCrops } = await import('../src/services/referenceService.js')
  const first = await getCrops()
  const second = await getCrops()
  assert.equal(hits, 1)
  assert.deepEqual(first, second)
})

test('serves a stale copy while ML is down, then 503 once past 24h', async (t) => {
  const mod = await import('../src/services/referenceService.js?bust=' + Date.now())
  await mod.getCrops() // warm the cache

  server.close()

  t.mock.timers.enable({ apis: ['Date'] })
  t.mock.timers.tick(2 * 60 * 60_000) // 2h later: stale but within 24h
  const stale = await mod.getCrops()
  assert.equal(stale[0].id, 'wheat')

  t.mock.timers.tick(23 * 60 * 60_000) // now >24h since the last good fetch
  await assert.rejects(() => mod.getCrops(), mod.ReferenceUnavailableError)

  t.mock.timers.reset()
})

test('ML_MODE=offline serves backend/config/reference.dev.json without calling ML', async () => {
  process.env.ML_MODE = 'offline'
  const mod = await import('../src/services/referenceService.js?bust=' + (Date.now() + 1))
  const fertilizers = await mod.getFertilizers()
  assert.ok(fertilizers.some((f) => f.id === 'urea'))
  process.env.ML_MODE = 'online'
})