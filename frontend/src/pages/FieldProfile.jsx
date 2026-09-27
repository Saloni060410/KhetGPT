import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Sprout,
  MapPin,
  Calendar,
  Layers,
  FlaskConical,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  AlertTriangle,
  RotateCcw,
  Edit,
  Clock,
  Droplets,
  Thermometer,
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import RiskBadge from '../components/ui/RiskBadge.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import Toast from '../components/ui/Toast.jsx'
import useDocumentTitle from '../hooks/useDocumentTitle.js'
import * as endpoints from '../services/endpoints.js'
import EditFieldModal from '../components/farms/EditFieldModal.jsx'
import { getNutrientRating, getPhRating, getOrganicCarbonRating, getOverallSoilRating } from '../utils/soilRating.js'
import { useT } from '../i18n/useT.js'

export default function FieldProfile() {
  const { t, isHindi, formatDate, formatCrop, formatVariety, formatStage, formatNumber } = useT()
  const { fieldId } = useParams()

  const [field, setField] = useState(null)
  const [weather, setWeather] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Notification Toast State
  const [toast, setToast] = useState(null)

  const showToast = useCallback((variant, title, message) => {
    setToast({ variant, title, message })
    setTimeout(() => {
      setToast((curr) => (curr?.title === title ? null : curr))
    }, 4500)
  }, [])

  useDocumentTitle(field?.name ? `${field.name} — KhetGPT` : 'Field Profile — KhetGPT')

  const fetchFieldData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [fieldData, weatherData] = await Promise.all([
        endpoints.getFieldById(fieldId),
        endpoints.getFieldWeather(fieldId).catch(() => null),
      ])
      setField(fieldData)
      setWeather(weatherData)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load field profile.')
    } finally {
      setIsLoading(false)
    }
  }, [fieldId])

  useEffect(() => {
    let ignore = false

    async function loadData() {
      try {
        const [fieldData, weatherData] = await Promise.all([
          endpoints.getFieldById(fieldId),
          endpoints.getFieldWeather(fieldId).catch(() => null),
        ])
        if (!ignore) {
          setField(fieldData)
          setWeather(weatherData)
          setIsLoading(false)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.error || err.message || 'Failed to load field profile.')
          setIsLoading(false)
        }
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [fieldId])

  // Compute Days After Sowing (DAS)
  const computeDAS = (sowingDateStr) => {
    if (!sowingDateStr) return null
    try {
      const sowing = new Date(sowingDateStr)
      const now = new Date()
      const diffTime = now - sowing
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 ? diffDays : null
    } catch {
      return null
    }
  }

  const das = field?.sowingDate ? computeDAS(field.sowingDate) : null
  const hasCoords = field?.latitude != null && field?.longitude != null
  const overallSoilRating = field?.latestSoilTest ? getOverallSoilRating(field.latestSoilTest) : null

  return (
    <div className="space-y-6 py-2 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-fast shadow-xl">
          <Toast
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* 1. Breadcrumb Navigation & Demo Scenario Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-xs font-semibold text-ink-muted hover:text-primary-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Back to My Farms & Fields</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-primary-600" />
            Field Demo:
          </span>
          <Link
            to="/fields/1"
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
              String(fieldId) === '1'
                ? 'bg-primary-700 text-ink-inverse shadow-xs'
                : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
            }`}
          >
            1. North Khet (Wheat)
          </Link>
          <Link
            to="/fields/2"
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
              String(fieldId) === '2'
                ? 'bg-primary-700 text-ink-inverse shadow-xs'
                : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
            }`}
          >
            2. East Paddy (Rice)
          </Link>
          <Link
            to="/fields/3"
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
              String(fieldId) === '3'
                ? 'bg-primary-700 text-ink-inverse shadow-xs'
                : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
            }`}
          >
            3. South Block (Maize)
          </Link>
          <Link
            to="/fields/4"
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
              String(fieldId) === '4'
                ? 'bg-primary-700 text-ink-inverse shadow-xs'
                : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
            }`}
          >
            4. West Plot (Empty)
          </Link>
        </div>
      </div>

      {/* 2. Loading State Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border-default bg-bg-surface space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-9 w-28" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      )}

      {/* 3. Error Banner */}
      {error && !isLoading && (
        <div className="p-4 rounded-xl bg-risk-high-bg border border-risk-high-border text-sm text-risk-high-text flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchFieldData}
            className="shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* 4. Main Profile Content */}
      {!isLoading && field && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border-default bg-bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="p-1 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <Layers className="w-4 h-4" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
                  {field.name}
                </h1>
                <Badge variant="subtle">
                  {field.areaAcres ? `${field.areaAcres} Acres` : '1.0 Acre'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-secondary">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary-600" />
                  {hasCoords ? (
                    <span className="font-mono">
                      {Number(field.latitude).toFixed(4)}° N, {Number(field.longitude).toFixed(4)}° E
                    </span>
                  ) : (
                    <span className="text-risk-high-text">Coordinates Missing</span>
                  )}
                </span>
                {field.pincode && (
                  <span className="text-ink-muted">
                    • Postal Pincode: <strong>{field.pincode}</strong> (label only)
                  </span>
                )}
                <span>•</span>
                <span>
                  Registered{' '}
                  {field.createdAt
                    ? new Date(field.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recently'}
                </span>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Field Details</span>
              </Button>

              <Link to={`/fields/${field.id}/recommendation`}>
                <Button variant="primary" className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Get Recommendation</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Navigation Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to={`/fields/${field.id}/soil`}
              className="p-3.5 rounded-xl border border-border-default bg-bg-surface hover:border-primary-400 hover:shadow-sm transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                  <FlaskConical className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-ink-primary block">Soil Health</span>
                  <span className="text-[11px] text-ink-muted">Input & Ratings</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-primary-600 transition-colors" />
            </Link>

            <Link
              to={`/fields/${field.id}/recommendation`}
              className="p-3.5 rounded-xl border border-border-default bg-bg-surface hover:border-primary-400 hover:shadow-sm transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-ink-primary block">Recommendation</span>
                  <span className="text-[11px] text-ink-muted">Deficit & Dosage</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-primary-600 transition-colors" />
            </Link>

            <Link
              to={`/fields/${field.id}/schedule`}
              className="p-3.5 rounded-xl border border-border-default bg-bg-surface hover:border-primary-400 hover:shadow-sm transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-ink-primary block">Split Schedule</span>
                  <span className="text-[11px] text-ink-muted">Dated Calendar</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-primary-600 transition-colors" />
            </Link>

            <Link
              to={`/fields/${field.id}/history`}
              className="p-3.5 rounded-xl border border-border-default bg-bg-surface hover:border-primary-400 hover:shadow-sm transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-ink-primary block">Field History</span>
                  <span className="text-[11px] text-ink-muted">Past Logs & Trends</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-primary-600 transition-colors" />
            </Link>
          </div>

          {/* 5. Main Grid: Agronomy & Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agronomy Lifecycle Card */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border-default pb-3">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-primary-600" />
                  <h2 className="text-base font-bold text-ink-primary">Crop & Stage Status</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="text-xs text-primary-700 dark:text-primary-300 hover:underline font-semibold cursor-pointer"
                >
                  Edit Crop
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3.5 rounded-xl bg-bg-subtle/80 border border-border-default space-y-1">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                    {t('history.cropLabel') || 'Cultivated Crop'}
                  </span>
                  <div className="text-base font-bold text-ink-primary capitalize">
                    {formatCrop(field.cropType) || 'Wheat'}
                  </div>
                  <span className="text-xs text-ink-secondary">
                    {field.cropVariety ? `${formatVariety(field.cropType, field.cropVariety) || field.cropVariety}` : 'Standard variety'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-bg-subtle/80 border border-border-default space-y-1">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                    {t('history.currentStageLabel') || 'Current Stage'}
                  </span>
                  <div className="text-base font-bold text-primary-700 dark:text-primary-300 capitalize">
                    {formatStage(field.growthStage) || 'Sowing'}
                  </div>
                  <span className="text-xs text-ink-muted">
                    {das != null ? `${formatNumber(das)} ${isHindi ? 'दिन बुवाई बाद' : 'Days After Sowing'}` : 'Basal timing'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-bg-subtle/80 border border-border-default space-y-1">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                    {isHindi ? 'बुवाई तिथि' : 'Sowing Date'}
                  </span>
                  <div className="text-sm font-bold text-ink-primary">
                    {field.sowingDate ? formatDate(field.sowingDate) : (isHindi ? 'दर्ज नहीं' : 'Not recorded')}
                  </div>
                  <span className="text-[11px] text-ink-muted">{isHindi ? 'खुराक कैलेंडर तय करता है' : 'Determines split calendar'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-bg-subtle/80 border border-border-default space-y-1">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                    {isHindi ? 'खेत का आकार' : 'Plot Size'}
                  </span>
                  <div className="text-sm font-bold text-ink-primary">
                    {t('history.areaLabel', { area: formatNumber(field.areaAcres || 1.0, 1) })}
                  </div>
                  <span className="text-[11px] text-ink-muted">
                    ≈ {formatNumber((field.areaAcres || 1.0) / 2.4711, 2)} {isHindi ? 'हेक्टेयर' : 'Hectares'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Location & Micro-Weather Card */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border-default pb-3">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-ink-primary">
                    Location & Weather Station
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="text-xs text-primary-700 dark:text-primary-300 hover:underline font-semibold cursor-pointer"
                >
                  Change Location
                </button>
              </div>

              {/* Coordinates Overview */}
              <div className="p-3.5 rounded-xl bg-bg-subtle/80 border border-border-default space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink-secondary flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span>Coordinates for Weather:</span>
                  </span>
                  {hasCoords ? (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                      Open-Meteo Synced
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-risk-high-text bg-risk-high-bg px-2 py-0.5 rounded-full">
                      Missing Coordinates
                    </span>
                  )}
                </div>

                <div className="font-mono text-xs text-ink-primary font-bold">
                  {hasCoords
                    ? `Lat: ${Number(field.latitude).toFixed(4)}° • Lng: ${Number(field.longitude).toFixed(4)}°`
                    : 'Coordinates are required for weather forecasts.'}
                </div>

                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Open-Meteo micro-forecasts are requested using these exact coordinates. Pincode ({field.pincode || 'none'}) is an optional label and is never geocoded.
                </p>
              </div>

              {/* Live Weather Metrics */}
              {weather ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-border-default bg-bg-surface text-center space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-ink-muted block">
                      Temperature
                    </span>
                    <div className="text-base sm:text-lg font-black text-ink-primary flex items-center justify-center gap-1">
                      <Thermometer className="w-4 h-4 text-amber-500" />
                      <span>{weather.temperatureC}°C</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-border-default bg-bg-surface text-center space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-ink-muted block">
                      Humidity
                    </span>
                    <div className="text-base sm:text-lg font-black text-ink-primary flex items-center justify-center gap-1">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span>{weather.humidityPct}%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-border-default bg-bg-surface text-center space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-ink-muted block">
                      5-Day Rain
                    </span>
                    <div className="text-base sm:text-lg font-black text-ink-primary flex items-center justify-center gap-1">
                      <CloudSun className="w-4 h-4 text-emerald-500" />
                      <span>{weather.rainfallMmForecast} mm</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed border-border-default text-xs text-ink-muted text-center">
                  Weather forecast updates automatically once field coordinates are verified.
                </div>
              )}
            </Card>
          </div>

          {/* 6. Lower Grid: Latest Soil Test & Latest Recommendation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest Soil Health Test Card */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border-default pb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-ink-primary">Latest Soil Test</h2>
                </div>
                <Link
                  to={`/fields/${field.id}/soil`}
                  className="text-xs font-semibold text-primary-700 dark:text-primary-300 hover:underline"
                >
                  {field.latestSoilTest ? 'Add New Test' : 'Record Test'}
                </Link>
              </div>

              {field.latestSoilTest ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-ink-secondary">
                    <span>
                      Sampled on{' '}
                      <strong>
                        {new Date(field.latestSoilTest.testedOn).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </span>
                    <Badge variant="subtle">Fixed 6 Parameters</Badge>
                  </div>

                  {/* Overall Soil Health Rating Banner */}
                  {overallSoilRating && (
                    <div className="p-3 rounded-xl border border-border-default bg-bg-subtle flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-ink-muted block tracking-wider">
                          ICAR Soil Health Rating
                        </span>
                        <div className="text-xs font-bold text-ink-primary">
                          {overallSoilRating.summary}
                        </div>
                      </div>
                      <Badge variant={overallSoilRating.badgeVariant || 'neutral'} size="sm">
                        {overallSoilRating.title}
                      </Badge>
                    </div>
                  )}

                  {/* N-P-K & pH Grid with ICAR Ratings */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 rounded-lg border border-border-default bg-bg-surface space-y-1">
                      <span className="text-[10px] font-bold uppercase text-ink-muted block">
                        Nitrogen (N)
                      </span>
                      <span className="text-sm font-black text-ink-primary block">
                        {field.latestSoilTest.n}{' '}
                        <span className="text-[10px] font-normal text-ink-muted">kg/ha</span>
                      </span>
                      <Badge variant={getNutrientRating('n', field.latestSoilTest.n).badgeVariant} size="sm">
                        {getNutrientRating('n', field.latestSoilTest.n).shortLabel}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border-default bg-bg-surface space-y-1">
                      <span className="text-[10px] font-bold uppercase text-ink-muted block">
                        Phosphorus (P)
                      </span>
                      <span className="text-sm font-black text-ink-primary block">
                        {field.latestSoilTest.p}{' '}
                        <span className="text-[10px] font-normal text-ink-muted">kg/ha</span>
                      </span>
                      <Badge variant={getNutrientRating('p', field.latestSoilTest.p).badgeVariant} size="sm">
                        {getNutrientRating('p', field.latestSoilTest.p).shortLabel}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border-default bg-bg-surface space-y-1">
                      <span className="text-[10px] font-bold uppercase text-ink-muted block">
                        Potassium (K)
                      </span>
                      <span className="text-sm font-black text-ink-primary block">
                        {field.latestSoilTest.k}{' '}
                        <span className="text-[10px] font-normal text-ink-muted">kg/ha</span>
                      </span>
                      <Badge variant={getNutrientRating('k', field.latestSoilTest.k).badgeVariant} size="sm">
                        {getNutrientRating('k', field.latestSoilTest.k).shortLabel}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 rounded-lg border border-border-default bg-bg-surface space-y-1">
                      <span className="text-[10px] font-bold uppercase text-ink-muted block">
                        Soil pH
                      </span>
                      <span className="text-sm font-black text-ink-primary block">
                        {field.latestSoilTest.ph}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                        {getPhRating(field.latestSoilTest.ph).label}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border-default bg-bg-surface space-y-1">
                      <span className="text-[10px] font-bold uppercase text-ink-muted block">
                        Org. Carbon
                      </span>
                      <span className="text-sm font-black text-ink-primary block">
                        {field.latestSoilTest.organicCarbon}%
                      </span>
                      <span className="text-[10px] font-semibold text-ink-secondary block">
                        {getOrganicCarbonRating(field.latestSoilTest.organicCarbon).label}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border-default bg-bg-surface space-y-1">
                      <span className="text-[10px] font-bold uppercase text-ink-muted block">
                        Moisture
                      </span>
                      <span className="text-sm font-black text-ink-primary block">
                        {field.latestSoilTest.moisture}%
                      </span>
                      <span className="text-[10px] text-ink-muted block">
                        Field Capacity
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link to={`/fields/${field.id}/soil`}>
                      <Button variant="secondary" size="sm" className="w-full">
                        View Full Soil Nutrient Report →
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-5 text-center border border-dashed border-amber-300 dark:border-amber-700 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      No Soil Test Recorded
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300 max-w-sm mx-auto mt-1 leading-relaxed">
                      Precision fertilizer calculation requires soil N-P-K, pH, and organic carbon. Record your test to unlock recommendation calculations.
                    </p>
                  </div>
                  <Link to={`/fields/${field.id}/soil`}>
                    <Button variant="primary" size="sm" className="mt-1">
                      Record Soil Test
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Latest Recommendation Card */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border-default pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  <h2 className="text-base font-bold text-ink-primary">
                    Nutrient Recommendation
                  </h2>
                </div>
                <Link
                  to={`/fields/${field.id}/recommendation`}
                  className="text-xs font-semibold text-primary-700 dark:text-primary-300 hover:underline"
                >
                  {field.latestRecommendation ? 'View Plan' : 'Generate'}
                </Link>
              </div>

              {field.latestRecommendation ? (
                <div className="space-y-4">
                  {/* Primary Recommendation Banner */}
                  <div className="p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-primary-800 dark:text-primary-300 block">
                        Primary Fertilizer
                      </span>
                      <div className="text-base sm:text-lg font-black text-ink-primary capitalize">
                        {field.latestRecommendation.fertilizerType}
                      </div>
                      <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                        {field.latestRecommendation.quantityKgPerAcre} kg / acre total
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-ink-muted uppercase block">
                        Risk Assessment
                      </span>
                      <RiskBadge level={field.latestRecommendation.risk?.level || 'low'} />
                    </div>
                  </div>

                  {/* Impact & Reason */}
                  {field.latestRecommendation.risk?.reason && (
                    <div className="p-3 rounded-lg bg-bg-subtle/80 border border-border-default text-xs text-ink-secondary leading-snug">
                      <strong className="text-ink-primary font-semibold">Agronomist Reason: </strong>
                      {field.latestRecommendation.risk.reason}
                    </div>
                  )}

                  {/* Cost & Savings Summary */}
                  {field.latestRecommendation.cost && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg border border-border-default bg-bg-surface">
                        <span className="text-ink-muted block text-[11px]">Estimated Cost</span>
                        <strong className="text-sm text-ink-primary font-black">
                          ₹{field.latestRecommendation.cost.estimatedCostPerAcre}
                        </strong>
                        <span className="text-[10px] text-ink-muted"> / acre</span>
                      </div>

                      <div className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30">
                        <span className="text-emerald-800 dark:text-emerald-300 block text-[11px]">
                          Potential Saving
                        </span>
                        <strong className="text-sm text-emerald-700 dark:text-emerald-400 font-black">
                          ₹{field.latestRecommendation.cost.savingTotal || field.latestRecommendation.cost.savingPerAcre || 0}
                        </strong>
                        <span className="text-[10px] text-emerald-600"> total</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link to={`/fields/${field.id}/recommendation`}>
                      <Button variant="primary" size="sm" className="w-full">
                        Open Full Schedule & Deficit Breakdown →
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-5 text-center border border-dashed border-border-default rounded-xl bg-bg-surface/40 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-primary">
                      No Recommendation Yet
                    </h3>
                    <p className="text-xs text-ink-secondary max-w-sm mx-auto mt-1 leading-relaxed">
                      Generate an optimal fertilizer dose and dated split schedule tailored to this plot&apos;s soil and local weather.
                    </p>
                  </div>
                  <Link to={`/fields/${field.id}/recommendation`}>
                    <Button variant="primary" size="sm" className="mt-1">
                      Generate Recommendation
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {field && (
        <EditFieldModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          field={field}
          onSuccess={(updated) => {
            setField(updated)
            showToast('success', 'Field Updated', `Field plot "${updated.name}" updated successfully.`)
          }}
          onError={(errMsg) => {
            showToast('error', 'Update Rolled Back', errMsg)
          }}
        />
      )}
    </div>
  )
}
