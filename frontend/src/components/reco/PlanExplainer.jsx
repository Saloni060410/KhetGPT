import { Info } from 'lucide-react'

const NUTRIENTS = [
  ['n', 'Nitrogen (N)'],
  ['p', 'Phosphorus (P₂O₅)'],
  ['k', 'Potassium (K₂O)'],
]

const signed = (v) => (v > 0 ? `+${v}` : `${v}`)
const round = (v) => Math.round((v ?? 0) * 10) / 10

/** The dose built from its three published terms, per nutrient, plus the model's stated reasons. */
export default function PlanExplainer({ recommendation }) {
  const balance = recommendation.explanation?.nutrient_balance
  const factors = recommendation.topFactors?.length ? recommendation.topFactors : recommendation.explanation?.top_factors || []
  const notes = recommendation.explanation?.data_notes || []

  return (
    <div className="space-y-5">
      {balance && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[30rem]">
            <caption className="sr-only">How each nutrient dose was calculated, in kg per hectare</caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border-default">
                <th scope="col" className="py-2 pr-3 font-semibold">Nutrient</th>
                <th scope="col" className="py-2 px-3 font-semibold text-right">Standard dose</th>
                <th scope="col" className="py-2 px-3 font-semibold text-right">Soil-test adjustment</th>
                <th scope="col" className="py-2 px-3 font-semibold text-right">Credit</th>
                <th scope="col" className="py-2 pl-3 font-semibold text-right">Needed</th>
              </tr>
            </thead>
            <tbody>
              {NUTRIENTS.filter(([key]) => balance[key]).map(([key, label]) => {
                const b = balance[key]
                return (
                  <tr key={key} className="border-b border-border-subtle last:border-0">
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium text-ink-primary">{label}</th>
                    <td className="py-2.5 px-3 text-right">{round(b.standard_dose_kg_ha)}</td>
                    <td className="py-2.5 px-3 text-right">{signed(round(b.soil_adjustment_kg_ha))}</td>
                    <td className="py-2.5 px-3 text-right">&minus;{round(b.prior_credit_kg_ha)}</td>
                    <td className="py-2.5 pl-3 text-right font-semibold text-primary-700">{round(b.fertilizer_needed_kg_ha)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-muted">
            {recommendation.explanation?.formula || 'Fertilizer needed = standard dose + soil-test adjustment − credit for recent applications.'} Amounts in kg per hectare.
          </p>
        </div>
      )}

      {factors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ink-primary">Why this dose</h4>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-secondary list-disc pl-5">
            {factors.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {notes.length > 0 && (
        <div className="rounded-md bg-info-bg border border-info-border p-3 text-sm text-info-text flex gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <ul className="space-y-1">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
