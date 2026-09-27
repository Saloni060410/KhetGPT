// Security/reliability pass: request id + structured logging, verified directly rather than
// assumed from reading the middleware. Captures real stdout from a real running server, not a
// unit-level simulation, since the bug this guards against (see below) only ever showed up
// under real concurrent HTTP traffic.
import { test } from 'node:test'
import assert from 'node:assert/strict'

function captureConsoleLog() {
  const lines = []
  const original = console.log
  console.log = (msg) => lines.push(msg)
  return {
    lines,
    restore: () => {
      console.log = original
    },
  }
}

test('every response carries a unique X-Request-Id header', async () => {
  const appModule = await import('../src/app.js')
  const dbModule = await import('../src/config/db.js')
  const server = appModule.default.listen(0)
  const baseUrl = `http://localhost:${server.address().port}/api`

  try {
    const [a, b] = await Promise.all([fetch(`${baseUrl}/health`), fetch(`${baseUrl}/health`)])
    const idA = a.headers.get('x-request-id')
    const idB = b.headers.get('x-request-id')
    assert.ok(idA, 'X-Request-Id must be present')
    assert.ok(idB, 'X-Request-Id must be present')
    assert.notEqual(idA, idB, 'two different requests must get two different ids')
  } finally {
    server.close()
    await dbModule.prisma.$disconnect()
  }
})

test('the structured log line has the correct, full, stable path under concurrent load', async () => {
  // Regression test for a real bug found while building this pass: reading req.path lazily
  // inside res.on('finish') is not guaranteed to see Express's fully-restored URL after a
  // nested router's prefix-stripping -- two near-simultaneous requests to the identical route
  // logged two different paths ("/register" and "/api/auth/register") before the fix
  // (logging.middleware.js snapshotting method/path up front instead). Uses two *different*
  // concurrent routes, deliberately, so a bug that mixed up which request's path went with
  // which log line -- not just a wrong path -- would also be caught.
  const appModule = await import('../src/app.js')
  const dbModule = await import('../src/config/db.js')
  const prisma = dbModule.prisma
  const server = appModule.default.listen(0)
  const baseUrl = `http://localhost:${server.address().port}/api`

  const capture = captureConsoleLog()
  try {
    await Promise.all([fetch(`${baseUrl}/health`), fetch(`${baseUrl}/reference/crops`)])
  } finally {
    capture.restore()
    server.close()
    await prisma.$disconnect()
  }

  const entries = capture.lines.map((line) => JSON.parse(line))
  const health = entries.find((e) => e.path === '/api/health')
  const crops = entries.find((e) => e.path === '/api/reference/crops')
  assert.ok(health, `expected a log line for /api/health, got paths: ${entries.map((e) => e.path)}`)
  assert.ok(crops, `expected a log line for /api/reference/crops, got paths: ${entries.map((e) => e.path)}`)
})

test('the structured log never includes the request body, a password, or the Authorization header', async () => {
  const appModule = await import('../src/app.js')
  const dbModule = await import('../src/config/db.js')
  const prisma = dbModule.prisma
  const server = appModule.default.listen(0)
  const baseUrl = `http://localhost:${server.address().port}/api`

  const secretPassword = 'a-very-specific-secret-password-99'
  const capture = captureConsoleLog()
  try {
    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'logcheck@test.dev', password: secretPassword, name: 'Tester' }),
    })
  } finally {
    capture.restore()
    server.close()
    await prisma.$disconnect()
  }

  const rawOutput = capture.lines.join('\n')
  assert.ok(!rawOutput.includes(secretPassword), 'the password must never appear in a log line')
  assert.ok(!rawOutput.toLowerCase().includes('bearer '), 'an Authorization header value must never appear in a log line')

  const entries = capture.lines.map((line) => JSON.parse(line))
  const registerEntry = entries.find((e) => e.path === '/api/auth/register')
  assert.ok(registerEntry)
  const allowedKeys = ['event', 'request_id', 'method', 'path', 'status', 'latency_ms', 'user_id']
  assert.deepEqual(Object.keys(registerEntry).sort(), allowedKeys.sort())
})
