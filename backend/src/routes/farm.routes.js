import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { assertFarmOwner } from '../middleware/ownership.js'
import { validate } from '../middleware/validate.middleware.js'
import { createFarmSchema, listFarms, createFarm, getFarm, deleteFarm } from '../controllers/farm.controller.js'
import { createFieldSchema, listFieldsForFarm, createField } from '../controllers/field.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', listFarms)
router.post('/', validate(createFarmSchema), createFarm)
router.get('/:id', assertFarmOwner(), getFarm)
router.delete('/:id', assertFarmOwner(), deleteFarm)

router.get('/:farmId/fields', assertFarmOwner(), listFieldsForFarm)
router.post('/:farmId/fields', assertFarmOwner(), validate(createFieldSchema), createField)

export default router