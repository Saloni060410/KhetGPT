import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/app.js'
import { prisma } from '../src/config/db.js'

let server, baseUrl

before(() => {
  server = app.listen(0)
  baseUrl = `http://localhost:${server.address().port}/api`
})

after(async () => {
  server.close()
  await prisma.$disconnect()
})

beforeEach(async () => {
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
})

const authed = (token) => ({ Authorization: `Bearer ${token}` })

async function register(email, overrides = {}) {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'a-strong-password', name: 'Tester', role: 'FARMER', ...overrides }),
  })
  return { res, body: await res.json() }
}

test('register returns 201 with a user (no passwordHash), an access token and a refresh token', async () => {
  const { res, body } = await register('reg@test.dev')

  assert.equal(res.status, 201)
  assert.equal(body.user.email, 'reg@test.dev')
  assert.equal(body.user.passwordHash, undefined)
  assert.ok(body.accessToken)
  assert.ok(body.refreshToken)
})

test('register with an already-registered email returns 409', async () => {
  await register('dupe@test.dev')
  const { res, body } = await register('dupe@test.dev')

  assert.equal(res.status, 409)
  assert.ok(body.error)
})

test('login with the correct password returns a fresh token pair', async () => {
  await register('login@test.dev')

  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'login@test.dev', password: 'a-strong-password' }),
  })
  const body = await res.json()

  assert.equal(res.status, 200)
  assert.equal(body.user.email, 'login@test.dev')
  assert.ok(body.accessToken)
  assert.ok(body.refreshToken)
})

test('login with the wrong password returns 401', async () => {
  await register('wrongpw@test.dev')

  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'wrongpw@test.dev', password: 'not-the-password' }),
  })

  assert.equal(res.status, 401)
})

test('login with an unknown email returns the same 401 as a wrong password (no user enumeration)', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nobody@test.dev', password: 'whatever12' }),
  })
  const body = await res.json()

  assert.equal(res.status, 401)
  assert.equal(body.error, 'Invalid email or password')
})

test('GET /me with a valid access token returns the current user', async () => {
  const { body: reg } = await register('me@test.dev')

  const res = await fetch(`${baseUrl}/auth/me`, { headers: authed(reg.accessToken) })
  const body = await res.json()

  assert.equal(res.status, 200)
  assert.equal(body.email, 'me@test.dev')
  assert.equal(body.passwordHash, undefined)
})

test('GET /me without a token returns 401', async () => {
  const res = await fetch(`${baseUrl}/auth/me`)
  assert.equal(res.status, 401)
})

test('refresh rotates the token: old refresh token stops working, new one is returned', async () => {
  const { body: reg } = await register('rotate@test.dev')

  const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: reg.refreshToken }),
  })
  const rotated = await refreshRes.json()

  assert.equal(refreshRes.status, 200)
  assert.ok(rotated.accessToken)
  assert.ok(rotated.refreshToken)
  assert.notEqual(rotated.refreshToken, reg.refreshToken)

  // The new access token actually works.
  const meRes = await fetch(`${baseUrl}/auth/me`, { headers: authed(rotated.accessToken) })
  assert.equal(meRes.status, 200)
})

test('presenting an already-rotated (revoked) refresh token again is detected as reuse and revokes the whole session', async () => {
  const { body: reg } = await register('reuse@test.dev')

  const firstRefresh = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: reg.refreshToken }),
  })
  const rotated = await firstRefresh.json()
  assert.equal(firstRefresh.status, 200)

  // Replay the original (now-revoked) token -- this is the theft/replay scenario
  // tokenService.rotateRefreshToken() specifically guards against.
  const replay = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: reg.refreshToken }),
  })
  assert.equal(replay.status, 401)

  // The legitimately-rotated token from the first refresh must also be dead now --
  // reuse detection revokes every refresh token for the user, not just the replayed one.
  const afterReuse = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rotated.refreshToken }),
  })
  assert.equal(afterReuse.status, 401)
})

test('refresh with an unknown/invalid token returns 401', async () => {
  const res = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: 'not-a-real-token' }),
  })
  assert.equal(res.status, 401)
})

test('logout revokes the refresh token so it can no longer be used', async () => {
  const { body: reg } = await register('logout@test.dev')

  const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    headers: { ...authed(reg.accessToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: reg.refreshToken }),
  })
  assert.equal(logoutRes.status, 204)

  const afterLogout = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: reg.refreshToken }),
  })
  assert.equal(afterLogout.status, 401)
})
