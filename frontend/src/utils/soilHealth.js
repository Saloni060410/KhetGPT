/**
 * Soil health score, 0-100, computed from a real soil test against the published rating cut-offs
 * (GET /reference/soil-ratings, or the ICAR defaults below when that list is unavailable).
 *
 * Each of N, P, K and organic carbon scores 100 inside its healthy band, scales down in
 * proportion when it falls short, and loses a little (never below 50) when it is in surplus.
 * pH scores 100 between 6.5 and 7.5 and loses 30 points per pH unit outside it.
 * The score is the mean of those five. It is a summary of the soil test, not a separate
 * measurement, and every input is shown next to it wherever it appears.
 */

export const DEFAULT_RATINGS = {
  n: { low_below: 280, high_above: 560 },
  p: { low_below: 10, high_above: 25 },
  k: { low_below: 108, high_above: 280 },
  organic_carbon: { low_below: 0.5, high_above: 0.75 },
}

export function ratingsFromReference(list) {
  const out = { ...DEFAULT_RATINGS }
  for (const row of Array.isArray(list) ? list : []) {
    if (out[row.parameter] && row.low_below != null && row.high_above != null) {
      out[row.parameter] = { low_below: row.low_below, high_above: row.high_above }
    }
  }
  return out
}

function bandScore(value, { low_below: low, high_above: high }) {
  if (value < low) return Math.max(0, (value / low) * 100)
  if (value > high) return Math.max(50, (high / value) * 100)
  return 100
}

export function phScore(ph) {
  if (ph >= 6.5 && ph <= 7.5) return 100
  const dist = ph < 6.5 ? 6.5 - ph : ph - 7.5
  return Math.max(0, 100 - dist * 30)
}

export function nutrientLevel(value, band) {
  if (value == null) return null
  if (value < band.low_below) return 'low'
  if (value > band.high_above) return 'high'
  return 'medium'
}

export function soilHealthScore(soil, ratings = DEFAULT_RATINGS) {
  if (!soil) return null
  const parts = [
    bandScore(soil.n, ratings.n),
    bandScore(soil.p, ratings.p),
    bandScore(soil.k, ratings.k),
    bandScore(soil.organicCarbon, ratings.organic_carbon),
    phScore(soil.ph),
  ]
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
}

export function soilHealthBand(score) {
  if (score == null) return { label: 'No soil test yet', color: '#9a9078', tone: 'none' }
  if (score >= 80) return { label: 'Excellent', color: '#3f8f3a', tone: 'good' }
  if (score >= 60) return { label: 'Healthy', color: '#a3b83a', tone: 'ok' }
  if (score >= 40) return { label: 'Needs care', color: '#e0902f', tone: 'warn' }
  return { label: 'Poor', color: '#c9683f', tone: 'bad' }
}

/** Overall N-P-K status text for a dashboard card: "Normal", "Low N, P", "High K". */
export function npkSummary(soil, ratings = DEFAULT_RATINGS) {
  if (!soil) return null
  const levels = {
    N: nutrientLevel(soil.n, ratings.n),
    P: nutrientLevel(soil.p, ratings.p),
    K: nutrientLevel(soil.k, ratings.k),
  }
  const low = Object.keys(levels).filter((k) => levels[k] === 'low')
  const high = Object.keys(levels).filter((k) => levels[k] === 'high')
  if (!low.length && !high.length) return { text: 'Normal', tone: 'good', levels }
  if (low.length) return { text: `Low ${low.join(', ')}`, tone: 'warn', levels }
  return { text: `High ${high.join(', ')}`, tone: 'ok', levels }
}
