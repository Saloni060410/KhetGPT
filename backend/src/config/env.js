import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' })

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ML_SERVICE_URL: z.string().url().default('http://localhost:8001'),
  ML_MODE: z.enum(['online', 'offline']).default('online'),
  WEATHER_SERVICE_URL: z.string().url().default('https://api.open-meteo.com/v1'),
  GEOCODE_SERVICE_URL: z.string().url().default('https://geocoding-api.open-meteo.com/v1'),
})

export const env = schema.parse(process.env)
