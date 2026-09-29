import { Sprout, Droplets, CalendarDays } from 'lucide-react'
import ProductIcon from './ProductIcon.jsx'
import { formatDate, titleCase } from '../../utils/format.js'

function daysAfterSowing(sowingDate, applyBy) {
  if (!sowingDate || !applyBy) return null
  const a = new Date(String(sowingDate).slice(0, 10))
  const b = new Date(String(applyBy).slice(0, 10))
  const d = Math.round((b - a) / 86_400_000)
  return Number.isFinite(d) && d >= 0 ? d : null
}

/** The recommendation's schedule as a rail of dose cards. Fields are the ML service's snake_case keys. */
export default function DoseTimeline({ schedule, sowingDate, areaAcres, fertName, fertilizerMeta }) {
  return (
    <ol className="relative space-y-3">
      <span className="absolute top-4 bottom-4 left-[0.62rem] w-0.5 bg-border-strong/60" aria-hidden="true" />
      {schedule.map((line, i) => {
        const das = daysAfterSowing(sowingDate, line.apply_by)
        const meta = fertilizerMeta?.[line.fertilizer_type]
        const bags = meta?.bag_size_kg && areaAcres
          ? `≈ ${((line.quantity_kg_per_acre * areaAcres) / meta.bag_size_kg).toFixed(1)} bags of ${meta.bag_size_kg} kg across ${areaAcres} acres`
          : null
        return (
          <li key={`${line.stage}-${line.fertilizer_type}-${i}`} className="relative grid grid-cols-[1.4rem_1fr] gap-x-3">
            <span className="pt-6 flex justify-center" aria-hidden="true">
              <span className="w-3.5 h-3.5 rounded-full bg-primary-600 ring-4 ring-white" />
            </span>
            <div className="rounded-lg bg-bg-base border border-border-default shadow-sm p-4 flex gap-4">
              <ProductIcon type={line.fertilizer_type} className="w-14 h-16 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-ink-secondary">
                  {das != null ? `Day ${das} (${titleCase(line.stage)})` : titleCase(line.stage)}
                </p>
                <h3 className="text-lg font-semibold text-ink-primary leading-snug">
                  Apply {Number(line.quantity_kg_per_acre).toFixed(1)} kg/acre {fertName(line.fertilizer_type)}
                </h3>
                <ul className="mt-1.5 space-y-1 text-sm text-ink-secondary">
                  <li className="flex items-start gap-1.5">
                    <CalendarDays className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    {line.apply_by ? `Apply by ${formatDate(line.apply_by)}` : 'No fixed date for this stage'}
                  </li>
                  {line.timing_note && (
                    <li className="flex items-start gap-1.5"><Droplets className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />{line.timing_note}</li>
                  )}
                  {bags && <li className="flex items-start gap-1.5"><Sprout className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />{bags}</li>}
                </ul>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
