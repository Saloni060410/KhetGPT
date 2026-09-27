import { useState, useEffect, useCallback, useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FlaskConical,
  Plus,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
  Scale,
  Leaf,
  Layers,
  HelpCircle,
} from 'lucide-react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import Badge from '../ui/Badge.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import * as endpoints from '../../services/endpoints.js'

// Standard Indian bag weights for farmer visual context
const BAG_WEIGHTS_KG = {
  urea: 45,
  dap: 50,
  mop: 50,
  npk_10_26_26: 50,
  ssp: 50,
}

function calculateBagText(fertilizerType, totalKgPerAcre, acres = 1) {
  const normType = fertilizerType?.toLowerCase() || ''
  let bagWeight = 50
  if (normType.includes('urea')) bagWeight = 45

  const totalKg = Number(totalKgPerAcre) * Number(acres)
  if (!totalKg || totalKg <= 0) return null

  const bags = totalKg / bagWeight
  const wholeBags = Math.floor(bags)
  const remainderKg = Math.round(totalKg % bagWeight)

  if (wholeBags === 0) return `${Math.round(totalKg)} kg loose`
  if (remainderKg === 0) return `${wholeBags} bag${wholeBags > 1 ? 's' : ''} (${bagWeight}kg)`
  return `${wholeBags} bag${wholeBags > 1 ? 's' : ''} + ${remainderKg} kg`
}

