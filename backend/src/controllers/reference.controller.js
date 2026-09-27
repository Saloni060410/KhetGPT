import { getCrops, getSoilRatings, getFertilizers } from '../services/referenceService.js'

export async function crops(req, res, next) {
  try {
    res.json(await getCrops())
  } catch (err) {
    next(err)
  }
}

export async function soilRatings(req, res, next) {
  try {
    res.json(await getSoilRatings())
  } catch (err) {
    next(err)
  }
}

export async function fertilizers(req, res, next) {
  try {
    res.json(await getFertilizers())
  } catch (err) {
    next(err)
  }
}