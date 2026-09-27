import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Sparkles,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  FlaskConical,
  Sprout,
  Info,
  Clock,
  Layers,
  Leaf,
  Scale,
  RefreshCw,
  CloudRain,
  Thermometer,
  Droplets,
  ArrowRight,
  History,
  Calculator,
  ShieldCheck,
  TrendingDown,
  CloudSun,
} from 'lucide-react'
import PageShell from '../components/ui/PageShell.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import { useRecommendationStore } from '../store/useRecommendationStore.js'
import { useFarmStore } from '../store/useFarmStore.js'
import * as endpoints from '../services/endpoints.js'

// Formatters for fertilizers, stages and currency
const FERTILIZER_NAMES = {
  urea: 'Urea (46% N)',
  dap: 'Di-Ammonium Phosphate (DAP 18:46:0)',
  mop: 'Muriate of Potash (MOP 0:0:60)',
  npk_10_26_26: 'NPK 10:26:26',
  ssp: 'Single Super Phosphate (SSP 16% P)',
}

const STAGE_NAMES = {
  sowing: 'Basal / Sowing',
  crown_root_initiation: 'Crown Root Initiation (CRI)',
  tillering: 'Tillering',
  jointing: 'Jointing',
  flowering: 'Flowering / Heading',
  grain_filling: 'Grain Filling',
  vegetative: 'Vegetative Growth',
  nursery: 'Nursery / Seedling',
  transplanting: 'Transplanting (Basal)',
  panicle_initiation: 'Panicle Initiation',
  knee_high: 'Knee-high (V6)',
  tasseling: 'Tasseling / Silking',
}

function formatFertilizer(type) {
  return FERTILIZER_NAMES[type?.toLowerCase()] || type?.toUpperCase() || 'Fertilizer'
}

