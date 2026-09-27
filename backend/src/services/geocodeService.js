import axios from 'axios'
import { env } from '../config/env.js'

const client = axios.create({ baseURL: env.GEOCODE_SERVICE_URL, timeout: 5000 })
const CACHE_MS = 24 * 60 * 60_000
const cache = new Map()

export async function geocode(query) {
  const key = query.trim().toLowerCase()
  const entry = cache.get(key)
  const now = Date.now()

  if (entry && now - entry.fetchedAt < CACHE_MS) return entry.data

  const { data } = await client.get('/search', { params: { name: query, count: 5, country: 'IN' } })

  const results = (data.results ?? []).map((r) => ({
    name: r.name,
    admin: r.admin1 ?? null,
    latitude: r.latitude,
    longitude: r.longitude,
  }))

  cache.set(key, { data: results, fetchedAt: now })
  return results
}