import { Router } from 'express'
import authRoutes from './auth.routes.js'
import farmRoutes from './farm.routes.js'
import fieldRoutes from './field.routes.js'
import recommendationRoutes from './recommendation.routes.js'
import referenceRoutes from './reference.routes.js'
import weatherRoutes from './weather.routes.js'

const router = Router()

router.get('/health', (req, res) => res.json({ status: 'ok' }))
router.use('/auth', authRoutes)
router.use('/farms', farmRoutes)
router.use('/fields', fieldRoutes)
router.use('/recommendations', recommendationRoutes)
router.use('/reference', referenceRoutes)
router.use('/weather', weatherRoutes)

export default router
