import { z } from 'zod'
import { prisma } from '../config/db.js'
import { SOIL_BOUNDS } from '../config/validation.js'
import { parsePagination, paginatedResponse } from '../utils/pagination.js'

export const createSoilTestSchema = z.object({
  n: z.number().min(SOIL_BOUNDS.n.min),
  p: z.number().min(SOIL_BOUNDS.p.min),
  k: z.number().min(SOIL_BOUNDS.k.min),
  ph: z.number().min(SOIL_BOUNDS.ph.min).max(SOIL_BOUNDS.ph.max),
  organicCarbon: z.number().min(SOIL_BOUNDS.organicCarbon.min).max(SOIL_BOUNDS.organicCarbon.max),
  moisture: z.number().min(SOIL_BOUNDS.moisture.min).max(SOIL_BOUNDS.moisture.max),
  testedOn: z.coerce.date().optional(),
})

export async function createSoilTest(req, res, next) {
  try {
    const soilTest = await prisma.soilTest.create({ data: { ...req.body, fieldId: req.field.id } })
    res.status(201).json(soilTest)
  } catch (err) {
    next(err)
  }
}

export async function listSoilTests(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.soilTest.findMany({ where: { fieldId: req.field.id }, skip, take: limit, orderBy: { testedOn: 'desc' } }),
      prisma.soilTest.count({ where: { fieldId: req.field.id } }),
    ])
    res.json(paginatedResponse({ items, page, limit, total }))
  } catch (err) {
    next(err)
  }
}