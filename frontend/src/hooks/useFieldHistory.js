import { useEffect, useState, useCallback } from 'react'
import * as endpoints from '../services/endpoints.js'
import { ratingsFromReference, DEFAULT_RATINGS } from '../utils/soilHealth.js'

/**
 * Everything recorded about one field: the field itself, its soil tests, recommendations and
 * fertilizer logs (each newest first), plus the reference lists needed to name things.
 */
export function useFieldHistory(fieldId) {
  const [state, setState] = useState({
    field: null,
    soilTests: [],
    recommendations: [],
    logs: [],
    fertilizers: [],
    crops: [],
    ratings: DEFAULT_RATINGS,
    status: 'loading', // loading | ready | error
    error: null,
  })
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!fieldId) return undefined
    let cancelled = false
    setState((s) => ({ ...s, status: 'loading', error: null }))
    async function load() {
      try {
        const [field, soil, recs, logs, fertilizers, crops, ratings] = await Promise.all([
          endpoints.getFieldById(fieldId),
          endpoints.getSoilTests(fieldId, { limit: 50 }),
          endpoints.getRecommendations(fieldId, { limit: 50 }),
          endpoints.getFertilizerLogs(fieldId, { limit: 50 }),
          endpoints.getReferenceFertilizers().catch(() => []),
          endpoints.getReferenceCrops().catch(() => []),
          endpoints.getReferenceSoilRatings().catch(() => null),
        ])
        if (cancelled) return
        setState({
          field,
          soilTests: soil?.items || [],
          recommendations: recs?.items || [],
          logs: logs?.items || [],
          fertilizers,
          crops,
          ratings: ratings ? ratingsFromReference(ratings) : DEFAULT_RATINGS,
          status: 'ready',
          error: null,
        })
      } catch (err) {
        if (!cancelled) setState((s) => ({ ...s, status: 'error', error: err?.message || 'Could not load this field.' }))
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [fieldId, version])

  const cropName = (id) => state.crops.find((c) => c.id === id)?.name_en || (id ? id.charAt(0).toUpperCase() + id.slice(1) : '')
  const fertName = (id) => state.fertilizers.find((f) => f.id === id)?.name || String(id || '').replace(/_/g, ' ')

  return { ...state, cropName, fertName, reload }
}
