import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

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

test('getWeather() returns live weather data', async () => {
  const port = server.address().port

  process.env.WEATHER_API_URL = `http://localhost:${port}/v1`

  const { getWeather } = await import(
    '../src/services/weatherService.js?test=' + Date.now()
  )

  const result = await getWeather({
    latitude: 19.076,
    longitude: 72.8777,
  })

  assert.equal(result.temperature_c, 28)
  assert.equal(result.humidity_pct, 70)
  assert.equal(result.rainfall_mm_forecast, 10)
  assert.equal(result.source, 'live')
})

test('getWeather() rejects missing coordinates', async () => {
  const { getWeather, WeatherUnavailableError } = await import(
    '../src/services/weatherService.js?missing=' + Date.now()
  )

  await assert.rejects(
    () => getWeather({ latitude: null, longitude: null }),
    WeatherUnavailableError
  )
})