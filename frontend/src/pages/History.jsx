import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Clock,
  Sprout,
  MapPin,
  FlaskConical,
  Scale,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Info,
  Package,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
} from 'lucide-react'
import PageShell from '../components/ui/PageShell.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Card from '../components/ui/Card.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import RiskBadge from '../components/ui/RiskBadge.jsx'
import NutrientLevelsChart from '../components/charts/NutrientLevelsChart.jsx'
import FertilizerAppliedVsRecommendedChart from '../components/charts/FertilizerAppliedVsRecommendedChart.jsx'
import CostTrendsChart from '../components/charts/CostTrendsChart.jsx'
import { getNutrientRating, getOverallSoilRating } from '../utils/soilRating.js'
import * as endpoints from '../services/endpoints.js'
import { useFarmStore } from '../store/useFarmStore.js'

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

function formatFertilizer(type) {
  const map = {
    urea: 'Urea (46% N)',
    dap: 'DAP (18:46:0)',
    mop: 'MOP (0:0:60)',
    npk_10_26_26: 'NPK 10:26:26',
    ssp: 'SSP (16% P)',
  }
  return map[type?.toLowerCase()] || type?.toUpperCase() || 'Fertilizer'
}

function formatStage(stage) {
  const map = {
    sowing: 'Basal / Sowing',
    crown_root_initiation: 'Crown Root (CRI)',
    tillering: 'Tillering',
    jointing: 'Jointing',
    flowering: 'Flowering',
    grain_filling: 'Grain Filling',
    vegetative: 'Vegetative Growth',
    transplanting: 'Transplanting',
    knee_high: 'Knee-high (V6)',
  }
  return map[stage?.toLowerCase()] || stage?.replace(/_/g, ' ') || 'General'
}

