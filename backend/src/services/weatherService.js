import axios from 'axios'
import { env } from '../config/env.js'
import { seasonalWeather } from './referenceService.js'

const FORECAST_DAYS = 5
const LIVE_FRESH_MS = 20 * 60_000       // 20 minutes
const CACHE_STALE_MS = 6 * 60 * 60_000  // 6 hours

const client = axios.create({ baseURL: env.WEATHER_SERVICE_URL, timeout: 5000 })
const cache = new Map() // fieldId -> { data, fetchedAt }

export class WeatherUnavailableError extends Error {
  constructor(message = 'Weather data is unavailable') {
    super(message)
    this.name = 'WeatherUnavailableError'
    this.status = 503
  }
}

async function fetchLiveWeather({ latitude, longitude }) {
  const { data } = await client.get('/forecast', {
    params: {
      latitude,
      longitude,
      current: 'temperature_2m,relative_humidity_2m',
      daily: 'precipitation_sum',
      forecast_days: FORECAST_DAYS,
      timezone: 'auto',
    },
  })

  return {
    temperature_c: data.current.temperature_2m,
    humidity_pct: data.current.relative_humidity_2m,
    rainfall_mm_forecast: data.daily.precipitation_sum.reduce((sum, mm) => sum + (mm ?? 0), 0),
  }
}

// Single source of truth for weather — used by GET /fields/:id/weather AND by
// the recommendation payload assembly.
export async function getWeatherForField({ id, latitude, longitude }) {
  if (latitude == null || longitude == null) {
    throw new WeatherUnavailableError('Field coordinates are required for weather data')
  }

  const entry = cache.get(id)
  const now = Date.now()

  if (entry && now - entry.fetchedAt < LIVE_FRESH_MS) {
    return { ...entry.data, source: 'live', fetchedAt: entry.fetchedAt, stale: false }
  }

  try {
    const data = await fetchLiveWeather({ latitude, longitude })
    cache.set(id, { data, fetchedAt: now })
    return { ...data, source: 'live', fetchedAt: now, stale: false }
  } catch {
    if (entry && now - entry.fetchedAt < CACHE_STALE_MS) {
      return { ...entry.data, source: 'cached', fetchedAt: entry.fetchedAt, stale: true }
    }

    try {
      const month = new Date().getMonth() + 1
      const seasonal = await seasonalWeather(latitude, longitude, month)
      return {
        temperature_c: seasonal.temperature_c,
        humidity_pct: seasonal.humidity_pct,
        rainfall_mm_forecast: seasonal.rainfall_mm_forecast,
        source: 'seasonal_average',
        fetchedAt: now,
        stale: true,
      }
    } catch {
      throw new WeatherUnavailableError('Live, cached and seasonal-average weather all unavailable')
    }
  }
}