import axios from 'axios'

const client = axios.create({
  baseURL: process.env.GEOCODING_API_URL ?? 'https://geocoding-api.open-meteo.com/v1',
  timeout: 5000,
})

export async function geocodePlace(place) {
  const { data } = await client.get('/search', {
    params: {
      name: place,
      count: 5,
      language: 'en',
      format: 'json',
    },
  })

  return (data.results ?? []).map((result) => ({
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country,
    admin1: result.admin1,
  }))
}