import { DialGauge } from '../ui/Gauges.jsx'

const LEVEL = {
  LOW: { value: 0.14, label: 'Low risk', color: '#3f8f3a' },
  MEDIUM: { value: 0.5, label: 'Medium risk', color: '#c98a1a' },
  HIGH: { value: 0.86, label: 'High risk', color: '#c9683f' },
}

/**
 * Eco-health meter. The needle shows the plan's over/under-application risk level from the model.
 * The left figure compares the plan's total nutrient need with the published standard dose, both
 * taken from the recommendation's own nutrient balance.
 */
export default function EcoMeter({ riskLevel, nutrientBalance }) {
  const level = LEVEL[riskLevel] || LEVEL.LOW
  let vsStandard = null
  if (nutrientBalance) {
    const parts = ['n', 'p', 'k'].map((k) => nutrientBalance[k]).filter(Boolean)
    const standard = parts.reduce((a, x) => a + (x.standard_dose_kg_ha || 0), 0)
    const needed = parts.reduce((a, x) => a + (x.fertilizer_needed_kg_ha || 0), 0)
    if (standard > 0) vsStandard = Math.round((1 - needed / standard) * 100)
  }

  return (
    <div className="flex flex-col items-center">
      <DialGauge
        value={level.value}
        size={200}
        thickness={20}
        needleColor="#2f3a22"
        segments={[
          { to: 0.34, color: '#4fc02c' },
          { to: 0.67, color: '#e3a534' },
          { to: 1, color: '#c9683f' },
        ]}
        label={`Eco-health meter: ${level.label}`}
      />
      <div className="mt-3 grid grid-cols-2 gap-3 text-center w-full">
        <div>
          {vsStandard != null ? (
            <div className="text-xl font-bold whitespace-nowrap" style={{ color: vsStandard >= 0 ? '#3f8f3a' : '#c9683f' }}>
              {vsStandard >= 0 ? `${vsStandard}%` : `+${Math.abs(vsStandard)}%`}
            </div>
          ) : (
            <div className="text-xl font-bold text-ink-muted">&ndash;</div>
          )}
          <div className="text-xs text-ink-secondary leading-tight">{vsStandard != null && vsStandard < 0 ? 'More than' : 'Less than'}<br />standard dose</div>
        </div>
        <div>
          <div className="text-xl font-bold whitespace-nowrap" style={{ color: level.color }}>{level.label.split(' ')[0]}</div>
          <div className="text-xs text-ink-secondary leading-tight">Over-application<br />risk</div>
        </div>
      </div>
    </div>
  )
}
