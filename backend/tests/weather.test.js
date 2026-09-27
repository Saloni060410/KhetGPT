import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInFreshProcess } from './helpers/runInFreshProcess.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const servicePath = path.join(__dirname, '../src/services/weatherService.js')

let server

before(async () => {
  server = http.createServer((req, res) => {
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

  await new Promise((resolve) => server.listen(0, resolve))
})

after(() => server.close())

test('getWeatherForField() returns live weather data', async () => {
  const port = server.address().port

  const output = await runInFreshProcess({
    env: { WEATHER_SERVICE_URL: `http://localhost:${port}/v1` },
    servicePath,
    script: 'async (mod) => mod.getWeatherForField({ id: "test-field", latitude: 19.076, longitude: 72.8777 })',
  })

  assert.equal(output.ok, true, output.message)
  assert.equal(output.result.temperature_c, 28)
  assert.equal(output.result.humidity_pct, 70)
  assert.equal(output.result.rainfall_mm_forecast, 10)
  assert.equal(output.result.source, 'live')
})

test('getWeatherForField() rejects missing coordinates', async () => {
  const output = await runInFreshProcess({
    servicePath,
    script: 'async (mod) => mod.getWeatherForField({ id: "test-field", latitude: null, longitude: null })',
  })

  assert.equal(output.ok, false)
  assert.equal(output.name, 'WeatherUnavailableError')
})
