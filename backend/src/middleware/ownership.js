import { prisma } from '../config/db.js'

export function assertFarmOwner() {
  return async (req, res, next) => {
    try {
      const farm = await prisma.farm.findUnique({ where: { id: req.params.id ?? req.params.farmId } })
      if (!farm || farm.ownerId !== req.user.id) return res.status(404).json({ error: 'Not found' })
      req.farm = farm
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function assertFieldOwner() {
  return async (req, res, next) => {
    try {
      const field = await prisma.field.findUnique({
        where: { id: req.params.id ?? req.params.fieldId },
        include: { farm: true },
      })
      if (!field || field.farm.ownerId !== req.user.id) return res.status(404).json({ error: 'Not found' })
      req.field = field
      next()
    } catch (err) {
      next(err)
    }
  }
}