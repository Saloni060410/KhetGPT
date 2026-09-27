import axios from 'axios'
import { z } from 'zod'
import { prisma } from '../config/db.js'
import { env } from '../config/env.js'
import { parsePagination, paginatedResponse } from '../utils/pagination.js'

export const createFieldSchema = z.object({
  name: z.string().min(1).max(120),
  areaAcres: z.number().positive().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  pincode: z.string().optional(),
  cropType: z.string().optional(),
  growthStage: z.string().optional(),
})

export const patchFieldSchema = z.object({
  cropType: z.string().min(1).optional(),
  cropVariety: z.string().min(1).nullable().optional(),
  growthStage: z.string().min(1).optional(),
  sowingDate: z.coerce.date().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  areaAcres: z.number().positive().optional(),
})

// Lightweight, uncached check against the ML service's reference lists.
// J6 replaces this with the proper cached reference proxy — this just
// avoids blocking PATCH on a full caching layer that doesn't exist yet.
async function fetchCropsForValidation() {
  try {
    const { data } = await axios.get(`${env.ML_SERVICE_URL}/reference/crops`, { timeout: 3000 })
    return data
  } catch {
    return null // ML unreachable: skip validation, do not fail the request
  }
}

async function validateCropFields({ cropType, cropVariety, growthStage }) {
  const crops = await fetchCropsForValidation()
  if (!crops) return { ok: true }

  const crop = crops.find((c) => c.id === cropType)
  if (cropType && !crop) return { ok: false, error: `Unknown cropType: ${cropType}` }
  if (cropVariety && crop && !crop.varieties.some((v) => v.id === cropVariety)) {
    return { ok: false, error: `Unknown cropVariety: ${cropVariety} for crop ${cropType}` }
  }
  if (growthStage && crop && !crop.stages.some((s) => s.id === growthStage)) {
    return { ok: false, error: `Unknown growthStage: ${growthStage} for crop ${cropType}` }
  }
  return { ok: true }
}

export async function listFieldsForFarm(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.field.findMany({ where: { farmId: req.farm.id }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.field.count({ where: { farmId: req.farm.id } }),
    ])
    res.json(paginatedResponse({ items, page, limit, total }))
  } catch (err) {
    next(err)
  }
}

export async function createField(req, res, next) {
  try {
    const field = await prisma.field.create({ data: { ...req.body, farmId: req.farm.id } })
    res.status(201).json(field)
  } catch (err) {
    next(err)
  }
}

export async function getField(req, res) {
  res.json(req.field) // set by assertFieldOwner
}

export async function patchField(req, res, next) {
  try {
    const { cropType, cropVariety, growthStage } = req.body
    if (cropType || cropVariety !== undefined || growthStage) {
      const check = await validateCropFields({
        cropType: cropType ?? req.field.cropType,
        cropVariety: cropVariety === undefined ? req.field.cropVariety : cropVariety,
        growthStage: growthStage ?? req.field.growthStage,
      })
      if (!check.ok) return res.status(400).json({ error: check.error })
    }

    const updated = await prisma.field.update({ where: { id: req.field.id }, data: req.body })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}