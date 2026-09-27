import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { geocodePlace } from '../services/geocodeService.js'

const router = Router()

const geocodeSchema = z.object({
  place: z.string().min(2).max(120),
})

router.use(requireAuth)

router.get('/', validate(geocodeSchema, 'query'), async (req, res, next) => {
  try {
    const results = await geocodePlace(req.query.place)
    res.json(results)
  } catch (err) {
    next(err)
  }
})

export default router