export default function PlanRiskChecker({ fieldId, onBackToRecommended, fieldArea = 2.5, cropType = 'Wheat' }) {
  const navigate = useNavigate()
  const componentId = useId()

  // Product choices from GET /reference/fertilizers
  const [fertilizerOptions, setFertilizerOptions] = useState([
    { id: 'urea', name: 'Urea (46% N)' },
    { id: 'dap', name: 'Di-Ammonium Phosphate (DAP 18:46:0)' },
    { id: 'mop', name: 'Muriate of Potash (MOP 0:0:60)' },
    { id: 'npk_10_26_26', name: 'NPK 10:26:26' },
    { id: 'ssp', name: 'Single Super Phosphate (SSP 16% P)' },
  ])

  // Custom user application rows: [{ id, fertilizerType, quantityKgPerAcre }]
  const [plannedRows, setPlannedRows] = useState([
    { id: 'row-1', fertilizerType: 'urea', quantityKgPerAcre: 90 },
    { id: 'row-2', fertilizerType: 'dap', quantityKgPerAcre: 50 },
  ])

  // Debounced planned rows for live reactive check
  const debouncedPlannedRows = useDebounce(plannedRows, 450)

  // API evaluation states
  const [riskResult, setRiskResult] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Fetch reference fertilizers on mount
  useEffect(() => {
    endpoints
      .getReferenceFertilizers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFertilizerOptions(data)
        }
      })
      .catch(() => {
        // Fallback to initial defaults
      })
  }, [])

  // Call POST /fields/:id/risk-check
  const executeRiskCheck = useCallback(async (rowsToCheck) => {
    const validRows = rowsToCheck
      .filter((r) => r.fertilizerType && Number(r.quantityKgPerAcre) > 0)
      .map((r) => ({
        fertilizerType: r.fertilizerType,
        quantityKgPerAcre: Number(r.quantityKgPerAcre),
      }))

    if (validRows.length === 0) {
      setRiskResult(null)
      setApiError(null)
      return
    }

    setIsChecking(true)
    setApiError(null)

    try {
      const response = await endpoints.checkRisk(fieldId, {
        plannedApplication: validRows,
      })
      setRiskResult(response)
    } catch (err) {
      const status = err.response?.status || err.status || 500
      const message =
        err.response?.data?.error ||
        err.message ||
        'Unable to complete nutrient risk check.'
      setApiError({ status, message })
      setRiskResult(null)
    } finally {
      setIsChecking(false)
    }
  }, [fieldId])

  // Debounce reactive trigger
  useEffect(() => {
    executeRiskCheck(debouncedPlannedRows)
  }, [debouncedPlannedRows, executeRiskCheck])

  // Handlers for modifying planned rows
  const handleAddRow = () => {
    const unusedType =
      fertilizerOptions.find((opt) => !plannedRows.some((r) => r.fertilizerType === opt.id))?.id ||
      'urea'
    setPlannedRows((prev) => [
      ...prev,
      { id: `row-${Date.now()}`, fertilizerType: unusedType, quantityKgPerAcre: 20 },
    ])
  }

  const handleRemoveRow = (rowId) => {
    setPlannedRows((prev) => {
      const filtered = prev.filter((r) => r.id !== rowId)
      return filtered.length > 0 ? filtered : [{ id: `row-${Date.now()}`, fertilizerType: 'urea', quantityKgPerAcre: 0 }]
    })
  }

  const handleUpdateRow = (rowId, fieldName, value) => {
    setPlannedRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [fieldName]: value } : r)),
    )
  }

  // Risk styling helper: accessible with text tags and semantic icons (never color alone)
  const riskInfo = (() => {
    const level = riskResult?.risk?.level || 'low'
    if (level === 'high') {
      return {
        tag: '[HIGH RISK: OVER-APPLICATION]',
        badgeVariant: 'danger',
        icon: AlertOctagon,
        titleColor: 'text-red-700 dark:text-red-400',
        boxClass: 'border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30',
        summary: 'Severe risk of nutrient runoff, root burn, and excessive vegetative lodging.',
      }
    } else if (level === 'medium') {
      return {
        tag: '[MODERATE RISK: NUTRIENT IMBALANCE]',
        badgeVariant: 'warning',
        icon: AlertTriangle,
        titleColor: 'text-amber-700 dark:text-amber-400',
        boxClass: 'border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30',
        summary: 'Application variance detected. Adjust dosage to protect soil fertility balance.',
      }
    }
    return {
      tag: '[BALANCED: SAFE DOSAGE]',
      badgeVariant: 'success',
      icon: ShieldCheck,
      titleColor: 'text-emerald-700 dark:text-emerald-400',
      boxClass: 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30',
      summary: 'Planned application aligns with crop uptake capacity and native soil reserves.',
    }
  })()

  const RiskIcon = riskInfo.icon

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="p-4 sm:p-5 rounded-2xl border border-primary-500/30 bg-primary-50/30 dark:bg-primary-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-black text-ink-primary tracking-tight">
              Check My Own Fertilizer Plan (FR12)
            </h2>
            <Badge variant="subtle" size="sm">
              Live Simulator
            </Badge>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed max-w-xl">
            Test your customary or intended fertilizer doses for <strong>{cropType}</strong> ({fieldArea} acres). KhetGPT evaluates nutrient ratios and flags toxic buildup, leaching, and yield impact in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBackToRecommended}
            leftIcon={ArrowRight}
            className="text-xs"
          >
            Back to Recommended Plan
          </Button>
        </div>
      </div>

      {/* Ephemeral Warning: No Changes Saved */}
      <div className="p-2.5 rounded-xl bg-bg-subtle border border-border-default flex items-center justify-between gap-2 text-xs text-ink-muted">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-primary-600 shrink-0" />
          <span>
            <strong>Safety Sandbox:</strong> Inputs in this simulator are evaluated on-the-fly and never saved or applied to your permanent farm record.
          </span>
        </div>
        {isChecking && (
          <span className="font-mono text-primary-700 dark:text-primary-300 animate-pulse font-bold">
            Evaluating...
          </span>
        )}
      </div>

      {/* 409 Case: Prerequisite Missing (No Soil Test or Crop) */}
      {apiError && apiError.status === 409 && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                [HTTP 409] Missing Soil Test Prerequisite
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {apiError.message ||
                  'Field has no soil test recorded yet. Lab soil test data is required to calculate crop uptake capacity and assess application risk.'}
              </p>
            </div>
          </div>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link to={`/fields/${fieldId}/soil`}>
              <Button variant="primary" size="sm">
                Record Soil Test Lab Report →
              </Button>
            </Link>
            <Link to={`/fields/${fieldId}`}>
              <Button variant="outline" size="sm">
                Back to Field Profile
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Generic Error */}
      {apiError && apiError.status !== 409 && (
        <div className="p-4 rounded-xl bg-risk-high-bg border border-risk-high-border text-sm text-risk-high-text flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <span>{apiError.message}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => executeRiskCheck(plannedRows)}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Retry Check
          </Button>
        </div>
      )}

      {/* Input Rows: Enter one or more products and quantities in kg/acre */}
      <div className="p-5 rounded-2xl border border-border-default bg-bg-surface space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-black text-ink-primary uppercase tracking-wider">
              Enter Intended Application ({plannedRows.length} Product{plannedRows.length > 1 ? 's' : ''})
            </h3>
          </div>
          <span className="text-[11px] text-ink-muted">
            Auto-evaluates as you type (debounced)
          </span>
        </div>

        <div className="space-y-3">
          {plannedRows.map((row, idx) => {
            const bagText = calculateBagText(row.fertilizerType, row.quantityKgPerAcre, fieldArea)
            return (
              <div
                key={row.id}
                className="p-3.5 rounded-xl border border-border-default bg-bg-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink-muted">
                  #{idx + 1}
                </div>

                {/* Product Select */}
                <div className="flex-1">
                  <label htmlFor={`${componentId}-prod-${row.id}`} className="sr-only">
                    Fertilizer Product
                  </label>
                  <select
                    id={`${componentId}-prod-${row.id}`}
                    value={row.fertilizerType}
                    onChange={(e) => handleUpdateRow(row.id, 'fertilizerType', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-bg-surface text-ink-primary text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {fertilizerOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name || opt.id.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Input in kg/acre */}
                <div className="w-full sm:w-48">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={row.quantityKgPerAcre}
                      onChange={(e) =>
                        handleUpdateRow(row.id, 'quantityKgPerAcre', e.target.value)
                      }
                      className="w-full px-3 py-2 pr-16 rounded-lg border border-border-default bg-bg-surface text-ink-primary text-sm font-black font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-bold text-ink-muted pointer-events-none">
                      kg / acre
                    </span>
                  </div>
                  {bagText && (
                    <div className="text-[10px] text-ink-muted font-mono mt-1">
                      Plot Total: {bagText}
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <div className="shrink-0 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    aria-label="Remove fertilizer product"
                    className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Product Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border-default">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            leftIcon={Plus}
            className="text-xs"
          >
            Add Another Fertilizer Product
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => executeRiskCheck(plannedRows)}
            disabled={isChecking}
            className="text-xs"
          >
            {isChecking ? 'Evaluating Risk...' : 'Evaluate Plan Risk'}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RISK EVALUATION RESULT (PRD FR12) */}
      {/* ========================================================================= */}
      {riskResult && (
        <div className="space-y-5 animate-in fade-in duration-fast">
          {/* 1. Risk Level, Reason, and Impact Sentences */}
          <div className={`p-5 rounded-2xl border-2 ${riskInfo.boxClass} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border-default/60 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RiskIcon className="w-5 h-5 shrink-0" />
                  <span className={`text-sm font-black tracking-wide ${riskInfo.titleColor}`}>
                    {riskInfo.tag}
                  </span>
                  {riskResult.risk?.overApplicationPct != null && (
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200">
                      +{riskResult.risk.overApplicationPct}% Exceeds Target
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-ink-primary leading-relaxed pt-1">
                  {riskResult.risk?.reason || riskInfo.summary}
                </p>
              </div>

              <div className="shrink-0 text-left sm:text-right">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onBackToRecommended}
                  className="shadow-xs text-xs"
                >
                  Use Recommended Plan Instead →
                </Button>
              </div>
            </div>

            {/* Two Mandatory Impact Sentences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Soil Health Impact */}
              <div className="p-3.5 rounded-xl border border-border-default/80 bg-bg-surface/80 space-y-1">
                <span className="font-extrabold text-ink-primary uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  What it does to Soil Health:
                </span>
                <p className="text-ink-secondary leading-relaxed">
                  {riskResult.risk?.soilHealthImpact ||
                    'Application within crop capacity preserves beneficial soil microorganisms and prevents salt accumulation.'}
                </p>
              </div>

              {/* Yield Impact */}
              <div className="p-3.5 rounded-xl border border-border-default/80 bg-bg-surface/80 space-y-1">
                <span className="font-extrabold text-ink-primary uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  What it does to Crop Yield:
                </span>
                <p className="text-ink-secondary leading-relaxed">
                  {riskResult.risk?.yieldImpact ||
                    'Targeted balanced nutrients foster robust tiller production, strong straw strength, and full grain development.'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Applied vs Recommended Per Nutrient (N, P, K) */}
          {riskResult.nutrientBalance && (
            <div className="p-5 sm:p-6 rounded-2xl border border-border-default bg-bg-surface space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary-600" />
                  <h3 className="text-sm font-black text-ink-primary uppercase tracking-wider">
                    Nutrient Balance: Applied vs. Recommended (kg/ha)
                  </h3>
                </div>
                <span className="text-[11px] text-ink-muted">
                  100% represents optimal agronomist target
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nitrogen Card */}
                {(() => {
                  const n = riskResult.nutrientBalance.n || { appliedKgHa: 0, recommendedKgHa: 120, ratio: 1 }
                  const pct = Math.round((n.ratio || 0) * 100)
                  const isHigh = pct > 120
                  const isLow = pct < 80
                  return (
                    <div className="p-4 rounded-xl border border-border-default bg-bg-subtle/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ink-primary">Nitrogen (N)</span>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-full ${
                            isHigh
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isHigh ? 'TOO HIGH' : isLow ? 'TOO LOW' : 'BALANCED'} ({pct}%)
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-secondary">Planned Applied:</span>
                          <strong className="text-ink-primary">{n.appliedKgHa} kg/ha</strong>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-secondary">Recommended Target:</span>
                          <strong className="text-primary-700 dark:text-primary-300">{n.recommendedKgHa} kg/ha</strong>
                        </div>
                      </div>

                      {/* Progress Bar with 100% Marker */}
                      <div className="relative pt-1">
                        <div className="w-full bg-border-default h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isHigh ? 'bg-red-600' : isLow ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(pct, 150)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-ink-muted block text-right mt-1 font-mono">
                          Ratio: {n.ratio}x
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* Phosphorus Card */}
                {(() => {
                  const p = riskResult.nutrientBalance.p || { appliedKgHa: 0, recommendedKgHa: 60, ratio: 1 }
                  const pct = Math.round((p.ratio || 0) * 100)
                  const isHigh = pct > 120
                  const isLow = pct < 80
                  return (
                    <div className="p-4 rounded-xl border border-border-default bg-bg-subtle/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ink-primary">Phosphorus (P₂O₅)</span>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-full ${
                            isHigh
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isHigh ? 'TOO HIGH' : isLow ? 'TOO LOW' : 'BALANCED'} ({pct}%)
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-secondary">Planned Applied:</span>
                          <strong className="text-ink-primary">{p.appliedKgHa} kg/ha</strong>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-secondary">Recommended Target:</span>
                          <strong className="text-primary-700 dark:text-primary-300">{p.recommendedKgHa} kg/ha</strong>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative pt-1">
                        <div className="w-full bg-border-default h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isHigh ? 'bg-red-600' : isLow ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(pct, 150)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-ink-muted block text-right mt-1 font-mono">
                          Ratio: {p.ratio}x
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* Potassium Card */}
                {(() => {
                  const k = riskResult.nutrientBalance.k || { appliedKgHa: 0, recommendedKgHa: 40, ratio: 1 }
                  const pct = Math.round((k.ratio || 0) * 100)
                  const isHigh = pct > 120
                  const isLow = pct < 80
                  return (
                    <div className="p-4 rounded-xl border border-border-default bg-bg-subtle/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ink-primary">Potassium (K₂O)</span>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-full ${
                            isHigh
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isHigh ? 'TOO HIGH' : isLow ? 'TOO LOW' : 'BALANCED'} ({pct}%)
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-secondary">Planned Applied:</span>
                          <strong className="text-ink-primary">{k.appliedKgHa} kg/ha</strong>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-secondary">Recommended Target:</span>
                          <strong className="text-primary-700 dark:text-primary-300">{k.recommendedKgHa} kg/ha</strong>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative pt-1">
                        <div className="w-full bg-border-default h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isHigh ? 'bg-red-600' : isLow ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(pct, 150)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-ink-muted block text-right mt-1 font-mono">
                          Ratio: {k.ratio}x
                        </span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Route from result back to recommended plan */}
              <div className="pt-4 border-t border-border-default flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-ink-secondary">
                  Ready to adopt the optimal agronomic recommendation?
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={onBackToRecommended}
                  rightIcon={ArrowRight}
                >
                  Return to Recommended Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
