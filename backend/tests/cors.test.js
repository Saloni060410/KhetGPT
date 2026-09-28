// Security/reliability pass: CORS_ORIGIN is a real allowlist (comma-separated), not one
// trusted string -- verified against a real running server with multiple configured origins,
// not just read from app.js. CORS_ORIGIN is set before dynamically importing app.js, same
// reason as every other test file that needs a non-default env value: config/env.js reads
// process.env once at import time (a frozen singleton), so a static top-of-file import would
// already be too late.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'

process.env.CORS_ORIGIN = 'http://localhost:5173,https://khetgpt.example.com'

const appModule = await import('../src/app.js')
const dbModule = await import('../src/config/db.js')
const server = appModule.default.listen(0)
const baseUrl = `http://localhost:${server.address().port}/api`

after(async () => {
  server.close()
  await dbModule.prisma.$disconnect()
})

test('an allowlisted origin gets Access-Control-Allow-Origin echoed back', async () => {
  const res = await fetch(`${baseUrl}/health`, { headers: { Origin: 'http://localhost:5173' } })
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173')
})

test('a second allowlisted origin also succeeds -- this is a list, not a single value', async () => {
  const res = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://khetgpt.example.com' } })
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://khetgpt.example.com')
})

test('a non-allowlisted origin is rejected with 403, not silently allowed or a raw 500', async () => {
  const res = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://evil.example.com' } })
  assert.equal(res.status, 403)
  assert.equal(res.headers.get('access-control-allow-origin'), null)
})

test('a request with no Origin header (curl, server-to-server) is still allowed', async () => {
  const res = await fetch(`${baseUrl}/health`)
  assert.equal(res.status, 200)
})
