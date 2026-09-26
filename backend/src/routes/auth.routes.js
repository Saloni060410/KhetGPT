import { Router } from 'express'
import rateLimit from 'express-rate-limit'
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

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
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