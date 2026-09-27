import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { readFileSync } from 'node:fs'

let server
let fixtureResponse
let malformed = false

before(async () => {
  fixtureResponse = JSON.parse(
    readFileSync(
      new URL('../../docs/contract-fixtures/recommend_response.json', import.meta.url)
    )
  )

  server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })

    if (malformed) {
      res.end(JSON.stringify({ nonsense: true }))
      return
    }

    res.end(JSON.stringify(fixtureResponse))
  })

  await new Promise((resolve) => server.listen(0, resolve))

  process.env.ML_SERVICE_URL = `http://localhost:${server.address().port}`
})

after(() => server.close())

test('recommend() validates and returns a fixture-shaped response', async () => {
  const { recommend } = await import('../src/services/mlService.js')

  const result = await recommend({ field_id: 'f1' })

  assert.equal(result.model_version, fixtureResponse.model_version)
  assert.equal(
    result.recommendation.fertilizer_type,
    fixtureResponse.recommendation.fertilizer_type
  )
})

test('recommend() throws MlInvalidResponseError on a malformed body', async () => {
  malformed = true

  const { recommend, MlInvalidResponseError } =
    await import('../src/services/mlService.js')

  await assert.rejects(
    () => recommend({ field_id: 'f1' }),
    MlInvalidResponseError
  )
})