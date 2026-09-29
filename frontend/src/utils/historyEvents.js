import { nutrientLevel } from './soilHealth.js'
import { capitalize, roundQty } from './format.js'

const LEVEL_LABEL = { low: 'Low', medium: 'Medium', high: 'High' }

/**
 * One list of dated events for a field, newest first, built only from records that exist:
 * soil tests, fertilizer applications, generated plans and the sowing date.
 * kind is one of: soil | fertilizer | plan | sowing.
 */
export function buildHistoryEvents({ field, soilTests, logs, recommendations, ratings, fertName, cropName }) {
  const events = []

  for (const s of soilTests || []) {
    const level = (key, band) => LEVEL_LABEL[nutrientLevel(s[key], band)] || ''
    events.push({
      id: `soil-${s.id}`,
      kind: 'soil',
      date: s.testedOn,
      title: 'Soil Test Results',
      lines: [
        `Nitrogen (N): ${s.n} kg/ha (${level('n', ratings.n)})`,
        `Phosphorus (P): ${s.p} kg/ha (${level('p', ratings.p)})`,
        `Potassium (K): ${s.k} kg/ha (${level('k', ratings.k)})`,
        `pH ${s.ph} · Organic carbon ${s.organicCarbon}% · Moisture ${s.moisture}%`,
      ],
    })
  }

  for (const l of logs || []) {
    events.push({
      id: `log-${l.id}`,
      kind: 'fertilizer',
      date: l.appliedOn,
      title: 'Fertilizer Application',
      productType: l.type,
      lines: [`Applied ${roundQty(l.quantityKgPerAcre)} kg/acre ${fertName(l.type)}`],
    })
  }

  for (const r of recommendations || []) {
    const risk = r.risk?.level ? `${capitalize(r.risk.level)} risk` : null
    events.push({
      id: `rec-${r.id}`,
      kind: 'plan',
      date: r.createdAt,
      title: 'Fertilizer Plan Generated',
      lines: [
        `${cropName(r.cropType)}: ${roundQty(r.quantityKgPerAcre)} kg/acre ${fertName(r.fertilizerType)}${risk ? ` · ${risk}` : ''}`,
        r.estimatedCost != null ? `Estimated cost ₹${Math.round(r.estimatedCost)}/acre` : null,
      ].filter(Boolean),
    })
  }

  if (field?.sowingDate) {
    events.push({
      id: 'sowing',
      kind: 'sowing',
      date: field.sowingDate,
      title: 'Seeding Complete',
      lines: [`${cropName(field.cropType)} sown${field.areaAcres ? ` on ${field.areaAcres} acres` : ''}`],
    })
  }

  return events.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export const EVENT_FILTERS = [
  { id: 'all', label: 'All events' },
  { id: 'soil', label: 'Soil tests' },
  { id: 'fertilizer', label: 'Fertilizer applications' },
  { id: 'plan', label: 'Plans generated' },
  { id: 'sowing', label: 'Sowing' },
]