export default function History() {
  const { fieldId } = useParams()
  const currentFieldId = fieldId || '1'

  // Data states
  const [field, setField] = useState(null)
  const [recommendationsData, setRecommendationsData] = useState({
    items: [],
    page: 1,
    limit: 5,
    total: 0,
  })
  const [trends, setTrends] = useState({
    soilTests: [],
    applied: [],
    recommendations: [],
  })

  // Selected recommendation detail modal state
  const [selectedRec, setSelectedRec] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Active view tab ('all' | 'charts' | 'logs')
  const [activeTab, setActiveTab] = useState('all')

  // Pagination state
  const [page, setPage] = useState(1)
  const limit = 5

  const loadData = useCallback(async (p = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const [fieldRes, recsRes, trendsRes] = await Promise.all([
        endpoints.getFieldById(currentFieldId).catch(() => null),
        endpoints.getRecommendations(currentFieldId, { page: p, limit }),
        endpoints.getFieldTrends(currentFieldId).catch(() => ({
          soilTests: [],
          applied: [],
          recommendations: [],
        })),
      ])

      setField(
        fieldRes || {
          id: currentFieldId,
          name: `Field ${currentFieldId}`,
          cropType: 'wheat',
          cropVariety: 'HD-2967',
          growthStage: 'vegetative',
          areaAcres: 2.5,
          latitude: 28.6139,
          longitude: 77.209,
        },
      )

      setRecommendationsData({
        items: recsRes?.items || (Array.isArray(recsRes) ? recsRes : []),
        page: recsRes?.page || p,
        limit: recsRes?.limit || limit,
        total: recsRes?.total != null ? recsRes.total : (recsRes?.items?.length || 0),
      })

      setTrends(
        trendsRes || {
          soilTests: [],
          applied: [],
          recommendations: [],
        },
      )
    } catch (err) {
      setError(err.message || 'Failed to load field history and agronomic trends.')
    } finally {
      setIsLoading(false)
    }
  }, [currentFieldId, limit])

  useEffect(() => {
    setPage(1)
    loadData(1)
  }, [currentFieldId, loadData])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    loadData(newPage)
  }

  // Open past recommendation details from GET /recommendations/:id
  const handleOpenDetail = async (item) => {
    setIsDetailLoading(true)
    setSelectedRec(item) // Immediate preview
    try {
      const full = await endpoints.getRecommendationById(item.id)
      setSelectedRec(full || item)
    } catch {
      // Fallback to existing item
    } finally {
      setIsDetailLoading(false)
    }
  }

  // Calculate soil rating for the header
  const latestSoilTest = useMemo(() => {
    if (trends?.soilTests && trends.soilTests.length > 0) {
      return trends.soilTests[trends.soilTests.length - 1]
    }
    return field?.latestSoilTest || null
  }, [trends?.soilTests, field?.latestSoilTest])

  const soilRating = useMemo(() => {
    return getOverallSoilRating(latestSoilTest)
  }, [latestSoilTest])

  const totalPages = Math.ceil(recommendationsData.total / recommendationsData.limit) || 1
  const hasHistory = recommendationsData.total > 0 || (trends?.soilTests && trends.soilTests.length > 0)

  return (
    <PageShell
      title="Field History & Analytics"
      description="Historical nutrient trends, past fertilizer recommendations, and dose compliance logs."
    >
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/fields/${currentFieldId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-secondary hover:text-ink-primary min-h-touch py-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Field Profile</span>
          </Link>

          {/* Quick Demo Scenario Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary-600" />
              Demo:
            </span>
            <Link
              to="/fields/1/history"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                currentFieldId === '1'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs'
                  : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
              }`}
            >
              1. North Khet (12+ Rows & Full Trends)
            </Link>
            <Link
              to="/fields/2/history"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                currentFieldId === '2'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs'
                  : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
              }`}
            >
              2. East Paddy (Rice)
            </Link>
            <Link
              to="/fields/3/history"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                currentFieldId === '3'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs'
                  : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
              }`}
            >
              3. South Block (Maize)
            </Link>
            <Link
              to="/fields/4/history"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                currentFieldId === '4'
                  ? 'bg-primary-700 text-ink-inverse shadow-xs'
                  : 'bg-bg-surface border border-border-default text-ink-secondary hover:text-ink-primary'
              }`}
            >
              4. West Plot (Friendly Empty State)
            </Link>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        )}

        {/* Error State Banner */}
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
              onClick={() => loadData(page)}
              className="shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Retry</span>
            </Button>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && field && (
          <div className="space-y-6">
            {/* 1. Field Header Context Box: Crop, Stage, Location, and Latest Soil Rating */}
            <div className="p-5 sm:p-6 rounded-2xl border border-border-default bg-bg-surface shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-primary-700 dark:text-primary-400">
                      Field Agronomic Dossier
                    </span>
                    <Badge variant="neutral" size="sm">
                      Plot ID #{field.id}
                    </Badge>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">
                    {field.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-ink-secondary">
                    <span className="inline-flex items-center gap-1 font-bold text-ink-primary">
                      <Sprout className="w-3.5 h-3.5 text-primary-600" />
                      Crop: {field.cropType?.toUpperCase()} ({field.cropVariety || 'Standard'})
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-ink-muted" />
                      Current Stage: <strong className="capitalize text-primary-700 dark:text-primary-300">{formatStage(field.growthStage)}</strong>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {Number(field.latitude || 28.6139).toFixed(3)}° N, {Number(field.longitude || 77.209).toFixed(3)}° E
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-accent-amber" />
                      Area: {field.areaAcres || 2.5} Acres
                    </span>
                  </div>
                </div>

                {/* Latest Soil Rating Chip */}
                <div className="p-3.5 rounded-xl border border-border-default bg-bg-subtle text-left md:text-right shrink-0 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-ink-muted block tracking-wider">
                    Latest Soil Health Rating
                  </span>
                  <div className="flex items-center md:justify-end gap-2">
                    <Badge variant={soilRating.badgeVariant || 'neutral'} size="md">
                      {soilRating.title}
                    </Badge>
                  </div>
                  {latestSoilTest && (
                    <div className="text-[11px] text-ink-secondary font-mono">
                      N: {latestSoilTest.n} ({getNutrientRating('n', latestSoilTest.n).shortLabel}) • P: {latestSoilTest.p} ({getNutrientRating('p', latestSoilTest.p).shortLabel}) • K: {latestSoilTest.k}
                    </div>
                  )}
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-4">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-subtle border border-border-default text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-bg-surface text-ink-primary shadow-xs font-black'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    Overview & Trends
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('logs')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'logs'
                        ? 'bg-bg-surface text-ink-primary shadow-xs font-black'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    Recommendations Log ({recommendationsData.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('charts')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'charts'
                        ? 'bg-bg-surface text-ink-primary shadow-xs font-black'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    Charts Only
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/fields/${field.id}/schedule`}>
                    <Button variant="outline" size="sm">
                      View Printable Schedule →
                    </Button>
                  </Link>
                  <Link to={`/fields/${field.id}/recommendation`}>
                    <Button variant="primary" size="sm">
                      New Recommendation
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. Empty State (Friendly empty state for field with no history yet) */}
            {!hasHistory && (
              <EmptyState
                icon={Clock}
                title="No Agronomic History Recorded Yet"
                description={`Field "${field.name}" is freshly registered. Once you record your first soil test or run precision fertilizer optimization, historical nutrient curves, application records, and cost savings will automatically build here.`}
                action={
                  <Link to={`/fields/${field.id}/soil`}>
                    <Button variant="primary" size="md">
                      Record Soil Test Lab Values
                    </Button>
                  </Link>
                }
                secondaryAction={
                  <Link to={`/fields/${field.id}/recommendation`}>
                    <Button variant="outline" size="md">
                      Generate Initial Recommendation
                    </Button>
                  </Link>
                }
              />
            )}

            {/* 3. History Content (When records exist) */}
            {hasHistory && (
              <div className="space-y-8">
                {/* Visual Charts Section (Nutrient levels, Applied vs Recommended, and Cost) */}
                {(activeTab === 'all' || activeTab === 'charts') && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border-default pb-2">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-primary-600" />
                        <h2 className="text-lg font-black text-ink-primary tracking-tight">
                          Agronomic & Financial Trajectory Charts
                        </h2>
                      </div>
                      <span className="text-xs text-ink-muted font-mono">
                        NFR2 Lightweight Vector Rendering • Zero Extra Bundle Size
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Chart 1: Soil Nutrient Trajectory (N, P, K over time) */}
                      <NutrientLevelsChart soilTests={trends.soilTests} />

                      {/* Chart 2: Fertilizer Applied vs Recommended Target */}
                      <FertilizerAppliedVsRecommendedChart
                        applied={trends.applied}
                        recommendations={trends.recommendations}
                      />
                    </div>

                    {/* Chart 3: Financial Trajectory & Savings */}
                    <CostTrendsChart
                      applied={trends.applied}
                      recommendations={trends.recommendations}
                    />
                  </div>
                )}

                {/* Past Recommendations History List Table */}
                {(activeTab === 'all' || activeTab === 'logs') && (
                  <div className="p-5 sm:p-6 rounded-2xl border border-border-default bg-bg-surface shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary-600" />
                          <h2 className="text-base font-black text-ink-primary uppercase tracking-wider">
                            Historical Recommendations Log
                          </h2>
                        </div>
                        <p className="text-xs text-ink-secondary mt-0.5">
                          Showing {recommendationsData.items.length} of {recommendationsData.total} past records (newest first)
                        </p>
                      </div>

                      {/* Pagination Top Indicator */}
                      <div className="text-xs font-mono text-ink-muted">
                        Page {recommendationsData.page} of {totalPages}
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-bg-subtle border-b border-border-default text-ink-muted uppercase font-bold text-[11px]">
                          <tr>
                            <th scope="col" className="py-3 px-3">When</th>
                            <th scope="col" className="py-3 px-3">Crop & Stage</th>
                            <th scope="col" className="py-3 px-3">Product</th>
                            <th scope="col" className="py-3 px-3">Quantity</th>
                            <th scope="col" className="py-3 px-3">Risk Assessment</th>
                            <th scope="col" className="py-3 px-3">Savings</th>
                            <th scope="col" className="py-3 px-3 text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {recommendationsData.items.map((item, idx) => {
                            const estCost = item.cost?.estimatedCostPerAcre ?? item.estimatedCost
                            const saving = item.cost?.savingPerAcre ?? item.estimatedSaving
                            const risk = item.risk?.level || item.riskLevel || 'low'

                            return (
                              <tr
                                key={item.id || idx}
                                className="hover:bg-bg-subtle/70 transition-colors group cursor-pointer"
                                onClick={() => handleOpenDetail(item)}
                              >
                                {/* 1. When */}
                                <td className="py-3.5 px-3 font-medium text-ink-primary whitespace-nowrap">
                                  <div className="font-bold text-ink-primary">
                                    {formatDate(item.createdAt || item.date)}
                                  </div>
                                  <span className="text-[10px] text-ink-muted block font-mono">
                                    ID: {item.id}
                                  </span>
                                </td>

                                {/* 2. Crop & Stage */}
                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  <div className="font-bold text-ink-primary capitalize">
                                    {item.cropType || field.cropType}
                                  </div>
                                  <span className="text-[11px] text-ink-secondary">
                                    {formatStage(item.growthStage || 'sowing')}
                                  </span>
                                </td>

                                {/* 3. Product */}
                                <td className="py-3.5 px-3 font-semibold text-ink-primary whitespace-nowrap">
                                  {formatFertilizer(item.fertilizerType)}
                                </td>

                                {/* 4. Quantity */}
                                <td className="py-3.5 px-3 font-mono text-ink-primary whitespace-nowrap">
                                  <span className="font-black text-sm">
                                    {Number(item.quantityKgPerAcre).toFixed(1)}
                                  </span>{' '}
                                  <span className="text-[11px] text-ink-muted">kg/ac</span>
                                </td>

                                {/* 5. Risk */}
                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  <RiskBadge level={risk} />
                                </td>

                                {/* 6. Saving */}
                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  {saving != null && saving > 0 ? (
                                    <div className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                                      <span>+{formatInr(saving)}</span>
                                      <span className="text-[10px] font-normal text-emerald-600">/ac</span>
                                    </div>
                                  ) : saving != null && saving < 0 ? (
                                    <span className="text-blue-700 dark:text-blue-400 font-bold">
                                      +{formatInr(Math.abs(saving))} reinvestment
                                    </span>
                                  ) : (
                                    <span className="text-ink-muted text-[11px]">No baseline</span>
                                  )}
                                </td>

                                {/* 7. Action */}
                                <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenDetail(item)
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-subtle text-primary-700 dark:text-primary-300 font-bold hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
                                  >
                                    <span>Open</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border-default text-xs">
                      <div className="text-ink-secondary">
                        Showing page <strong>{recommendationsData.page}</strong> of <strong>{totalPages}</strong> ({recommendationsData.total} total recommendations)
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => handlePageChange(page - 1)}
                          leftIcon={ChevronLeft}
                        >
                          Previous
                        </Button>

                        {/* Page Numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                          <button
                            key={pNum}
                            type="button"
                            onClick={() => handlePageChange(pNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center justify-center cursor-pointer ${
                              page === pNum
                                ? 'bg-primary-700 text-ink-inverse shadow-xs'
                                : 'bg-bg-subtle text-ink-secondary hover:text-ink-primary'
                            }`}
                          >
                            {pNum}
                          </button>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => handlePageChange(page + 1)}
                          rightIcon={ChevronRight}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* Past Recommendation Detail Modal (Opened via GET /recommendations/:id) */}
        {/* ========================================================================= */}
        {selectedRec && (
          <Modal
            isOpen={Boolean(selectedRec)}
            onClose={() => setSelectedRec(null)}
            title={`Recommendation Analysis • ${formatDate(selectedRec.createdAt || selectedRec.date)}`}
            description={`Historical plan for ${selectedRec.cropType?.toUpperCase() || field?.cropType?.toUpperCase()} (${formatStage(selectedRec.growthStage)})`}
            className="max-w-2xl"
          >
            <div className="space-y-5 text-xs text-ink-primary">
              {/* Product and Dose Highlight */}
              <div className="p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-950/20 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase text-primary-800 dark:text-primary-300 block">
                    Recommended Fertilizer Product
                  </span>
                  <div className="text-xl font-black text-ink-primary capitalize mt-0.5">
                    {formatFertilizer(selectedRec.fertilizerType)}
                  </div>
                  <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                    Total Dose: {selectedRec.quantityKgPerAcre} kg / acre
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-ink-muted uppercase block">
                    Assessed Risk Level
                  </span>
                  <div className="mt-1">
                    <RiskBadge level={selectedRec.risk?.level || selectedRec.riskLevel || 'low'} />
                  </div>
                </div>
              </div>

              {/* Agronomic Risk Reasons & Soil Impact Sentences */}
              {selectedRec.risk?.reason && (
                <div className="p-3.5 rounded-xl bg-bg-subtle border border-border-default space-y-2">
                  <div>
                    <strong className="font-extrabold text-ink-primary block uppercase text-[10px] tracking-wider">
                      Agronomist Reason:
                    </strong>
                    <p className="text-ink-secondary leading-relaxed mt-0.5">
                      {selectedRec.risk.reason}
                    </p>
                  </div>

                  {selectedRec.risk.soilHealthImpact && (
                    <div className="pt-1.5 border-t border-border-subtle">
                      <strong className="font-bold text-ink-primary block text-[11px]">
                        Soil Health Impact:
                      </strong>
                      <p className="text-ink-secondary leading-relaxed">
                        {selectedRec.risk.soilHealthImpact}
                      </p>
                    </div>
                  )}

                  {selectedRec.risk.yieldImpact && (
                    <div className="pt-1 border-t border-border-subtle">
                      <strong className="font-bold text-ink-primary block text-[11px]">
                        Yield & Crop Impact:
                      </strong>
                      <p className="text-ink-secondary leading-relaxed">
                        {selectedRec.risk.yieldImpact}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Split Schedule Timeline */}
              {selectedRec.schedule && selectedRec.schedule.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-ink-primary block">
                    Application Split Calendar ({selectedRec.schedule.length} Stages)
                  </span>

                  <div className="space-y-2">
                    {selectedRec.schedule.map((stg, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 rounded-lg border border-border-default bg-bg-surface flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-ink-primary block">
                            Split #{sIdx + 1}: {formatStage(stg.stage)}
                          </span>
                          <span className="text-[11px] text-ink-muted">
                            {formatFertilizer(stg.fertilizerType)} • Apply by: {formatDate(stg.applyBy)}
                          </span>
                        </div>
                        <div className="text-right font-mono font-bold text-ink-primary">
                          {stg.quantityKgPerAcre} kg/ac
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost & Savings Summary */}
              {selectedRec.cost && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-border-default bg-bg-subtle">
                    <span className="text-ink-muted block text-[11px]">Estimated Investment</span>
                    <strong className="text-base text-ink-primary font-black">
                      {formatInr(selectedRec.cost.estimatedCostPerAcre)}
                    </strong>
                    <span className="text-[10px] text-ink-muted"> / acre</span>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <span className="text-emerald-800 dark:text-emerald-300 block text-[11px]">
                      Potential Savings
                    </span>
                    <strong className="text-base text-emerald-700 dark:text-emerald-400 font-black">
                      {formatInr(selectedRec.cost.savingPerAcre || selectedRec.cost.savingTotal || 0)}
                    </strong>
                    <span className="text-[10px] text-emerald-600"> saved per acre</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-border-default">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRec(null)}
                >
                  Close
                </Button>
                <Link to={`/fields/${currentFieldId}/schedule`}>
                  <Button variant="primary" size="sm" rightIcon={ExternalLink}>
                    View Printable Schedule Sheet
                  </Button>
                </Link>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PageShell>
  )
}
