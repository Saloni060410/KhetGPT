import axios from 'axios'
import { env } from '../config/env.js'

const client = axios.create({ baseURL: env.ML_SERVICE_URL, timeout: 5000 })

// Request/response shape: docs/api-contract.md
export async function predict(payload) {
  const { data } = await client.post('/predict', payload)
  return data
}

export async function health() {
  const { data } = await client.get('/health')
  return data
}
