import axios from 'axios'

const FORECAST_DAYS = 5

const client = axios.create({ baseURL: 'https://api.open-meteo.com/v1', timeout: 5000 })

// Returns the `weather` block of the /predict payload (docs/api-contract.md).
export async function getWeather({ latitude, longitude }) {
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
