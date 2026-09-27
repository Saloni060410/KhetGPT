import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/db.js'
import { env } from '../config/env.js'

const REFRESH_BYTES = 48
const DURATION_MULTIPLIERS = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }

function parseDurationMs(ttl) {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(ttl)
  if (!match) throw new Error(`Invalid duration string: ${ttl}`)
  return Number(match[1]) * DURATION_MULTIPLIERS[match[2]]
}

function unauthorized(message) {
  const err = new Error(message)
  err.status = 401
  return err
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  })
}

async function issueRefreshToken(userId) {
  const token = crypto.randomBytes(REFRESH_BYTES).toString('hex')
  const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_TTL))
  await prisma.refreshToken.create({ data: { tokenHash: hashToken(token), userId, expiresAt } })
  return token
}

export async function issueTokenPair(user) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user),
    issueRefreshToken(user.id),
  ])
  return { accessToken, refreshToken }
}

// Rotation with reuse detection: a valid, unrevoked token is rotated (marked
// revoked, a new row created). A token that is already revoked being presented
// again means it was stolen/replayed — nuke every refresh token for that user.
export async function rotateRefreshToken(presentedToken) {
  const tokenHash = hashToken(presentedToken)
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } })

  if (!existing) throw unauthorized('Invalid refresh token')

  if (existing.revokedAt) {
    await prisma.refreshToken.deleteMany({ where: { userId: existing.userId } })
    throw unauthorized('Refresh token reuse detected — session revoked')
  }

  if (existing.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: existing.id } })
    throw unauthorized('Refresh token expired')
  }

  const user = await prisma.user.findUnique({ where: { id: existing.userId } })
  if (!user) throw unauthorized('Invalid refresh token')

  await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } })

  return issueTokenPair(user)
}

export async function revokeRefreshToken(presentedToken) {
  await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(presentedToken) } })
}