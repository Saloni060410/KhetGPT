import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

let server

before(async () => {
  server = http.createServer((req, res) => {
    if (req.url.startsWith('/v1/search')) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        results: [
          {
            name: 'Mumbai',
            latitude: 19.076,
            longitude: 72.8777,
            country: 'India',
            admin1: 'Maharashtra',
          },
        ],
      }))
      return
    }

    res.writeHead(404)
    res.end()
  })

  await new Promise((resolve) => server.listen(0, resolve))
})

after(() => server.close())

test('geocodePlace() returns normalized place results', async () => {
  const port = server.address().port

  process.env.GEOCODING_API_URL = `http://localhost:${port}/v1`

  const { geocodePlace } = await import(
    '../src/services/geocodeService.js?test=' + Date.now()
  )

  const results = await geocodePlace('Mumbai')

  assert.deepEqual(results, [
    {
      name: 'Mumbai',
      latitude: 19.076,
      longitude: 72.8777,
      country: 'India',
      admin1: 'Maharashtra',
    },
  ])
})