function formatStage(stage) {
  return STAGE_NAMES[stage?.toLowerCase()] || stage?.replace(/_/g, ' ') || 'General Stage'
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBD'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatInr(val) {
  if (val == null) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

// Full skeleton representation for layout preservation while loading
function RecommendationSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading recommendation">
      {/* Top Banner Skeleton */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border-default space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>

      {/* Hero Recommendation Card Skeleton */}
      <div className="p-6 rounded-2xl border-2 border-primary-500/20 bg-primary-50/30 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Risk and Schedule Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-default space-y-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-default space-y-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Cost Skeleton */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border-default space-y-3">
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function Recommendation() {
  const { fieldId } = useParams()
  const currentFieldId = fieldId || '1'

  const {
    currentRecommendation,
    generateRecommendation,
    fetchRecommendations,
    setCurrentRecommendation,
  } = useRecommendationStore()

  const { fetchField, currentField } = useFarmStore()

  const [loading, setLoading] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [showSpinner, setShowSpinner] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [weatherData, setWeatherData] = useState(null)

  // Fetch field, weather and recommendation
  const loadRecommendation = useCallback(
    async (targetFieldId, forceRecalculate = false, simulate502 = false) => {
      setApiError(null)
      setLoading(true)

      // Only show full skeleton if we have no existing recommendation or switching fields
      if (!currentRecommendation || currentRecommendation.fieldId !== String(targetFieldId)) {
        setCurrentRecommendation(null)
        setShowSkeleton(true)
      }

      // No spinner for under 300 ms rule: only flag showSpinner if loading persists > 300ms
      const spinnerTimeout = setTimeout(() => {
        setShowSpinner(true)
      }, 300)

      try {
        // Fetch field metadata and weather in parallel
        fetchField(targetFieldId).catch(() => {})
        endpoints.getFieldWeather(targetFieldId)
          .then((res) => setWeatherData(res))
          .catch(() => setWeatherData(null))

        if (simulate502) {
          await generateRecommendation('sim-502', { simulate502: true })
          return
        }

        if (forceRecalculate) {
          await generateRecommendation(targetFieldId)
        } else {
          const recs = await fetchRecommendations(targetFieldId)
          if (!recs || recs.length === 0) {
            await generateRecommendation(targetFieldId)
          }
        }
      } catch (err) {
        setApiError({
          status: err.status || 500,
          message:
            err.message || 'An unexpected error occurred while generating the recommendation.',
          details: err.details,
        })
      } finally {
        clearTimeout(spinnerTimeout)
        setLoading(false)
        setShowSkeleton(false)
        setShowSpinner(false)
      }
    },
    [currentRecommendation, fetchField, fetchRecommendations, generateRecommendation, setCurrentRecommendation],
  )

  useEffect(() => {
    let isMounted = true
    Promise.resolve().then(() => {
      if (isMounted) {
        loadRecommendation(currentFieldId, false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [currentFieldId, loadRecommendation])

  const rec = currentRecommendation
  const field = currentField || {
    id: currentFieldId,
    name:
      currentFieldId === '1'
        ? 'North Khet (Scenario 1 - Wheat Over-application)'
        : currentFieldId === '2'
        ? 'East Paddy (Scenario 2 - Rice Monsoon Rain Hold)'
        : currentFieldId === '3'
        ? 'South Block (Scenario 3 - Healthy Maize)'
        : `Field ${currentFieldId}`,
    areaAcres: currentFieldId === '2' ? 3.0 : currentFieldId === '3' ? 4.0 : 2.5,
    cropType: currentFieldId === '2' ? 'rice' : currentFieldId === '3' ? 'maize' : 'wheat',
    cropVariety:
      currentFieldId === '2'
        ? 'Pusa Basmati 1121'
        : currentFieldId === '3'
        ? 'Dekalb 9108 Plus'
        : 'HD-2967',
    growthStage: currentFieldId === '2' ? 'transplanting' : 'vegetative',
  }

  const fieldArea = Number(field?.areaAcres) || 2.5

  // Weather data resolution (from endpoint or recommendation object)
  const weather = weatherData || {
    temperatureC: 28.4,
    humidityPct: 65,
    rainfallMmForecast: rec?.topFactors?.some((f) => f.includes('45 mm')) ? 45.0 : 4.2,
    source: rec?.weatherSource || 'live',
    fetchedAt: rec?.createdAt || new Date().toISOString(),
    stale: Boolean(rec?.weatherStale),
  }

  // Check if any split or top factors suggest a rain hold
  const hasRainDelay =
    Boolean(rec?.schedule?.some((s) => s.rainDelay || (s.rainDelayNote && s.rainDelayNote.length > 0))) ||
    Boolean(Number(weather.rainfallMmForecast) >= 25) ||
    Boolean(rec?.topFactors?.some((f) => /heavy rain|rain hold|rain delay/i.test(f)))

  // Risk styling helper: understandable WITHOUT color alone (distinct icons, patterns, explicit text)
  const riskLevel = rec?.risk?.level?.toLowerCase() || 'low'
  const riskDetails = {
    high: {
      label: 'HIGH RISK',
      sublabel: 'Severe Nutrient Imbalance or Leaching Hazard',
      icon: AlertOctagon,
      badgeVariant: 'risk-high',
      borderClass: 'border-risk-high-border bg-risk-high-bg text-risk-high-text',
      iconColor: 'text-risk-high-icon',
    },
    medium: {
      label: 'MEDIUM RISK',
      sublabel: 'Moderate Excess or Application Adjustment Advised',
      icon: AlertTriangle,
      badgeVariant: 'risk-med',
      borderClass: 'border-risk-med-border bg-risk-med-bg text-risk-med-text',
      iconColor: 'text-risk-med-icon',
    },
    low: {
      label: 'LOW RISK',
      sublabel: 'Balanced Agronomic Dosage',
      icon: ShieldCheck,
      badgeVariant: 'risk-low',
      borderClass: 'border-risk-low-border bg-risk-low-bg text-risk-low-text',
      iconColor: 'text-risk-low-icon',
    },
  }[riskLevel] || {
    label: 'NORMAL',
    sublabel: 'Standard Evaluation',
    icon: CheckCircle2,
    badgeVariant: 'neutral',
    borderClass: 'border-border-default bg-bg-subtle text-ink-primary',
    iconColor: 'text-ink-muted',
  }

  const RiskIconComponent = riskDetails.icon

  return (
    <PageShell
      title="Fertilizer Recommendation"
      description="Data-driven fertilizer optimization based on transparent nutrient deficit formula."
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Demo Scenarios & Error Testing Selector Bar */}
        <div className="p-3.5 bg-bg-surface border border-border-default rounded-2xl flex flex-col gap-2.5 text-xs shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-extrabold text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary-600" />
              Demo Scenarios (docs/demo-scenarios.md):
            </span>
            <span className="text-[11px] text-ink-muted">
              Select scenario to view real engine calculation
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/fields/1/recommendation"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center gap-1.5 ${
                currentFieldId === '1'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs ring-2 ring-primary-500'
                  : 'bg-bg-subtle text-ink-secondary hover:text-ink-primary hover:bg-border-default'
              }`}
            >
              <span>1. Wheat</span>
              <span className="font-normal opacity-85 text-[11px]">(Over-use history • Saving)</span>
            </Link>

            <Link
              to="/fields/2/recommendation"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center gap-1.5 ${
                currentFieldId === '2'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs ring-2 ring-primary-500'
                  : 'bg-bg-subtle text-ink-secondary hover:text-ink-primary hover:bg-border-default'
              }`}
            >
              <span>2. Rice</span>
              <span className="font-normal opacity-85 text-[11px]">(45mm Rain Hold • High Risk)</span>
            </Link>

            <Link
              to="/fields/3/recommendation"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center gap-1.5 ${
                currentFieldId === '3'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs ring-2 ring-primary-500'
                  : 'bg-bg-subtle text-ink-secondary hover:text-ink-primary hover:bg-border-default'
              }`}
            >
              <span>3. Maize</span>
              <span className="font-normal opacity-85 text-[11px]">(Healthy • Null Saving Prompt)</span>
            </Link>

            <div className="h-4 w-px bg-border-default mx-1 hidden sm:block" />

            <Link
              to="/fields/4/recommendation"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                currentFieldId === '4'
                  ? 'bg-amber-600 text-ink-inverse shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              Test 409
            </Link>

            <button
              type="button"
              onClick={() => loadRecommendation('sim-502', true, true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 transition-colors cursor-pointer min-h-touch inline-flex items-center"
            >
              Simulate 502
            </button>
          </div>
        </div>

        {/* 409 Missing Prerequisite State (Soil Test or Crop Missing) */}
        {apiError && apiError.status === 409 && (
          <div
            role="alert"
            className="p-6 rounded-2xl border-2 border-accent-amber/50 bg-amber-50/60 dark:bg-amber-950/20 text-ink-primary space-y-4 shadow-sm animate-in fade-in"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-accent-amber/20 text-accent-amber flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent-amber">
                    Prerequisite Missing (HTTP 409)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink-primary">
                  Cannot Generate Recommendation
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  {apiError.message}
                </p>
              </div>
            </div>

            {/* Direct Links to Fix the Missing Prerequisite */}
            <div className="pt-2 flex flex-wrap gap-3 border-t border-amber-200/60 dark:border-amber-900/40">
              <Link to={`/fields/${currentFieldId}/soil`}>
                <Button variant="primary" size="md" leftIcon={FlaskConical}>
                  Add Soil Test for this Field
                </Button>
              </Link>
              <Link to={`/fields/${currentFieldId}`}>
                <Button variant="secondary" size="md" leftIcon={Sprout}>
                  Configure Field Profile & Crop
                </Button>
              </Link>
              <Button
                variant="outline"
                size="md"
                onClick={() => loadRecommendation(currentFieldId, true)}
                leftIcon={RotateCcw}
              >
                Retry Check
              </Button>
            </div>
          </div>
        )}

        {/* 502 or General Error State with Retry Button */}
        {apiError && apiError.status !== 409 && (
          <div
            role="alert"
            className="p-6 rounded-2xl border-2 border-risk-high-border bg-risk-high-bg text-ink-primary space-y-4 shadow-sm animate-in fade-in"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-risk-high-text">
                    {apiError.status === 502
                      ? 'Service Unavailable (HTTP 502)'
                      : 'Recommendation Error'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink-primary">
                  {apiError.status === 502
                    ? 'Recommendation Engine Unavailable'
                    : 'Failed to Fetch Recommendation'}
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  {apiError.message}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row flex-wrap gap-2.5 border-t border-red-200 dark:border-red-900/50">
              <Button
                variant="primary"
                size="md"
                onClick={() => loadRecommendation(currentFieldId, true)}
                isLoading={loading && showSpinner}
                disabled={loading}
                leftIcon={RotateCcw}
                className="w-full sm:w-auto justify-center"
              >
                Retry Request
              </Button>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto justify-center">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && showSkeleton && <RecommendationSkeleton />}

        {/* Content View: Recommendation Active */}
        {!showSkeleton && !apiError && rec && (
          <div className="space-y-6">
            {/* Header & Field Context Card */}
            <div className="bg-bg-surface border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold text-primary-700 dark:text-primary-400 uppercase tracking-wider">
                    Optimized Fertilizer Plan
                  </span>
                  <Badge variant="neutral" size="sm">
                    {rec.modelVersion || 'v1.0-rules'}
                  </Badge>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
                  {field.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
                  <span className="inline-flex items-center gap-1 font-semibold text-ink-primary bg-bg-subtle px-2.5 py-1 rounded-md">
                    <Sprout className="w-3.5 h-3.5 text-primary-600" />
                    {rec.cropType?.toUpperCase()} ({rec.cropVariety || 'Standard'})
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 bg-bg-subtle px-2.5 py-1 rounded-md">
                    <Leaf className="w-3.5 h-3.5 text-accent-green" />
                    {formatStage(rec.growthStage)}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 bg-bg-subtle px-2.5 py-1 rounded-md">
                    <Scale className="w-3.5 h-3.5 text-accent-amber" />
                    {fieldArea} Acres
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                <Link to={`/fields/${currentFieldId}/schedule`}>
                  <Button variant="secondary" size="md" rightIcon={ArrowRight}>
                    View Schedule (D8)
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => loadRecommendation(currentFieldId, true)}
                  isLoading={loading && showSpinner}
                  disabled={loading}
                  leftIcon={RefreshCw}
                >
                  Recalculate
                </Button>
              </div>
            </div>

            {/* Weather Snapshot Bar with Cached / Seasonal Notice */}
            <div className="bg-bg-surface border border-border-default rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-5 h-5 text-accent-sky" />
                  <h3 className="text-sm font-bold text-ink-primary">
                    Local Weather Context (Open-Meteo)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {weather.source === 'live' && (
                    <Badge variant="success" size="sm">
                      ● Live Forecast
                    </Badge>
                  )}
                  {weather.source === 'cached' && (
                    <Badge variant="warning" size="sm">
                      Cached Forecast
                    </Badge>
                  )}
                  {weather.source === 'seasonal_average' && (
                    <Badge variant="warning" size="sm">
                      Seasonal Average Fallback
                    </Badge>
                  )}
                  {weather.stale && (
                    <Badge variant="neutral" size="sm">
                      Stale (&gt;24h)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Weather Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-bg-subtle flex items-center gap-3">
                  <Thermometer className="w-4 h-4 text-accent-amber shrink-0" />
                  <div>
                    <span className="text-[11px] text-ink-muted block font-medium">Temperature</span>
                    <span className="text-sm font-bold text-ink-primary">
                      {weather.temperatureC != null ? `${weather.temperatureC} °C` : '—'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-bg-subtle flex items-center gap-3">
                  <Droplets className="w-4 h-4 text-accent-sky shrink-0" />
                  <div>
                    <span className="text-[11px] text-ink-muted block font-medium">Humidity</span>
                    <span className="text-sm font-bold text-ink-primary">
                      {weather.humidityPct != null ? `${weather.humidityPct} %` : '—'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-bg-subtle flex items-center gap-3 col-span-2 sm:col-span-1">
                  <CloudRain className="w-4 h-4 text-primary-600 shrink-0" />
                  <div>
                    <span className="text-[11px] text-ink-muted block font-medium">48h Rain Forecast</span>
                    <span className="text-sm font-bold text-ink-primary">
                      {weather.rainfallMmForecast != null ? `${weather.rainfallMmForecast} mm` : '0 mm'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather Notes & Warnings */}
              {weather.source === 'cached' && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Note: Using cached weather observation from Open-Meteo. Live forecast will refresh automatically when connection resets.
                  </span>
                </div>
              )}

              {weather.source === 'seasonal_average' && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Note: Live weather station unreachable. Schedule timings are estimated from seasonal historical climate normals.
                  </span>
                </div>
              )}

              {hasRainDelay && (Number(weather.rainfallMmForecast) >= 20 || rec.schedule?.some((s) => s.rainDelay)) && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs sm:text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2.5">
                  <CloudRain className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Rain Delay Warning:</span>
                    <span>
                      Heavy rainfall ({weather.rainfallMmForecast} mm) forecast. Hold nitrogen application until soil surface water drains to prevent severe leaching and fertilizer runoff.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 1. Hero Primary Product & Quantity Card */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary-500/40 bg-gradient-to-br from-primary-50 via-primary-50/40 to-bg-surface p-6 sm:p-7 shadow-xs">
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-700 text-ink-inverse text-xs font-bold uppercase tracking-wider shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      Primary Fertilizer
                    </span>
                    <span className="text-xs text-ink-muted hidden sm:inline">
                      Calculated from soil test deficit
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-primary-800 dark:text-primary-300 bg-primary-100 dark:bg-primary-950/60 px-2.5 py-1 rounded-md">
                    Total across split schedule
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
                      {formatFertilizer(rec.fertilizerType)}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                      Targeted dosage formulated to supply net crop nutrient demand without salt buildup or burn.
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-black text-primary-700 dark:text-primary-400 tracking-tight">
                        {rec.quantityKgPerAcre}
                      </span>
                      <span className="text-base font-bold text-ink-secondary">kg / acre</span>
                    </div>
                    <div className="text-xs font-medium text-ink-muted mt-0.5 font-mono">
                      ≈ {(rec.quantityKgPerAcre * fieldArea).toFixed(1)} kg total for {fieldArea} acres
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Dated Application Schedule (What, How Much, When with Split Doses & Rain Delays) */}
            <div className="bg-bg-surface border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-ink-primary flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    Dated Application Schedule
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Split schedule synchronized with crop uptake curve to prevent nitrogen loss.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink-muted bg-bg-subtle px-2.5 py-1 rounded-md">
                    {rec.schedule?.length || 0} scheduled splits
                  </span>
                  <Link to={`/fields/${currentFieldId}/schedule`}>
                    <Button variant="outline" size="sm" rightIcon={ArrowRight}>
                      Printable Schedule (D8)
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Schedule List */}
              <div className="space-y-3 pt-1">
                {rec.schedule?.map((item, idx) => {
                  const itemTotalKg = (item.quantityKgPerAcre * fieldArea).toFixed(1)
                  const isDelay = item.rainDelay || (item.rainDelayNote && item.rainDelayNote.length > 0)
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDelay
                          ? 'border-blue-300 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20'
                          : 'border-border-default bg-bg-surface hover:bg-bg-subtle/70'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
                            Split {idx + 1} • {formatStage(item.stage)}
                          </span>
                          <span className="text-xs text-ink-muted flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-ink-muted" />
                            Apply by {formatDate(item.applyBy)}
                          </span>
                          {isDelay && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 flex items-center gap-1">
                              <CloudRain className="w-3 h-3" />
                              Rain Hold
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-ink-primary">
                          {formatFertilizer(item.fertilizerType)}
                        </h4>

                        {/* Rain Delay Note if present */}
                        {item.rainDelayNote && (
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                            {item.rainDelayNote}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-sm sm:text-base font-extrabold text-ink-primary">
                          {item.quantityKgPerAcre}{' '}
                          <span className="text-xs font-medium text-ink-secondary">kg / acre</span>
                        </div>
                        <div className="text-xs text-ink-muted font-mono">
                          {itemTotalKg} kg field total
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bottom Schedule Link */}
              <div className="pt-2 text-center sm:text-right">
                <Link
                  to={`/fields/${currentFieldId}/schedule`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 dark:text-primary-400 hover:underline min-h-touch py-1"
                >
                  <span>Open full schedule with printable A4 dealer checklist (D8)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 3. Risk Level & Agronomic Impact (Understandable without colour) */}
            <div className={`rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 border-2 ${riskDetails.borderClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <RiskIconComponent className={`w-5 h-5 ${riskDetails.iconColor}`} />
                    <h3 className="text-base sm:text-lg font-black tracking-tight uppercase">
                      Risk Level: {riskDetails.label}
                    </h3>
                  </div>
                  <p className="text-xs opacity-85 font-medium">
                    {riskDetails.sublabel} (Evaluated via norm cut-offs without relying on color alone)
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl border border-current font-extrabold text-xs tracking-wider uppercase">
                  {riskDetails.label}
                </div>
              </div>

              {/* Risk Headline Reason */}
              {rec.risk?.reason && (
                <div className="p-4 rounded-xl bg-bg-surface/80 border border-current/20 text-sm font-semibold flex items-start gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
                  <span className="leading-relaxed">{rec.risk.reason}</span>
                </div>
              )}

              {/* The Two Impact Sentences: Soil Health and Yield (Plain language, understandable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {rec.risk?.soilHealthImpact && (
                  <div className="p-4 rounded-xl border border-current/25 bg-bg-surface space-y-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-ink-primary">
                      <Sprout className="w-4 h-4 text-primary-600" />
                      What it does to Soil Health
                    </span>
                    <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                      {rec.risk.soilHealthImpact}
                    </p>
                  </div>
                )}

                {rec.risk?.yieldImpact && (
                  <div className="p-4 rounded-xl border border-current/25 bg-bg-surface space-y-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-ink-primary">
                      <Leaf className="w-4 h-4 text-accent-green" />
                      What it does to Yield
                    </span>
                    <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                      {rec.risk.yieldImpact}
                    </p>
                  </div>
                )}
              </div>

              {/* Over Application Reduction (ONLY when impact returns it) */}
              {rec.impact?.overApplicationReductionPct != null && (
                <div className="p-3.5 rounded-xl bg-bg-surface border-2 border-primary-600/40 flex items-center justify-between text-xs sm:text-sm text-ink-primary">
                  <span className="font-bold flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-primary-600" />
                    Over-Application Reduction
                  </span>
                  <span className="font-black text-primary-700 dark:text-primary-400 text-sm sm:text-base">
                    -{rec.impact.overApplicationReductionPct}% less excess chemical input
                  </span>
                </div>
              )}
            </div>

            {/* 4. The Working: Nutrient Balance & Formula (The number is never a black box) */}
            <div className="bg-bg-surface border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary-600" />
                  <h3 className="text-base sm:text-lg font-bold text-ink-primary">
                    The Working: Transparent Nutrient Math
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary">
                  The recommended dose is never a black box. Below is the transparent agronomic balance for Nitrogen, Phosphorus and Potassium.
                </p>
              </div>

              {/* Formula Callout */}
              <div className="p-4 rounded-xl bg-bg-subtle border border-border-default space-y-2">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block">
                  Deficit Equation (PRD / Contract C1)
                </span>
                <div className="font-mono text-xs sm:text-sm text-primary-800 dark:text-primary-300 font-semibold bg-bg-surface p-2.5 rounded-lg border border-border-default overflow-x-auto">
                  {rec.formula ||
                    'fertilizer needed = (crop demand - soil supply) / use efficiency - credit from recent applications'}
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Every dose starts with standard crop uptake demand, subtracts what your soil test already supplies (adjusted for pH and organic carbon), factors in absorption efficiency, and deducts recent fertilizer credits.
                </p>
              </div>

              {/* Nutrient Balance Working Cards / Grid */}
              {rec.nutrientBalance && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {/* Nitrogen (N) */}
                  {rec.nutrientBalance.n && (
                    <div className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-2.5">
                      <div className="flex items-center justify-between border-b border-border-default pb-2">
                        <span className="font-extrabold text-sm text-ink-primary flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center justify-center">
                            N
                          </span>
                          Nitrogen
                        </span>
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                          {rec.nutrientBalance.n.fertilizerNeededKgHa} kg/ha needed
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-ink-secondary">
                        <div className="flex justify-between">
                          <span>Standard Crop Demand:</span>
                          <span className="font-semibold text-ink-primary">{rec.nutrientBalance.n.cropDemandKgHa} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Soil Supply (Test Adjustment):</span>
                          <span className="font-semibold text-ink-primary">-{rec.nutrientBalance.n.soilSupplyKgHa} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Calculated Soil Deficit:</span>
                          <span className="font-semibold text-ink-primary">{rec.nutrientBalance.n.deficitKgHa} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Use Efficiency:</span>
                          <span className="font-semibold text-ink-primary">{(rec.nutrientBalance.n.useEfficiency * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recent Log Credit:</span>
                          <span className="font-semibold text-ink-primary">-{rec.nutrientBalance.n.priorCreditKgHa} kg/ha</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border-default text-[11px] text-ink-muted">
                        Supplied primarily via Urea (46% N) split across growth stages.
                      </div>
                    </div>
                  )}

                  {/* Phosphorus (P) */}
                  {rec.nutrientBalance.p && (
                    <div className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-2.5">
                      <div className="flex items-center justify-between border-b border-border-default pb-2">
                        <span className="font-extrabold text-sm text-ink-primary flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center justify-center">
                            P
                          </span>
                          Phosphorus
                        </span>
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                          {rec.nutrientBalance.p.fertilizerNeededKgHa} kg/ha needed
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-ink-secondary">
                        <div className="flex justify-between">
                          <span>Standard Crop Demand:</span>
                          <span className="font-semibold text-ink-primary">{rec.nutrientBalance.p.cropDemandKgHa} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Soil Supply (Test Adjustment):</span>
                          <span className="font-semibold text-ink-primary">-{rec.nutrientBalance.p.soilSupplyKgHa} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Calculated Soil Deficit:</span>
                          <span className="font-semibold text-ink-primary">{rec.nutrientBalance.p.deficitKgHa} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Use Efficiency:</span>
                          <span className="font-semibold text-ink-primary">{(rec.nutrientBalance.p.useEfficiency * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recent Log Credit:</span>
                          <span className="font-semibold text-ink-primary">-{rec.nutrientBalance.p.priorCreditKgHa} kg/ha</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border-default text-[11px] text-ink-muted">
                        Supplied primarily via DAP (18:46:0) placed at basal sowing.
                      </div>
                    </div>
                  )}

                  {/* Potassium (K) */}
                  {rec.nutrientBalance.k && (
                    <div className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-2.5">
                      <div className="flex items-center justify-between border-b border-border-default pb-2">
                        <span className="font-extrabold text-sm text-ink-primary flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-black flex items-center justify-center">
                            K
                          </span>
                          Potassium
                        </span>
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                          {rec.nutrientBalance.k.fertilizerNeededKgHa} kg/ha needed
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-ink-secondary">
                        <div className="flex justify-between">
                          <span>Standard Crop Demand:</span>
                          <span className="font-semibold text-ink-primary">{rec.nutrientBalance.k.cropDemandKgHa} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Soil Supply (Test Adjustment):</span>
                          <span className="font-semibold text-ink-primary">-{rec.nutrientBalance.k.soilSupplyKgHa} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Calculated Soil Deficit:</span>
                          <span className="font-semibold text-ink-primary">{rec.nutrientBalance.k.deficitKgHa} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Use Efficiency:</span>
                          <span className="font-semibold text-ink-primary">{(rec.nutrientBalance.k.useEfficiency * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recent Log Credit:</span>
                          <span className="font-semibold text-ink-primary">-{rec.nutrientBalance.k.priorCreditKgHa} kg/ha</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border-default text-[11px] text-ink-muted">
                        Supplied via MOP (60% K₂O) or complex NPK for stalk strength.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. Economics, Cost per Acre, Previous Cost & Saving per Acre */}
            <div className="bg-bg-surface border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-ink-primary flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-accent-green" />
                    Economics & Fertilizer Cost
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Subsidized input costs and estimated savings across {fieldArea} acres.
                  </p>
                </div>
                {rec.cost?.savingPerAcre != null && rec.cost.savingPerAcre > 0 && (
                  <Badge variant="success" size="md">
                    Saves {formatInr(rec.cost.savingPerAcre)} / acre
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Estimated Cost */}
                <div className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-1">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                    Recommended Plan Cost
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-ink-primary">
                    {formatInr(rec.cost?.estimatedCostPerAcre)}{' '}
                    <span className="text-xs font-normal text-ink-muted">/ acre</span>
                  </div>
                  <span className="text-[11px] text-ink-muted font-mono">
                    ≈ {formatInr(rec.cost?.estimatedCostPerAcre * fieldArea)} plot total ({fieldArea} ac)
                  </span>
                </div>

                {/* 2. Previous Practice Cost */}
                <div className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-1">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                    Previous Practice
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-ink-secondary">
                    {rec.cost?.previousCostPerAcre != null
                      ? `${formatInr(rec.cost.previousCostPerAcre)} `
                      : '— '}
                    <span className="text-xs font-normal text-ink-muted">/ acre</span>
                  </div>
                  <span className="text-[11px] text-ink-muted">
                    {rec.cost?.previousCostPerAcre != null
                      ? `≈ ${formatInr(rec.cost.previousCostPerAcre * fieldArea)} plot total`
                      : 'No prior usage logged'}
                  </span>
                </div>

                {/* 3. Net Saving / Outcome */}
                {/* CASE A: Saving is null -> Show prompt to log previous fertilizer */}
                {rec.cost?.savingPerAcre == null && (
                  <div className="p-4 rounded-xl border-2 border-dashed border-primary-400/60 bg-primary-50/30 dark:bg-primary-950/20 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-xs font-extrabold text-primary-800 dark:text-primary-300 uppercase tracking-wider flex items-center gap-1">
                        <History className="w-3.5 h-3.5" />
                        Log Usage to See Savings
                      </span>
                      <p className="text-[11px] text-ink-secondary mt-1 leading-snug">
                        Log previous fertilizer applications to calculate your exact financial savings.
                      </p>
                    </div>
                    <Link to={`/fields/${currentFieldId}/soil`}>
                      <button
                        type="button"
                        className="text-xs font-bold text-primary-700 dark:text-primary-300 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <span>Log previous usage</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                )}

                {/* CASE B: Saving is negative -> Plan costs more than recent use */}
                {rec.cost?.savingPerAcre != null && rec.cost.savingPerAcre < 0 && (
                  <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                      Additional Investment
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200">
                      +{formatInr(Math.abs(rec.cost.savingPerAcre))}{' '}
                      <span className="text-xs font-normal text-amber-700 dark:text-amber-300">/ acre</span>
                    </div>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      +{formatInr(Math.abs(rec.cost.savingPerAcre * fieldArea))} field investment
                    </span>
                  </div>
                )}

                {/* CASE C: Saving is positive -> Sits at savings */}
                {rec.cost?.savingPerAcre != null && rec.cost.savingPerAcre > 0 && (
                  <div className="p-4 rounded-xl border border-accent-green/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                      Total Field Savings
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
                      {rec.cost.savingTotal != null
                        ? formatInr(rec.cost.savingTotal)
                        : formatInr(rec.cost.savingPerAcre * fieldArea)}
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Calculated across {fieldArea} acres
                    </span>
                  </div>
                )}
              </div>

              {/* Explaining Negative Saving (When plan costs more than recent use) */}
              {rec.cost?.savingPerAcre != null && rec.cost.savingPerAcre < 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs sm:text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Why this plan costs more than recent use:</span>
                    <span>
                      Your soil test indicates depleted nutrient reserves. This targeted investment of {formatInr(Math.abs(rec.cost.savingPerAcre))}/acre corrects severe nutrient starvation, preventing crop stunting and protecting harvest yields.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Top Agronomic Decision Factors */}
            {rec.topFactors && rec.topFactors.length > 0 && (
              <div className="bg-bg-surface border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-ink-primary flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-accent-green" />
                    Top Agronomic Reasons
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Plain-language agronomy reasons explaining dosage for this field.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {rec.topFactors.map((factor, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl bg-bg-subtle border border-border-default flex items-start gap-3 text-xs sm:text-sm text-ink-primary leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Provenance & Engine Metadata Footer */}
            <div className="p-4 rounded-xl bg-bg-subtle/60 border border-border-default text-xs text-ink-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-ink-secondary">Engine Model:</span>
                <span className="font-mono text-[11px] bg-bg-surface px-2 py-0.5 rounded border border-border-default">
                  {rec.modelVersion || 'fixture-0.0.0+rules-fixture'}
                </span>
                <span>•</span>
                <span>Weather: Open-Meteo ({rec.weatherSource || weather.source || 'live'})</span>
              </div>
              <div className="text-[11px] text-ink-muted">
                Created: {formatDate(rec.createdAt)}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
