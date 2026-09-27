import { useState, useId } from 'react'
import { IndianRupee, Table, Eye, PiggyBank } from 'lucide-react'
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

function formatInr(val) {
  if (val == null) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function CostTrendsChart({ applied = [], recommendations = [] }) {
  const [showTable, setShowTable] = useState(false)
  const chartId = useId()

  if ((!applied || applied.length === 0) && (!recommendations || recommendations.length === 0)) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-border-default bg-bg-surface text-center space-y-2">
        <IndianRupee className="w-8 h-8 text-ink-muted mx-auto" />
        <p className="text-sm font-bold text-ink-primary">No Cost or Savings History</p>
        <p className="text-xs text-ink-secondary">Historical fertilizer expenditures and savings will appear here.</p>
      </div>
    )
  }

  // Aggregate by month
  const monthMap = {}

  applied.forEach((item) => {
    const m = item.month || '2026-09'
    if (!monthMap[m]) monthMap[m] = { month: m, actualCost: 0, recCost: 0, saving: 0 }
    monthMap[m].actualCost += Number(item.costInr) || 0
  })

  recommendations.forEach((item) => {
    const dStr = item.createdAt || item.date || '2026-09-01'
    const m = dStr.slice(0, 7)
    if (!monthMap[m]) monthMap[m] = { month: m, actualCost: 0, recCost: 0, saving: 0 }
    const est = Number(item.estimatedCost) || Number(item.cost?.estimatedCostPerAcre) || 0
    const sav = Number(item.cost?.savingPerAcre) || Number(item.estimatedSaving) || 0
    monthMap[m].recCost = Math.max(monthMap[m].recCost, est)
    monthMap[m].saving = Math.max(monthMap[m].saving, sav)
  })

  const merged = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month))
  const latestIndex = merged.length - 1
  const latest = merged[latestIndex]

  // Chart dimensions
  const width = 640
  const height = 260
  const padding = { top: 30, right: 30, bottom: 45, left: 60 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  const maxCost = Math.max(
    ...merged.map((d) => Math.max(d.actualCost || 0, d.recCost || 0)),
    3000,
  )
  const yMax = Math.ceil((maxCost * 1.15) / 500) * 500
  const yTicks = [0, Math.round(yMax * 0.33), Math.round(yMax * 0.66), yMax]

  const getX = (index) => {
    if (merged.length === 1) return padding.left + innerWidth / 2
    return padding.left + (index / (merged.length - 1)) * innerWidth
  }

  const getY = (val) => {
    const clamped = Math.max(0, Math.min(yMax, Number(val) || 0))
    return padding.top + innerHeight - (clamped / yMax) * innerHeight
  }

  // Line paths
  const createPath = (key) => {
    return merged
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d[key]).toFixed(1)}`)
      .join(' ')
  }

  const actualPath = createPath('actualCost')
  const recPath = createPath('recCost')

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-border-default bg-bg-surface space-y-4">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-3">
        <div>
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-ink-primary">
              Expenditure & Recommended Cost Trajectory
            </h3>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Fertilizer spending per application period compared with precision recommendation budget (₹ INR)
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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            <span className="font-extrabold text-ink-primary">
              Latest Month: {formatMonth(latest.month)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-ink-primary">
              Expenditure: {formatInr(latest.actualCost)}
            </span>
            <span>•</span>
            <span className="font-semibold text-primary-700 dark:text-primary-300">
              Recommended Cost: {formatInr(latest.recCost)}
            </span>
            {latest.saving > 0 && (
              <>
                <span>•</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <PiggyBank className="w-3.5 h-3.5" />
                  Estimated Saving: {formatInr(latest.saving)}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Primary SVG Chart */}
      {!showTable && (
        <div className="space-y-2">
          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-end gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-ink-primary inline-block"></span>
              <span className="text-ink-primary">Actual Cost (₹)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-ink-primary">Recommended Cost (₹)</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-w-[500px] overflow-visible text-ink-muted"
              role="img"
              aria-labelledby={`${chartId}-title`}
            >
              <title id={`${chartId}-title`}>Fertilizer Cost and Savings Chart</title>

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
                      ₹{tickVal >= 1000 ? `${(tickVal / 1000).toFixed(1)}k` : tickVal}
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
                Cost in INR (₹)
              </text>

              {/* Paths */}
              <path
                d={actualPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-ink-primary"
              />
              <path
                d={recPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {merged.map((d, i) => {
                const cx = getX(i)
                const isLatest = i === latestIndex
                const actualY = getY(d.actualCost)
                const recY = getY(d.recCost)

                return (
                  <g key={i}>
                    {/* Points */}
                    <circle cx={cx} cy={actualY} r={isLatest ? 4.5 : 3.5} fill="currentColor" className="text-ink-primary" />
                    <circle cx={cx} cy={recY} r={isLatest ? 4.5 : 3.5} fill="#10b981" />

                    {/* Emphasized latest point halo */}
                    {isLatest && (
                      <circle
                        cx={cx}
                        cy={recY}
                        r="9"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}

                    {/* X Axis Label */}
                    <text
                      x={cx}
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
            <caption className="sr-only">Monthly Fertilizer Cost and Savings Table</caption>
            <thead className="bg-bg-subtle border-b border-border-default text-ink-muted uppercase font-bold text-[10px]">
              <tr>
                <th scope="col" className="p-3">Period</th>
                <th scope="col" className="p-3">Actual Expenditure</th>
                <th scope="col" className="p-3">Recommended Cost</th>
                <th scope="col" className="p-3">Savings Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-bg-surface font-mono">
              {merged.map((item, idx) => {
                const isLatest = idx === latestIndex
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
                    <td className="p-3 text-ink-primary">{formatInr(item.actualCost)}</td>
                    <td className="p-3 text-primary-700 dark:text-primary-300">
                      {formatInr(item.recCost)}
                    </td>
                    <td className="p-3 text-emerald-700 dark:text-emerald-400">
                      {item.saving > 0 ? formatInr(item.saving) : '—'}
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
