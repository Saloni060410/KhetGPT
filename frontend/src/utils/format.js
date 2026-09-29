const dateOpts = { year: 'numeric', month: 'short', day: 'numeric' }

export function formatDate(value, opts = dateOpts) {
  if (!value) return '-'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-IN', opts)
}

export function formatShortDate(value) {
  return formatDate(value, { month: 'short', day: 'numeric' })
}

/** "HIGH" -> "High" */
export function capitalize(text) {
  const t = String(text || '').toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** 22.417 -> "22.4"; whole numbers stay whole. */
export function roundQty(value, digits = 1) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return String(Math.round(n * 10 ** digits) / 10 ** digits)
}

/** "wheat" -> "Wheat", "crown_root_initiation" -> "Crown Root Initiation" */
export function titleCase(text) {
  return String(text || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'Farmer'
}

/** Whole days from today (local midnight) to the given ISO date; negative when past. */
export function daysFromToday(iso) {
  if (!iso) return null
  const target = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target - today) / 86_400_000)
}

export function plotLetter(index) {
  return String.fromCharCode(65 + (index % 26))
}
