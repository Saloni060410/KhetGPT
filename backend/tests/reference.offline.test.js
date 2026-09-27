import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.ML_MODE = 'offline'

test('ML_MODE=offline serves backend/config/reference.dev.json without calling ML', async () => {
  const { getFertilizers } = await import('../src/services/referenceService.js')
  const fertilizers = await getFertilizers()
  assert.ok(fertilizers.some((f) => f.id === 'urea'))
})