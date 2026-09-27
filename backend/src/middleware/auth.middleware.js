import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing access token' })

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired access token' })
  }
}

export function requireRole(...roles) {
   return (req, res, next) => {
     if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}
