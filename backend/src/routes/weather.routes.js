import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getWeather } from '../services/weatherService.js'
import { validate } from '../middleware/validate.middleware.js'

const router = Router()

const weatherSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

router.use(requireAuth)

router.get('/', validate(weatherSchema, 'query'), async (req, res, next) => {
  try {
    const weather = await getWeather({
      latitude: req.query.latitude,
      longitude: req.query.longitude,
    })

    res.json(weather)
  } catch (err) {
    next(err)
  }
})

export default router