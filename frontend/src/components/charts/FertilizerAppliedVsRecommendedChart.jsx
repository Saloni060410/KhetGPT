import { useState, useId } from 'react'
import { Scale, Table, Eye, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'
import Button from '../ui/Button.jsx'

function formatMonth(monthStr) {
  if (!monthStr) return ''
  try {
    const parts = monthStr.split('-')
    if (parts.length === 2) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
      return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    }
    return monthStr
  } catch {
    return monthStr
  }
}

export default function FertilizerAppliedVsRecommendedChart({ applied = [], recommendations = [] }) {
  const [showTable, setShowTable] = useState(false)
  const chartId = useId()

  if ((!applied || applied.length === 0) && (!recommendations || recommendations.length === 0)) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-border-default bg-bg-surface text-center space-y-2">
        <Scale className="w-8 h-8 text-ink-muted mx-auto" />
        <p className="text-sm font-bold text-ink-primary">No Application Variance Records</p>
        <p className="text-xs text-ink-secondary">Applied logs and recommendations will compare dosage alignment here.</p>
      </div>
    )
  }

  // Build unified month dataset
  const monthMap = {}

  applied.forEach((item) => {
    const m = item.month || '2026-09'
    if (!monthMap[m]) monthMap[m] = { month: m, appliedN: 0, appliedTotal: 0, recN: 0, recTotal: 0 }
    const n = Number(item.nitrogenKgAcre) || 0
    const p = Number(item.p2o5KgAcre) || 0
    const k = Number(item.k2oKgAcre) || 0
    monthMap[m].appliedN += n
    monthMap[m].appliedTotal += n + p + k
  })

  recommendations.forEach((item) => {
    const dStr = item.createdAt || item.date || '2026-09-01'
    const m = dStr.slice(0, 7)
    if (!monthMap[m]) monthMap[m] = { month: m, appliedN: 0, appliedTotal: 0, recN: 0, recTotal: 0 }
    const recN = Number(item.fertilizerNeededN) || 0
    const q = Number(item.quantityKgPerAcre) || 0
    monthMap[m].recN = Math.max(monthMap[m].recN, recN > 0 ? recN : q * 0.46)
    monthMap[m].recTotal = Math.max(monthMap[m].recTotal, q)
  })

  const merged = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month))
  const latestIndex = merged.length - 1
  const latest = merged[latestIndex]

  // Chart dimensions
  const width = 640
  const height = 260
  const padding = { top: 30, right: 30, bottom: 45, left: 50 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  const maxVal = Math.max(
    ...merged.map((d) => Math.max(d.appliedTotal || 0, d.recTotal || 0)),
    60,
  )
  const yMax = Math.ceil((maxVal * 1.2) / 20) * 20
  const yTicks = [0, Math.round(yMax * 0.25), Math.round(yMax * 0.5), Math.round(yMax * 0.75), yMax]

  const barGroupWidth = innerWidth / Math.max(merged.length, 1)
  const barWidth = Math.min(22, (barGroupWidth - 12) / 2)

  const getY = (val) => {
    const clamped = Math.max(0, Math.min(yMax, Number(val) || 0))
    return padding.top + innerHeight - (clamped / yMax) * innerHeight
  }

  const variance = latest ? (latest.appliedTotal - latest.recTotal).toFixed(1) : 0
  const isOver = variance > 0

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-border-default bg-bg-surface space-y-4">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary-600" />
            <h3 className="text-base font-bold text-ink-primary">
              Fertilizer Applied vs. Recommended Target
            </h3>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Monthly actual fertilizer applied against agronomist recommendation (kg/acre)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTable((prev) => !prev)}
            leftIcon={showTable ? Eye : Table}
            className="text-xs"
          >
            {showTable ? 'View Chart View' : 'Accessible Table'}
          </Button>
        </div>
      </div>

      {/* Emphasized Latest Point Banner */}
      {latest && (
        <div className="p-3 rounded-xl bg-bg-subtle border border-border-default flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-600"></span>
            </span>
            <span className="font-extrabold text-ink-primary">
              Latest Month: {formatMonth(latest.month)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              Applied: {latest.appliedTotal.toFixed(1)} kg/ac
            </span>
            <span>•</span>
            <span className="font-semibold text-primary-700 dark:text-primary-300">
              Recommended: {latest.recTotal.toFixed(1)} kg/ac
            </span>
            <span>•</span>
            <span
              className={`font-extrabold flex items-center gap-1 ${
                Math.abs(variance) <= 5
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : isOver
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-blue-700 dark:text-blue-400'
              }`}
            >
              {Math.abs(variance) <= 5 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Dose Alignment
                </>
              ) : isOver ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" /> +{variance} kg/ac Over-application
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5" /> {variance} kg/ac Under Target
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Primary SVG Chart */}
      {!showTable && (
        <div className="space-y-2">
          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-end gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-blue-500 inline-block"></span>
              <span className="text-ink-primary">Actual Applied (kg/ac)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-primary-600 inline-block"></span>
              <span className="text-ink-primary">Recommended Target (kg/ac)</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-w-[500px] overflow-visible text-ink-muted"
              role="img"
              aria-labelledby={`${chartId}-title`}
            >
              <title id={`${chartId}-title`}>Fertilizer Applied vs Recommended Target Chart</title>

              {/* Grid Lines & Y Axis Labels */}
              {yTicks.map((tickVal, idx) => {
                const y = getY(tickVal)
                return (
                  <g key={idx}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + innerWidth}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.15"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[11px] fill-ink-muted font-mono"
                    >
                      {tickVal}
                    </text>
                  </g>
                )
              })}

              {/* Y Axis Unit Label */}
              <text
                x={padding.left}
                y={padding.top - 12}
                textAnchor="start"
                className="text-[10px] font-bold fill-ink-muted uppercase tracking-wider"
              >
                kg / acre
              </text>

              {/* Grouped Bars */}
              {merged.map((d, i) => {
                const isLatest = i === latestIndex
                const groupCenterX = padding.left + i * barGroupWidth + barGroupWidth / 2

                const appliedX = groupCenterX - barWidth - 2
                const appliedY = getY(d.appliedTotal)
                const appliedHeight = Math.max(0, padding.top + innerHeight - appliedY)

                const recX = groupCenterX + 2
                const recY = getY(d.recTotal)
                const recHeight = Math.max(0, padding.top + innerHeight - recY)

                return (
                  <g key={i}>
                    {/* Applied Bar (Blue) */}
                    <rect
                      x={appliedX}
                      y={appliedY}
                      width={barWidth}
                      height={appliedHeight}
                      rx="3"
                      fill="#3b82f6"
                      opacity={isLatest ? 1 : 0.85}
                    />

                    {/* Recommended Bar (Primary Green) */}
                    <rect
                      x={recX}
                      y={recY}
                      width={barWidth}
                      height={recHeight}
                      rx="3"
                      fill="#059669"
                      opacity={isLatest ? 1 : 0.85}
                    />

                    {/* Emphasized latest point outline */}
                    {isLatest && (
                      <rect
                        x={appliedX - 3}
                        y={Math.min(appliedY, recY) - 4}
                        width={barWidth * 2 + 10}
                        height={padding.top + innerHeight - Math.min(appliedY, recY) + 6}
                        fill="none"
                        stroke="#059669"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        rx="5"
                      />
                    )}

                    {/* X Axis Label */}
                    <text
                      x={groupCenterX}
                      y={padding.top + innerHeight + 20}
                      textAnchor="middle"
                      className={`text-[11px] font-mono ${
                        isLatest ? 'fill-ink-primary font-bold' : 'fill-ink-muted'
                      }`}
                    >
                      {formatMonth(d.month)}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Accessible Table Alternative */}
      {showTable && (
        <div className="overflow-x-auto rounded-xl border border-border-default">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Monthly Fertilizer Applied vs Recommended Table</caption>
            <thead className="bg-bg-subtle border-b border-border-default text-ink-muted uppercase font-bold text-[10px]">
              <tr>
                <th scope="col" className="p-3">Month</th>
                <th scope="col" className="p-3">Total Applied</th>
                <th scope="col" className="p-3">Applied N</th>
                <th scope="col" className="p-3">Recommended Target</th>
                <th scope="col" className="p-3">Variance</th>
                <th scope="col" className="p-3">Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-bg-surface font-mono">
              {merged.map((item, idx) => {
                const isLatest = idx === latestIndex
                const diff = (item.appliedTotal - item.recTotal).toFixed(1)
                return (
                  <tr
                    key={idx}
                    className={isLatest ? 'bg-primary-50/30 dark:bg-primary-950/20 font-bold' : ''}
                  >
                    <td className="p-3 font-sans text-ink-primary">
                      {formatMonth(item.month)}
                      {isLatest && (
                        <span className="ml-1.5 text-[10px] text-primary-700 dark:text-primary-300 font-extrabold uppercase">
                          (Latest)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-blue-700 dark:text-blue-400">
                      {item.appliedTotal.toFixed(1)} kg/ac
                    </td>
                    <td className="p-3 text-ink-secondary">
                      {item.appliedN.toFixed(1)} kg/ac
                    </td>
                    <td className="p-3 text-primary-700 dark:text-primary-300">
                      {item.recTotal.toFixed(1)} kg/ac
                    </td>
                    <td
                      className={`p-3 ${
                        diff > 0
                          ? 'text-amber-700 dark:text-amber-400'
                          : diff < 0
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff} kg/ac
                    </td>
                    <td className="p-3 font-sans">
                      {Math.abs(diff) <= 5 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">Optimal</span>
                      ) : diff > 0 ? (
                        <span className="text-amber-700 dark:text-amber-400 font-bold">Over Target</span>
                      ) : (
                        <span className="text-blue-700 dark:text-blue-400 font-bold">Under Target</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
