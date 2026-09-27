import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/auth.middleware.js'
import { searchPlace } from '../controllers/geocode.controller.js'

const router = Router()
const geocodeLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false })

router.get('/', requireAuth, geocodeLimiter, searchPlace)

export default router