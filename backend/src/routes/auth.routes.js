import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'
import { validate } from '../middleware/validate.middleware.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  register,
  login,
  refresh,
  logout,
  me,
} from '../controllers/auth.controller.js'

const router = Router()

// Production: 10 requests per 15 minutes, a real brute-force guard. Anything else (the
// existing NODE_ENV default is 'development', and there's no dedicated 'test' env wired up
// yet -- see PROGRESS notes) needs more headroom: a token-rotation test that exercises
// register/login/refresh/logout end to end genuinely makes more than 10 auth calls in one
// run. Not weakening the guard for real traffic, just not applying it to non-production.
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: env.NODE_ENV === 'production' ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
})

router.use(authLimiter)

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', validate(refreshSchema), refresh)
router.post('/logout', requireAuth, validate(refreshSchema), logout)
router.get('/me', requireAuth, me)

export default router