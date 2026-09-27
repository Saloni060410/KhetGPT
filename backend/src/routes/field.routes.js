import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { assertFieldOwner } from '../middleware/ownership.js'
import { validate } from '../middleware/validate.middleware.js'
import { patchFieldSchema, getField, patchField } from '../controllers/field.controller.js'
import { createSoilTestSchema, createSoilTest, listSoilTests } from '../controllers/soilTest.controller.js'
import {
  createFertilizerLogSchema,
  createFertilizerLog,
  listFertilizerLogs,
} from '../controllers/fertilizerLog.controller.js'
import { createRecommendation } from '../controllers/recommendation.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/:id', assertFieldOwner(), getField)
router.patch('/:id', assertFieldOwner(), validate(patchFieldSchema), patchField)

router.post('/:id/soil-tests', assertFieldOwner(), validate(createSoilTestSchema), createSoilTest)
router.get('/:id/soil-tests', assertFieldOwner(), listSoilTests)

router.post('/:id/fertilizer-logs', assertFieldOwner(), validate(createFertilizerLogSchema), createFertilizerLog)
router.get('/:id/fertilizer-logs', assertFieldOwner(), listFertilizerLogs)

router.post('/:id/recommendations', assertFieldOwner(), createRecommendation)

export default router