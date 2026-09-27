import { useId } from 'react'
import { Sparkles, Layers, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function NutrientStrata2DFallback({
  nutrientBalance = {},
  selectedNutrient = 'n',
  onSelectNutrient,
  isExpanded = false,
  onToggleExpand,
}) {
  const componentId = useId()

  const nutrients = [
    {
      key: 'n',
      symbol: 'N',
      name: 'Nitrogen',
      color: '#10b981',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderLight: 'border-emerald-300 dark:border-emerald-800',
      data: nutrientBalance.n || {
        standardDoseKgHa: 120,
        soilAdjustmentKgHa: 55,
        priorCreditKgHa: 0,
        fertilizerNeededKgHa: 130,
        soilRating: 'low',
      },
    },
    {
      key: 'p',
      symbol: 'P',
      name: 'Phosphorus',
      color: '#f59e0b',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      borderLight: 'border-amber-300 dark:border-amber-800',
      data: nutrientBalance.p || {
        standardDoseKgHa: 60,
        soilAdjustmentKgHa: 20,
        priorCreditKgHa: 0,
        fertilizerNeededKgHa: 80,
        soilRating: 'low',
      },
    },
    {
      key: 'k',
      symbol: 'K',
      name: 'Potassium',
      color: '#3b82f6',
      bgLight: 'bg-blue-50 dark:bg-blue-950/30',
      borderLight: 'border-blue-300 dark:border-blue-800',
      data: nutrientBalance.k || {
        standardDoseKgHa: 40,
        soilAdjustmentKgHa: 25,
        priorCreditKgHa: 0,
        fertilizerNeededKgHa: 30,
        soilRating: 'medium',
      },
    },
  ]

  const maxVal = Math.max(
    ...nutrients.map(
      (n) => (n.data.soilAdjustmentKgHa || 0) + (n.data.fertilizerNeededKgHa || 0) + (n.data.priorCreditKgHa || 0),
    ),
    160,
  )

  const chartHeight = 220
  const chartWidth = 100

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {nutrients.map((nut) => {
          const isSelected = selectedNutrient === nut.key
          const { standardDoseKgHa, soilAdjustmentKgHa, priorCreditKgHa, fertilizerNeededKgHa, soilRating } =
            nut.data

          // Calculate heights
          const soilH = Math.max(12, ((soilAdjustmentKgHa || 30) / maxVal) * chartHeight)
          const creditH = priorCreditKgHa > 0 ? Math.max(8, (priorCreditKgHa / maxVal) * chartHeight) : 0
          const neededH = Math.max(15, ((fertilizerNeededKgHa || 50) / maxVal) * chartHeight)
          const standardY = chartHeight - ((standardDoseKgHa || 100) / maxVal) * chartHeight

          // Gap when expanded
          const gap = isExpanded ? 16 : 2

          return (
            <div
              key={nut.key}
              onClick={() => onSelectNutrient?.(nut.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectNutrient?.(nut.key)
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-label={`${nut.name} nutrient column, click or press enter to inspect`}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative select-none ${
                isSelected
                  ? `${nut.borderLight} ${nut.bgLight} ring-2 ring-primary-500 shadow-md`
                  : 'border-border-default bg-bg-surface hover:border-primary-400'
              }`}
            >
              {/* Pillar Title */}
              <div className="flex items-center justify-between border-b border-border-default pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-lg text-white font-black text-xs flex items-center justify-center"
                    style={{ backgroundColor: nut.color }}
                  >
                    {nut.symbol}
                  </span>
                  <span className="font-extrabold text-sm text-ink-primary">
                    {nut.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-bg-subtle text-ink-muted border border-border-default">
                  {soilRating || 'Normal'}
                </span>
              </div>

              {/* 2D Stratified Column SVG */}
              <div className="w-full flex justify-center py-2">
                <svg
                  width={chartWidth}
                  height={chartHeight + 30}
                  viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
                  className="overflow-visible"
                >
                  <defs>
                    <linearGradient id={`${componentId}-fert-${nut.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={nut.color} stopOpacity="1" />
                      <stop offset="100%" stopColor={nut.color} stopOpacity="0.75" />
                    </linearGradient>
                    <linearGradient id={`${componentId}-soil-${nut.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8d6e63" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#5d4037" stopOpacity="1" />
                    </linearGradient>
                  </defs>

                  {/* Standard Demand Benchmark Target Line */}
                  <g>
                    <line
                      x1="0"
                      y1={standardY}
                      x2={chartWidth}
                      y2={standardY}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="text-ink-muted opacity-80"
                    />
                    <text
                      x={chartWidth}
                      y={standardY - 4}
                      textAnchor="end"
                      className="text-[9px] font-mono fill-ink-muted font-bold"
                    >
                      Target: {standardDoseKgHa}
                    </text>
                  </g>

                  {/* Strata 1: Native Soil Supply Layer (Base) */}
                  <g className="transition-transform duration-300">
                    <rect
                      x="15"
                      y={chartHeight - soilH}
                      width="70"
                      height={soilH}
                      rx="4"
                      fill={`url(#${componentId}-soil-${nut.key})`}
                    />
                    <text
                      x="50"
                      y={chartHeight - soilH / 2 + 3}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-white font-bold"
                    >
                      {soilAdjustmentKgHa} kg
                    </text>
                  </g>

                  {/* Strata 2: Prior Credit Layer (Middle, if present) */}
                  {priorCreditKgHa > 0 && (
                    <g
                      transform={`translate(0, ${-gap})`}
                      className="transition-transform duration-300"
                    >
                      <rect
                        x="15"
                        y={chartHeight - soilH - creditH}
                        width="70"
                        height={creditH}
                        rx="4"
                        fill="#fbbf24"
                        opacity="0.85"
                      />
                      <text
                        x="50"
                        y={chartHeight - soilH - creditH / 2 + 3}
                        textAnchor="middle"
                        className="text-[9px] font-mono fill-amber-950 font-bold"
                      >
                        -{priorCreditKgHa}
                      </text>
                    </g>
                  )}

                  {/* Strata 3: Net Fertilizer Needed Layer (Top) */}
                  <g
                    transform={`translate(0, ${-gap * (priorCreditKgHa > 0 ? 2 : 1)})`}
                    className="transition-transform duration-300"
                  >
                    <rect
                      x="15"
                      y={chartHeight - soilH - creditH - neededH}
                      width="70"
                      height={neededH}
                      rx="4"
                      fill={`url(#${componentId}-fert-${nut.key})`}
                    />
                    <text
                      x="50"
                      y={chartHeight - soilH - creditH - neededH / 2 + 4}
                      textAnchor="middle"
                      className="text-[11px] font-mono fill-white font-black"
                    >
                      {fertilizerNeededKgHa} kg
                    </text>
                  </g>

                  {/* Base Pedestal Line */}
                  <line
                    x1="5"
                    y1={chartHeight}
                    x2="95"
                    y2={chartHeight}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-border-default"
                  />
                  <text
                    x="50"
                    y={chartHeight + 16}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-ink-muted uppercase tracking-wider"
                  >
                    kg / ha
                  </text>
                </svg>
              </div>

              {/* Data Summary */}
              <div className="pt-2 border-t border-border-default/60 space-y-1 text-xs">
                <div className="flex justify-between text-ink-secondary">
                  <span>Soil Reserve:</span>
                  <strong className="text-ink-primary font-mono">{soilAdjustmentKgHa} kg/ha</strong>
                </div>
                <div className="flex justify-between text-ink-secondary">
                  <span>Net Deficit:</span>
                  <strong className="text-primary-700 dark:text-primary-300 font-mono font-black">
                    +{fertilizerNeededKgHa} kg/ha
                  </strong>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend & Stratification Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-bg-subtle border border-border-default text-xs">
        <div className="flex flex-wrap items-center gap-4 text-ink-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#5d4037]"></span>
            <span>Soil Supply (Native Reserve)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600"></span>
            <span>Net Fertilizer Needed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-ink-muted inline-block"></span>
            <span>Standard Crop Demand</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className="text-xs font-bold text-primary-700 dark:text-primary-300 hover:underline cursor-pointer flex items-center gap-1"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isExpanded ? 'Collapse Strata' : 'Expand Strata Physics'}</span>
        </button>
      </div>
    </div>
  )
}
