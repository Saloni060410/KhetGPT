import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../config/db.js'
import { issueTokenPair, rotateRefreshToken, revokeRefreshToken } from '../services/tokenService.js'

const BCRYPT_COST = 12
// Precomputed so login always runs a real bcrypt.compare, even for unknown
// emails — keeps response timing the same whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST)

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  name: z.string().min(1),
  role: z.enum(['FARMER', 'AGRONOMIST']).default('FARMER'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user
  return rest
}

export async function register(req, res, next) {
  try {
    const { email, password, name, role } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST)
    const user = await prisma.user.create({ data: { email, passwordHash, name, role } })
    const tokens = await issueTokenPair(user)

    res.status(201).json({ user: sanitizeUser(user), ...tokens })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)

    if (!user || !valid) return res.status(401).json({ error: 'Invalid email or password' })

    const tokens = await issueTokenPair(user)
    res.json({ user: sanitizeUser(user), ...tokens })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req, res, next) {
  try {
    const tokens = await rotateRefreshToken(req.body.refreshToken)
    res.json(tokens)
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    await revokeRefreshToken(req.body.refreshToken)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(sanitizeUser(user))
  } catch (err) {
    next(err)
  }
}