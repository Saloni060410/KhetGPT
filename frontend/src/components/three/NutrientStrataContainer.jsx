import { useState, useEffect, Suspense, useCallback, lazy } from 'react'
import {
  Layers,
  Maximize2,
  Minimize2,
  Box,
  BarChart2,
  Info,
  RotateCcw,
} from 'lucide-react'
import { canRun3DScene } from '../../utils/deviceCapabilities.js'
import NutrientStrata2DFallback from './NutrientStrata2DFallback.jsx'

import NutrientStrataSkeleton from './NutrientStrataSkeleton.jsx'

// Lazy-load the 3D Three.js / R3F scene so the initial JS bundle does not grow!
const NutrientStrataScene = lazy(() => import('./NutrientStrataScene.jsx'))

export { NutrientStrataSkeleton }

/**
 * Explorable Nutrient Balance Visualization Container
 * Coordinates 3D Scene / 2D Fallback, Keyboard Navigation, and Accessible Data Table
 */
export default function NutrientStrataContainer({
  nutrientBalance = {},
  soilTest = null,
  soilRatings = null,
}) {
  const [selectedNutrient, setSelectedNutrient] = useState('n')
  const [isExpanded, setIsExpanded] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const [force2D, setForce2D] = useState(false)

  // Evaluate hardware capability & user motion preferences
  const is3DCapable = canRun3DScene()
  const use2DMode = force2D || contextLost || !is3DCapable

  // Normalized nutrient items
  const nutrientsData = {
    n: {
      standardDoseKgHa: Number(nutrientBalance?.n?.standardDoseKgHa ?? nutrientBalance?.n?.cropDemandKgHa ?? 120),
      soilAdjustmentKgHa: Number(nutrientBalance?.n?.soilAdjustmentKgHa ?? nutrientBalance?.n?.soilSupplyKgHa ?? 50),
      priorCreditKgHa: Number(nutrientBalance?.n?.priorCreditKgHa ?? 0),
      fertilizerNeededKgHa: Number(nutrientBalance?.n?.fertilizerNeededKgHa ?? 130),
      soilRating: nutrientBalance?.n?.soilRating || 'low',
      method: nutrientBalance?.n?.methodUsed || 'STCR Deficit Model',
    },
    p: {
      standardDoseKgHa: Number(nutrientBalance?.p?.standardDoseKgHa ?? nutrientBalance?.p?.cropDemandKgHa ?? 60),
      soilAdjustmentKgHa: Number(nutrientBalance?.p?.soilAdjustmentKgHa ?? nutrientBalance?.p?.soilSupplyKgHa ?? 20),
      priorCreditKgHa: Number(nutrientBalance?.p?.priorCreditKgHa ?? 0),
      fertilizerNeededKgHa: Number(nutrientBalance?.p?.fertilizerNeededKgHa ?? 80),
      soilRating: nutrientBalance?.p?.soilRating || 'low',
      method: nutrientBalance?.p?.methodUsed || 'STCR Deficit Model',
    },
    k: {
      standardDoseKgHa: Number(nutrientBalance?.k?.standardDoseKgHa ?? nutrientBalance?.k?.cropDemandKgHa ?? 40),
      soilAdjustmentKgHa: Number(nutrientBalance?.k?.soilAdjustmentKgHa ?? nutrientBalance?.k?.soilSupplyKgHa ?? 25),
      priorCreditKgHa: Number(nutrientBalance?.k?.priorCreditKgHa ?? 0),
      fertilizerNeededKgHa: Number(nutrientBalance?.k?.fertilizerNeededKgHa ?? 30),
      soilRating: nutrientBalance?.k?.soilRating || 'medium',
      method: nutrientBalance?.k?.methodUsed || 'STCR Deficit Model',
    },
  }

  // Keyboard navigation listener (allows scene operation without mouse)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid intercepting input if typing in form fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return

      if (e.key === '1') {
        setSelectedNutrient('n')
      } else if (e.key === '2') {
        setSelectedNutrient('p')
      } else if (e.key === '3') {
        setSelectedNutrient('k')
      } else if (e.key === ' ' || e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        setIsExpanded((prev) => !prev)
      } else if (e.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleWebGLContextLost = useCallback(() => {
    setContextLost(true)
  }, [])

  const activeNutrientObj = nutrientsData[selectedNutrient] || nutrientsData.n
  const activeLabel =
    selectedNutrient === 'n' ? 'Nitrogen (N)' : selectedNutrient === 'p' ? 'Phosphorus (P)' : 'Potassium (K)'

  return (
    <div className="bg-bg-surface border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* 1. Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
              <Layers className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-ink-primary">
              Interactive Nutrient Balance Strata
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/80 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
              Concept 1 • Soil Core Columns
            </span>
          </div>
          <p className="text-xs text-ink-secondary">
            Visualizing the story of gross demand, native soil reserve, prior credit, and net fertilizer to apply.
          </p>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Explode / Compact Strata Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isExpanded
                ? 'bg-primary-700 text-white border-primary-700 shadow-xs'
                : 'bg-bg-subtle hover:bg-bg-surface text-ink-primary border-border-default'
            }`}
            title="Press Space or E to toggle exploded layers"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isExpanded ? 'Compact Strata' : 'Explode Layers'}</span>
            <kbd className="hidden md:inline px-1 py-0.2 rounded bg-black/20 text-[10px] font-mono">
              Space
            </kbd>
          </button>

          {/* 3D / 2D View Switcher */}
          {is3DCapable && !contextLost && (
            <button
              type="button"
              onClick={() => setForce2D((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-bg-subtle hover:bg-bg-surface text-ink-secondary border border-border-default transition-colors"
              title="Toggle between 3D Core View and 2D Planar Diagram"
            >
              {use2DMode ? <Box className="w-3.5 h-3.5 text-primary-600" /> : <BarChart2 className="w-3.5 h-3.5" />}
              <span>{use2DMode ? 'Switch to 3D' : 'Switch to 2D'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Fallback Notice if WebGL is unavailable or lost */}
      {(!is3DCapable || contextLost) && (
        <div
          role="note"
          className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              {contextLost
                ? 'WebGL context was lost or reset by the browser. Displaying high-precision 2D fallback.'
                : 'Rendering 2D nutrient balance view optimized for your device and motion preferences.'}
            </span>
          </div>
          {contextLost && (
            <button
              type="button"
              onClick={() => setContextLost(false)}
              className="text-xs font-bold underline hover:no-underline flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> Retry 3D
            </button>
          )}
        </div>
      )}

      {/* 2. Visual Viewport: 3D Scene or 2D Accessible Fallback */}
      <div>
        {use2DMode ? (
          <NutrientStrata2DFallback
            nutrientBalance={nutrientsData}
            selectedNutrient={selectedNutrient}
            onSelectNutrient={setSelectedNutrient}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded((prev) => !prev)}
          />
        ) : (
          <Suspense fallback={<NutrientStrataSkeleton />}>
            <NutrientStrataScene
              nutrientBalance={nutrientsData}
              selectedNutrient={selectedNutrient}
              onSelectNutrient={setSelectedNutrient}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded((prev) => !prev)}
              onWebGLContextLost={handleWebGLContextLost}
            />
          </Suspense>
        )}
      </div>

      {/* 3. Keyboard & Touch Interactive Nutrient Selector Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border-default text-xs">
        <div className="flex items-center gap-2">
          <span className="text-ink-muted font-medium">Select Nutrient:</span>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Nutrient core selector">
            {[
              { key: 'n', label: 'Nitrogen', num: '1', symbol: 'N', color: 'bg-emerald-500' },
              { key: 'p', label: 'Phosphorus', num: '2', symbol: 'P', color: 'bg-amber-500' },
              { key: 'k', label: 'Potassium', num: '3', symbol: 'K', color: 'bg-indigo-500' },
            ].map((nut) => {
              const isActive = selectedNutrient === nut.key
              return (
                <button
                  key={nut.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedNutrient(nut.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs border ${
                    isActive
                      ? 'bg-bg-surface text-ink-primary border-primary-500 ring-2 ring-primary-500/20 shadow-xs'
                      : 'bg-bg-subtle text-ink-secondary border-border-default hover:bg-bg-surface'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${nut.color}`} />
                  <span>{nut.label}</span>
                  <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-border-default text-[10px] font-mono text-ink-muted">
                    {nut.num}
                  </kbd>
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend / Key indicators */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#5c3a21]" />
            <span>Soil Reserve</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#d97706]" />
            <span>Prior Credit</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span>Fertilizer Needed</span>
          </span>
        </div>
      </div>

      {/* 4. Active Selection Focus Card (Explains the story clearly to the farmer) */}
      <div className="p-4 rounded-xl bg-bg-subtle border border-border-default space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-ink-primary">
              {activeLabel} Working & Balance
            </span>
            <span
              className={`text-xs uppercase px-2 py-0.5 rounded-full font-bold ${
                activeNutrientObj.soilRating === 'low'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : activeNutrientObj.soilRating === 'high'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              Soil Rating: {activeNutrientObj.soilRating}
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-primary-700 dark:text-primary-400">
            {activeNutrientObj.fertilizerNeededKgHa} kg/ha to apply
          </span>
        </div>

        <p className="text-xs text-ink-secondary leading-relaxed">
          Standard crop demand is <strong>{activeNutrientObj.standardDoseKgHa} kg/ha</strong>. Your soil test
          supplies <strong>{activeNutrientObj.soilAdjustmentKgHa} kg/ha</strong>
          {activeNutrientObj.priorCreditKgHa > 0
            ? `, and recent fertilizer applications provide a credit of ${activeNutrientObj.priorCreditKgHa} kg/ha.`
            : ', with 0 kg/ha prior credit.'}{' '}
          Accounting for soil response efficiency, the net fertilizer required is{' '}
          <strong className="text-ink-primary">{activeNutrientObj.fertilizerNeededKgHa} kg/ha</strong>.
        </p>

        {soilRatings && soilRatings[selectedNutrient] && (
          <div className="text-[11px] text-ink-muted flex flex-wrap items-center gap-3 pt-1 border-t border-border-default/60">
            <span>
              <strong>Regional Reference Cut-offs:</strong> Low &lt; {soilRatings[selectedNutrient].lowBelow}{' '}
              {soilRatings[selectedNutrient].unit} • High &gt; {soilRatings[selectedNutrient].highAbove}{' '}
              {soilRatings[selectedNutrient].unit}
            </span>
            {soilTest && soilTest[selectedNutrient] != null && (
              <span>
                • <strong>Current Soil Test:</strong> {soilTest[selectedNutrient]} kg/ha
              </span>
            )}
          </div>
        )}
      </div>

      {/* 5. Accessibility: Full Data Table under the scene (Screen-reader & Keyboard friendly) */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          Tabular Nutrient Data (Accessible Text & Screen-Reader Alternative)
        </h4>
        <div className="overflow-x-auto rounded-xl border border-border-default bg-bg-surface">
          <table
            className="w-full text-xs text-left border-collapse"
            aria-label="Field nutrient balance working values and fertilizer needed"
          >
            <thead>
              <tr className="bg-bg-subtle text-ink-secondary border-b border-border-default">
                <th scope="col" className="p-3 font-semibold">Nutrient</th>
                <th scope="col" className="p-3 font-semibold">Soil Rating</th>
                <th scope="col" className="p-3 font-semibold text-right">Gross Crop Demand</th>
                <th scope="col" className="p-3 font-semibold text-right">Native Soil Reserve</th>
                <th scope="col" className="p-3 font-semibold text-right">Prior Credit</th>
                <th scope="col" className="p-3 font-semibold text-right">Fertilizer Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default text-ink-primary">
              {[
                { key: 'n', name: 'Nitrogen (N)' },
                { key: 'p', name: 'Phosphorus (P)' },
                { key: 'k', name: 'Potassium (K)' },
              ].map((item) => {
                const nut = nutrientsData[item.key]
                const isRowSelected = selectedNutrient === item.key
                return (
                  <tr
                    key={item.key}
                    onClick={() => setSelectedNutrient(item.key)}
                    className={`cursor-pointer transition-colors ${
                      isRowSelected ? 'bg-primary-50/50 dark:bg-primary-950/30 font-semibold' : 'hover:bg-bg-subtle/50'
                    }`}
                  >
                    <td className="p-3 font-bold flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.key === 'n' ? 'bg-emerald-500' : item.key === 'p' ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                      />
                      {item.name}
                    </td>
                    <td className="p-3 capitalize">{nut.soilRating}</td>
                    <td className="p-3 text-right font-mono">{nut.standardDoseKgHa} kg/ha</td>
                    <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">
                      -{nut.soilAdjustmentKgHa} kg/ha
                    </td>
                    <td className="p-3 text-right font-mono text-ink-muted">
                      {nut.priorCreditKgHa > 0 ? `-${nut.priorCreditKgHa} kg/ha` : '0 kg/ha'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-primary-700 dark:text-primary-400">
                      {nut.fertilizerNeededKgHa} kg/ha
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
