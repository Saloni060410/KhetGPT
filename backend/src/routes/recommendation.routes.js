import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getRecommendationById } from '../controllers/recommendation.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/:id', getRecommendationById)

export default router