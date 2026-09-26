import axios from 'axios'
import { env } from '../config/env.js'

const client = axios.create({ baseURL: 'https://api.openweathermap.org/data/2.5', timeout: 5000 })

export async function getForecast({ latitude, longitude }) {
  const { data } = await client.get('/forecast', {
    params: { lat: latitude, lon: longitude, units: 'metric', appid: env.OPENWEATHER_API_KEY },
  })
  return data
}
