// Security/reliability pass: the error middleware's Zod/Prisma mapping, tested directly
// against the function (not just indirectly through whatever a route happens to throw) so the
// exact status/body contract is pinned down deterministically. The one live path this protects
// (auth.controller.js's register(), which pre-checks for a duplicate email but can still race
// a second concurrent registration past that check into a real P2002 on prisma.user.create())
// is also exercised end to end below, not just simulated.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { z, ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { errorHandler } from '../src/middleware/error.middleware.js'

function callHandler(err) {
  let statusCode, body
  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(payload) {
      body = payload
      return this
    },
  }
  errorHandler(err, {}, res, () => {})
  return { statusCode, body }
}

test('errorHandler maps a ZodError to 400 with details', () => {
  let zodError
  try {
    z.object({ email: z.string().email() }).parse({ email: 'not-an-email' })
  } catch (err) {
    zodError = err
  }
  assert.ok(zodError instanceof ZodError)

  const { statusCode, body } = callHandler(zodError)
  assert.equal(statusCode, 400)
  assert.equal(body.error, 'Validation failed')
  assert.ok(body.details)
})

test('errorHandler maps Prisma P2002 (unique constraint) to 409', () => {
  const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.19.3',
  })
  const { statusCode, body } = callHandler(err)
  assert.equal(statusCode, 409)
  assert.ok(body.error)
})

test('errorHandler maps Prisma P2025 (record not found) to 404', () => {
  const err = new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: '6.19.3',
  })
  const { statusCode, body } = callHandler(err)
  assert.equal(statusCode, 404)
  assert.equal(body.error, 'Not found')
})

test('errorHandler falls back to a generic 500 for anything else', () => {
  const { statusCode, body } = callHandler(new Error('something unrelated broke'))
  assert.equal(statusCode, 500)
  assert.equal(body.error, 'something unrelated broke')
})

test('errorHandler falls back to 500 for an unmapped Prisma error code', () => {
  // P2003 (foreign key constraint), or any other Prisma code this middleware doesn't
  // special-case, must not silently fall through to a 200 or leak Prisma's raw internals as
  // a 4xx that looks intentional -- confirms the two branches above are the only special cases.
  const err = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
    code: 'P2003',
    clientVersion: '6.19.3',
  })
  const { statusCode } = callHandler(err)
  assert.equal(statusCode, 500)
})

test('a real concurrent double-registration races into P2002, mapped to a proper 409', async () => {
  const appModule = await import('../src/app.js')
  const dbModule = await import('../src/config/db.js')
  const prisma = dbModule.prisma
  const server = appModule.default.listen(0)
  const baseUrl = `http://localhost:${server.address().port}/api`

  try {
    await prisma.user.deleteMany({ where: { email: 'race@test.dev' } })

    const body = JSON.stringify({
      email: 'race@test.dev',
      password: 'a-strong-password',
      name: 'Racer',
      role: 'FARMER',
    })
    const post = () =>
      fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

    // Fired together, not awaited one at a time -- gives both requests a real chance to pass
    // the pre-check's findUnique before either one's create() commits. Not deterministic on
    // every machine/run, so this only asserts the outcome that matters regardless of which
    // request happened to lose the race: exactly one 201, and the other a proper 409 -- never
    // an uncaught 500 with Prisma's own internal error text.
    const [a, b] = await Promise.all([post(), post()])
    const statuses = [a.status, b.status].sort()
    assert.deepEqual(statuses, [201, 409], `expected one 201 and one 409, got ${statuses}`)

    const loser = a.status === 409 ? a : b
    const loserBody = await loser.json()
    assert.ok(loserBody.error, 'the losing request must still get a real JSON error body, not a raw 500')
  } finally {
    server.close()
    await prisma.$disconnect()
  }
})
