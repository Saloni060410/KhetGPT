import { z } from 'zod'
import { prisma } from '../config/db.js'
import { parsePagination, paginatedResponse } from '../utils/pagination.js'

export const createFertilizerLogSchema = z.object({
  type: z.string().min(1),
  quantityKgPerAcre: z.number().positive(),
  appliedOn: z.coerce.date().refine((d) => d <= new Date(), { message: 'appliedOn cannot be in the future' }),
})

export async function createFertilizerLog(req, res, next) {
  try {
    const log = await prisma.fertilizerLog.create({ data: { ...req.body, fieldId: req.field.id } })
    res.status(201).json(log)
  } catch (err) {
    next(err)
  }
}

export async function listFertilizerLogs(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.fertilizerLog.findMany({ where: { fieldId: req.field.id }, skip, take: limit, orderBy: { appliedOn: 'desc' } }),
      prisma.fertilizerLog.count({ where: { fieldId: req.field.id } }),
    ])
    res.json(paginatedResponse({ items, page, limit, total }))
  } catch (err) {
    next(err)
  }
}