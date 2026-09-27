import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInFreshProcess } from './helpers/runInFreshProcess.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const servicePath = path.join(__dirname, '../src/services/geocodeService.js')

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

test('geocode() returns normalized place results', async () => {
  const port = server.address().port

  const output = await runInFreshProcess({
    env: { GEOCODE_SERVICE_URL: `http://localhost:${port}/v1` },
    servicePath,
    script: 'async (mod) => mod.geocode("Mumbai")',
  })

  assert.equal(output.ok, true, output.message)
  // geocode()'s real shape (src/services/geocodeService.js): {name, admin, latitude,
  // longitude} -- no `country` field. The previous version of this test asserted a shape
  // that never matched the implementation at all (name mismatch masked it: geocodePlace()
  // didn't exist, so this assertion was never reached either).
  assert.deepEqual(output.result, [
    {
      name: 'Mumbai',
      admin: 'Maharashtra',
      latitude: 19.076,
      longitude: 72.8777,
    },
  ])
})
