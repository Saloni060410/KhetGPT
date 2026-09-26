import axios from 'axios'
import { env } from '../config/env.js'

const client = axios.create({ baseURL: env.ML_SERVICE_URL, timeout: 5000 })

// Request/response shapes: docs/api-contract.md
export async function recommend(payload) {
  const { data } = await client.post('/recommend', payload)
  return data
}

export async function riskScore(payload) {
  const { data } = await client.post('/risk-score', payload)
  return data
}

export async function health() {
  const { data } = await client.get('/health')
  return data
}
