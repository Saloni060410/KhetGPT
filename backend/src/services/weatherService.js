import axios from 'axios'
import { seasonalWeather } from './referenceService.js'

const FORECAST_DAYS = 5
const CACHE_TTL_MS = 6 * 60 * 60_000

const client = axios.create({
  baseURL: process.env.WEATHER_API_URL ?? 'https://api.open-meteo.com/v1',
  timeout: 5000,
})

const cache = new Map()

export class WeatherUnavailableError extends Error {
  constructor(message = 'Weather data is unavailable') {
    super(message)
    this.name = 'WeatherUnavailableError'
    this.status = 503
  }
}

function cacheKey(latitude, longitude) {
  return `${latitude.toFixed(2)}:${longitude.toFixed(2)}`
}

async function fetchLiveWeather(latitude, longitude) {
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
    rainfall_mm_forecast: data.daily.precipitation_sum.reduce(
      (sum, mm) => sum + (mm ?? 0),
      0
    ),
    source: 'live',
  }
}

export async function getWeather({ latitude, longitude }) {
  if (latitude == null || longitude == null) {
    throw new WeatherUnavailableError(
      'Field coordinates are required for weather data'
    )
  }

  const key = cacheKey(latitude, longitude)
  const cached = cache.get(key)

  try {
    const weather = await fetchLiveWeather(latitude, longitude)

    cache.set(key, {
      data: weather,
      fetchedAt: Date.now(),
    })

    return weather
  } catch {
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return {
        ...cached.data,
        source: 'cached',
      }
    }

    try {
      const month = new Date().getMonth() + 1
      const seasonal = await seasonalWeather(latitude, longitude, month)

      return {
        temperature_c: seasonal.temperature_c,
        humidity_pct: seasonal.humidity_pct,
        rainfall_mm_forecast: seasonal.rainfall_mm_forecast,
        source: 'seasonal_average',
      }
    } catch {
      throw new WeatherUnavailableError(
        'Live, cached, and seasonal weather data are unavailable'
      )
    }
  }
}