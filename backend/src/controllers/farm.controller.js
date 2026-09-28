import { z } from 'zod'
import { prisma } from '../config/db.js'
import { parsePagination, paginatedResponse } from '../utils/pagination.js'

export const createFarmSchema = z.object({
  name: z.string().min(1).max(120),
})

export async function listFarms(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.farm.findMany({ where: { ownerId: req.user.id }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.farm.count({ where: { ownerId: req.user.id } }),
    ])
    res.json(paginatedResponse({ items, page, limit, total }))
  } catch (err) {
    next(err)
  }
}

export async function createFarm(req, res, next) {
  try {
    const farm = await prisma.farm.create({ data: { name: req.body.name, ownerId: req.user.id } })
    res.status(201).json(farm)
  } catch (err) {
    next(err)
  }
}

export async function getFarm(req, res) {
  res.json(req.farm) // set by assertFarmOwner
}

export async function deleteFarm(req, res, next) {
  try {
    await prisma.farm.delete({ where: { id: req.farm.id } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}