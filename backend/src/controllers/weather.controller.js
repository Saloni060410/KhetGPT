import { getWeatherForField } from '../services/weatherService.js'

export async function getFieldWeather(req, res, next) {
  try {
    const field = req.field
    if (field.latitude == null || field.longitude == null) {
      return res.status(400).json({ error: 'Field has no latitude/longitude set' })
    }

    const weather = await getWeatherForField({ id: field.id, latitude: field.latitude, longitude: field.longitude })

    res.json({
      temperatureC: weather.temperature_c,
      humidityPct: weather.humidity_pct,
      rainfallMmForecast: weather.rainfall_mm_forecast,
      source: weather.source,
      fetchedAt: new Date(weather.fetchedAt).toISOString(),
      stale: weather.stale,
    })
  } catch (err) {
    next(err)
  }
}