import { geocode } from '../services/geocodeService.js'

export async function searchPlace(req, res, next) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' })
    res.json(await geocode(q))
  } catch (err) {
    next(err)
  }
}