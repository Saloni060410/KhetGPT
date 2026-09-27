import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { crops, soilRatings, fertilizers } from '../controllers/reference.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/crops', crops)
router.get('/soil-ratings', soilRatings)
router.get('/fertilizers', fertilizers)

export default router