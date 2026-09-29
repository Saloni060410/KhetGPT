import { useEffect, useState } from 'react'
import * as endpoints from '../services/endpoints.js'
import { ratingsFromReference, DEFAULT_RATINGS } from '../utils/soilHealth.js'

/**
 * Latest soil test and latest recommendation for each plot, plus the soil rating cut-offs.
 * Failures degrade per plot (that card shows "no soil test yet") instead of blanking the page.
 */
export function usePlotDetails(plots) {
  const [loaded, setLoaded] = useState({ key: '', details: {} })
  const [ratings, setRatings] = useState(DEFAULT_RATINGS)

  const key = plots.map((p) => p.field.id).join(',')

  useEffect(() => {
    let cancelled = false
    endpoints
      .getReferenceSoilRatings()
      .then((list) => {
        if (!cancelled) setRatings(ratingsFromReference(list))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!plots.length) return undefined
    let cancelled = false
    Promise.all(
      plots.map(async ({ field }) => {
        const [soilRes, recRes] = await Promise.all([
          endpoints.getSoilTests(field.id, { limit: 1 }).catch(() => null),
          endpoints.getRecommendations(field.id, { limit: 1 }).catch(() => null),
        ])
        return [
          field.id,
          { soil: (soilRes?.items || [])[0] || null, recommendation: (recRes?.items || [])[0] || null },
        ]
      }),
    ).then((entries) => {
      if (!cancelled) setLoaded({ key, details: Object.fromEntries(entries) })
    })
    return () => {
      cancelled = true
    }
    // key captures the set of field ids; plots itself changes identity on every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const isCurrent = loaded.key === key
  return { details: isCurrent ? loaded.details : {}, ratings, loading: plots.length > 0 && !isCurrent }
}

/** The soonest unfinished line of a recommendation's schedule, with days until it is due. */
export function nextApplication(recommendation, daysFromToday) {
  const lines = (recommendation?.schedule || []).filter((l) => l.apply_by)
  if (!lines.length) return null
  const dated = lines
    .map((l) => ({ line: l, days: daysFromToday(l.apply_by) }))
    .filter((x) => x.days != null)
    .sort((a, b) => a.days - b.days)
  const upcoming = dated.find((x) => x.days >= 0) || dated[dated.length - 1]
  return upcoming || null
}
