import { useState, useId } from 'react'
import { FlaskConical, Table, Eye } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { getNutrientRating } from '../../utils/soilRating.js'

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
  } catch {
    return dateStr
  }
}

export default function NutrientLevelsChart({ soilTests = [] }) {
  const [showTable, setShowTable] = useState(false)
  const chartId = useId()

  if (!soilTests || soilTests.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-border-default bg-bg-surface text-center space-y-2">
        <FlaskConical className="w-8 h-8 text-ink-muted mx-auto" />
        <p className="text-sm font-bold text-ink-primary">No Soil Nutrient Trends Available</p>
        <p className="text-xs text-ink-secondary">Record at least one soil test to begin tracking fertility over time.</p>
      </div>
    )
  }

  // Sort chronological
  const sorted = [...soilTests].sort((a, b) => new Date(a.testedOn || a.date || 0) - new Date(b.testedOn || b.date || 0))
  const latestIndex = sorted.length - 1
  const latest = sorted[latestIndex]

  // Chart dimensions
  const width = 640
  const height = 260
  const padding = { top: 30, right: 35, bottom: 45, left: 50 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  // Nutrient domains
  const maxN = Math.max(...sorted.map((d) => Number(d.n) || 0), 250)
  const yMax = Math.ceil((maxN * 1.15) / 50) * 50 // Round to nearest 50
  const yTicks = [0, Math.round(yMax * 0.33), Math.round(yMax * 0.66), yMax]

  const getX = (index) => {
    if (sorted.length === 1) return padding.left + innerWidth / 2
    return padding.left + (index / (sorted.length - 1)) * innerWidth
  }

  const getY = (val) => {
    const clamped = Math.max(0, Math.min(yMax, Number(val) || 0))
    return padding.top + innerHeight - (clamped / yMax) * innerHeight
  }

  // Generate SVG path for a metric
  const createPath = (key) => {
    return sorted
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d[key]).toFixed(1)}`)
      .join(' ')
  }

  const createAreaPath = (key) => {
    const linePath = createPath(key)
    const lastX = getX(sorted.length - 1).toFixed(1)
    const firstX = getX(0).toFixed(1)
    const bottomY = (padding.top + innerHeight).toFixed(1)
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }

  const nPath = createPath('n')
  const pPath = createPath('p')
  const kPath = createPath('k')
  const nArea = createAreaPath('n')

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-border-default bg-bg-surface space-y-4">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-3">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-ink-primary">
              Soil Nutrient Trajectory (N, P, K)
            </h3>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Available macronutrients across historical soil lab analyses (kg/ha)
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
              Latest Test: {formatDateShort(latest.testedOn || latest.date)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              N: {latest.n} kg/ha ({getNutrientRating('n', latest.n).shortLabel})
            </span>
            <span>•</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              P: {latest.p} kg/ha ({getNutrientRating('p', latest.p).shortLabel})
            </span>
            <span>•</span>
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              K: {latest.k} kg/ha ({getNutrientRating('k', latest.k).shortLabel})
            </span>
            <span>•</span>
            <span className="text-ink-secondary">
              pH: {latest.ph} | OC: {latest.organicCarbon}%
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
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-ink-primary">Nitrogen (N)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-ink-primary">Phosphorus (P)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              <span className="text-ink-primary">Potassium (K)</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-w-[500px] overflow-visible text-ink-muted"
              role="img"
              aria-labelledby={`${chartId}-title`}
            >
              <title id={`${chartId}-title`}>Soil Nutrient Levels Over Time Chart</title>

              <defs>
                <linearGradient id={`${chartId}-nGradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

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
                kg / ha
              </text>

              {/* Shaded Area for Nitrogen */}
              <path d={nArea} fill={`url(#${chartId}-nGradient)`} />

              {/* Lines */}
              <path
                d={nPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={pPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={kPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {sorted.map((d, i) => {
                const cx = getX(i)
                const isLatest = i === latestIndex
                const nY = getY(d.n)
                const pY = getY(d.p)
                const kY = getY(d.k)

                return (
                  <g key={i}>
                    {/* Normal points */}
                    <circle cx={cx} cy={pY} r={isLatest ? 4 : 3} fill="#f59e0b" />
                    <circle cx={cx} cy={kY} r={isLatest ? 4 : 3} fill="#3b82f6" />
                    <circle cx={cx} cy={nY} r={isLatest ? 5 : 3.5} fill="#10b981" />

                    {/* Emphasized latest point halo */}
                    {isLatest && (
                      <circle
                        cx={cx}
                        cy={nY}
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
                      {formatDateShort(d.testedOn || d.date)}
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
            <caption className="sr-only">Historical Soil Nutrient Test Logs</caption>
            <thead className="bg-bg-subtle border-b border-border-default text-ink-muted uppercase font-bold text-[10px]">
              <tr>
                <th scope="col" className="p-3">Sample Date</th>
                <th scope="col" className="p-3">Nitrogen (N)</th>
                <th scope="col" className="p-3">Phosphorus (P)</th>
                <th scope="col" className="p-3">Potassium (K)</th>
                <th scope="col" className="p-3">pH</th>
                <th scope="col" className="p-3">Organic Carbon</th>
                <th scope="col" className="p-3">Moisture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-bg-surface font-mono">
              {sorted.map((item, idx) => {
                const isLatest = idx === latestIndex
                return (
                  <tr
                    key={idx}
                    className={isLatest ? 'bg-primary-50/30 dark:bg-primary-950/20 font-bold' : ''}
                  >
                    <td className="p-3 font-sans text-ink-primary">
                      {formatDateShort(item.testedOn || item.date)}
                      {isLatest && (
                        <span className="ml-1.5 text-[10px] text-primary-700 dark:text-primary-300 font-extrabold uppercase">
                          (Latest)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-emerald-700 dark:text-emerald-400">
                      {item.n} kg/ha ({getNutrientRating('n', item.n).shortLabel})
                    </td>
                    <td className="p-3 text-amber-700 dark:text-amber-400">
                      {item.p} kg/ha ({getNutrientRating('p', item.p).shortLabel})
                    </td>
                    <td className="p-3 text-blue-700 dark:text-blue-400">
                      {item.k} kg/ha ({getNutrientRating('k', item.k).shortLabel})
                    </td>
                    <td className="p-3 text-ink-primary">{item.ph}</td>
                    <td className="p-3 text-ink-primary">{item.organicCarbon}%</td>
                    <td className="p-3 text-ink-primary">{item.moisture}%</td>
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
