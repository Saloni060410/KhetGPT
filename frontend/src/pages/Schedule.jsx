import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Printer,
  Calendar,
  Clock,
  Sprout,
  Scale,
  Package,
  ArrowLeft,
  CloudRain,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Info,
  Layers,
  ShoppingBag,
  FileText,
  RotateCcw,
} from 'lucide-react'
import PageShell from '../components/ui/PageShell.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import LanguageToggle from '../components/ui/LanguageToggle.jsx'
import { useRecommendationStore } from '../store/useRecommendationStore.js'
import { useFarmStore } from '../store/useFarmStore.js'
import * as endpoints from '../services/endpoints.js'
import { useT } from '../i18n/useT.js'
import OfflineNotice from '../components/ui/OfflineNotice.jsx'

const STAGE_TIMING_HINTS = {
  sowing: { en: 'At field preparation / seed drill placement', hi: 'खेत की तैयारी / बुवाई के समय' },
  transplanting: { en: 'During seedling transplanting / puddle settling', hi: 'पौध रोपाई / लेव लगाने के समय' },
  crown_root_initiation: { en: '20–25 days after sowing (first irrigation)', hi: 'बुवाई के २०-२५ दिन बाद (पहली सिंचाई पर)' },
  tillering: { en: '30–35 days after transplanting / sowing', hi: 'रोपाई/बुवाई के ३०-३५ दिन बाद (कल्ले फूटते समय)' },
  knee_high: { en: '30–35 days after sowing (V6 stage)', hi: 'बुवाई के ३०-३५ दिन बाद (घुटने की ऊंचाई)' },
  jointing: { en: '45–50 days after sowing (stem elongation)', hi: 'बुवाई के ४५-५० दिन बाद (गांठ बनते समय)' },
  panicle_initiation: { en: '50–60 days after transplanting', hi: 'रोपाई के ५०-६० दिन बाद (बाली निकलते समय)' },
  tasseling: { en: '55–65 days after sowing (prior to silk emergence)', hi: 'बुवाई के ५५-६५ दिन बाद (मंजर निकलते समय)' },
  flowering: { en: '65–75 days after sowing', hi: 'बुवाई के ६५-७५ दिन बाद (फूल आने पर)' },
  grain_filling: { en: '80–90 days after sowing (milking stage)', hi: 'बुवाई के ८०-९० दिन बाद (दूधिया दाना भराव)' },
}

// Standard Indian agricultural bag weights
const BAG_WEIGHTS_KG = {
  urea: 45, // Standard Government neem-coated urea bag
  dap: 50,
  mop: 50,
  npk_10_26_26: 50,
  ssp: 50,
}

function calculateBags(fertilizerType, totalKg, isHindi = false) {
  const normType = fertilizerType?.toLowerCase() || ''
  let bagWeight = 50
  if (normType.includes('urea')) bagWeight = 45
  else if (BAG_WEIGHTS_KG[normType]) bagWeight = BAG_WEIGHTS_KG[normType]

  const exactBags = totalKg / bagWeight
  const wholeBags = Math.floor(exactBags)
  const remainingKg = Math.round(totalKg % bagWeight)

  if (isHindi) {
    if (wholeBags === 0) {
      return `${Math.round(totalKg)} किग्रा खुला`
    } else if (remainingKg === 0) {
      return `${wholeBags} बोरी (${bagWeight} किग्रा)`
    } else {
      return `${wholeBags} बोरी + ${remainingKg} किग्रा`
    }
  }

  if (wholeBags === 0) {
    return `${Math.round(totalKg)} kg loose`
  } else if (remainingKg === 0) {
    return `${wholeBags} bag${wholeBags > 1 ? 's' : ''} (${bagWeight}kg)`
  } else {
    return `${wholeBags} bag${wholeBags > 1 ? 's' : ''} + ${remainingKg} kg`
  }
}

// Normalize incoming recommendation payload (handles both camelCase and snake_case)
function normalizeRecommendation(raw) {
  if (!raw) return null
  const rec = raw.recommendation ? { ...raw, ...raw.recommendation } : raw
  return {
    id: rec.id || 'rec-schedule',
    fieldId: String(rec.fieldId || rec.field_id || '1'),
    soilTestId: rec.soilTestId || rec.soil_test_id,
    cropType: rec.cropType || rec.crop_type || 'wheat',
    cropVariety: rec.cropVariety || rec.crop_variety,
    growthStage: rec.growthStage || rec.growth_stage || 'vegetative',
    fertilizerType: rec.fertilizerType || rec.fertilizer_type || 'urea',
    quantityKgPerAcre: Number(rec.quantityKgPerAcre ?? rec.quantity_kg_per_acre ?? 0),
    schedule: (rec.schedule || []).map((s) => ({
      stage: s.stage,
      fertilizerType: s.fertilizerType || s.fertilizer_type,
      quantityKgPerAcre: Number(s.quantityKgPerAcre ?? s.quantity_kg_per_acre ?? 0),
      applyBy: s.applyBy || s.apply_by,
      rainDelay: Boolean(s.rainDelay ?? s.rain_delay),
      rainDelayNote: s.rainDelayNote || s.rain_delay_note,
    })),
    risk: {
      level: (rec.risk?.level || 'low').toLowerCase(),
      reason: rec.risk?.reason || '',
      soilHealthImpact: rec.risk?.soilHealthImpact || rec.risk?.soil_health_impact || '',
      yieldImpact: rec.risk?.yieldImpact || rec.risk?.yield_impact || '',
      overApplicationPct: rec.risk?.overApplicationPct ?? rec.risk?.over_application_pct ?? null,
    },
    topFactors: rec.topFactors || rec.explanation?.top_factors || rec.top_factors || [],
    cost: {
      estimatedCostPerAcre: rec.cost?.estimatedCostPerAcre ?? rec.cost?.estimated_cost_inr_per_acre ?? null,
      previousCostPerAcre: rec.cost?.previousCostPerAcre ?? rec.cost?.previous_cost_inr_per_acre ?? null,
      savingPerAcre: rec.cost?.savingPerAcre ?? rec.cost?.saving_inr_per_acre ?? null,
      savingTotal: rec.cost?.savingTotal ?? rec.cost?.saving_total_inr ?? null,
    },
    weatherSource: rec.weatherSource || rec.weather_source || 'live',
    modelVersion: rec.modelVersion || rec.model_version || 'fixture-0.0.0+rules-fixture',
    createdAt: rec.createdAt || rec.created_at || new Date().toISOString(),
  }
}

export default function Schedule() {
  const {
    t,
    isHindi,
    formatDate,
    formatNumber,
    formatCurrency,
    formatCrop,
    formatVariety,
    formatStage,
    formatFertilizer,
  } = useT()
  const formatInr = formatCurrency

  const { fieldId } = useParams()
  const currentFieldId = fieldId || '1'

  const {
    currentRecommendation,
    fetchRecommendations,
    setCurrentRecommendation,
  } = useRecommendationStore()

  const { fetchField, currentField } = useFarmStore()

  const [loading, setLoading] = useState(false)
  const [isOfflineFallback, setIsOfflineFallback] = useState(false)
  const [cachedTimestamp, setCachedTimestamp] = useState(null)

  // Local storage offline key
  const CACHE_KEY = `khetgpt_schedule_cache_${currentFieldId}`

  const loadScheduleData = useCallback(async () => {
    setLoading(true)
    setIsOfflineFallback(false)

    try {
      fetchField(currentFieldId).catch(() => {})
      const recs = await fetchRecommendations(currentFieldId)

      if (recs && recs.length > 0) {
        const primaryRec = recs[0]
        setCurrentRecommendation(primaryRec)
        // Cache to localStorage for offline access
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              rec: primaryRec,
              timestamp: new Date().toISOString(),
            }),
          )
        } catch {
          // LocalStorage fallback
        }
      }
    } catch {
      // Offline fallback: try reading from localStorage
      try {
        const cachedRaw = localStorage.getItem(CACHE_KEY)
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw)
          setCurrentRecommendation(parsed.rec)
          setCachedTimestamp(parsed.timestamp)
          setIsOfflineFallback(true)
        }
      } catch {
        // Cache read failure
      }
    } finally {
      setLoading(false)
    }
  }, [currentFieldId, fetchField, fetchRecommendations, setCurrentRecommendation, CACHE_KEY])

  useEffect(() => {
    loadScheduleData()
  }, [loadScheduleData])

  const rec = useMemo(
    () => normalizeRecommendation(currentRecommendation),
    [currentRecommendation],
  )

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
    sowingDate:
      currentFieldId === '2'
        ? '2026-09-20'
        : currentFieldId === '3'
        ? '2026-10-01'
        : '2026-10-15',
  }

  const fieldArea = Number(field?.areaAcres) || 2.5

  // Dealer Input Order Summary (consolidated bag requirement for input retailers)
  const dealerSummary = useMemo(() => {
    if (!rec?.schedule || rec.schedule.length === 0) return []
    const summaryMap = {}

    rec.schedule.forEach((item) => {
      const type = item.fertilizerType || 'unknown'
      const kgPerAcre = Number(item.quantityKgPerAcre) || 0
      const totalKg = kgPerAcre * fieldArea

      if (!summaryMap[type]) {
        summaryMap[type] = {
          type,
          name: formatFertilizer(type),
          totalKgPerAcre: 0,
          totalKg: 0,
          stages: [],
        }
      }
      summaryMap[type].totalKgPerAcre += kgPerAcre
      summaryMap[type].totalKg += totalKg
      summaryMap[type].stages.push(formatStage(item.stage))
    })

    return Object.values(summaryMap)
  }, [rec?.schedule, fieldArea, formatFertilizer, formatStage])

  // Total investment estimate
  const totalEstimatedCost = rec?.cost?.estimatedCostPerAcre
    ? rec.cost.estimatedCostPerAcre * fieldArea
    : null

  // Risk display helper: accessible and clear in black-and-white
  const riskLevel = rec?.risk?.level || 'low'
  const riskDetails = {
    high: {
      label: 'HIGH RISK ALERT',
      icon: AlertOctagon,
      desc: rec?.risk?.reason || 'Heavy rainfall or severe nutrient leaching risk detected.',
      printTag: '[HIGH RISK: ACTION REQUIRED]',
    },
    medium: {
      label: 'MODERATE ADJUSTMENT',
      icon: AlertTriangle,
      desc: rec?.risk?.reason || 'Adjustment recommended to prevent over-fertilization.',
      printTag: '[MODERATE RISK: MONITOR DOSES]',
    },
    low: {
      label: 'BALANCED DOSAGE',
      icon: ShieldCheck,
      desc: rec?.risk?.reason || 'Optimal soil nutrient replenishment plan.',
      printTag: '[LOW RISK: BALANCED SCHEDULE]',
    },
  }[riskLevel] || {
    label: 'STANDARD SCHEDULE',
    icon: CheckCircle2,
    desc: 'Standard fertilizer application calendar.',
    printTag: '[STANDARD SCHEDULE]',
  }

  const RiskIcon = riskDetails.icon

  const handlePrint = () => {
    window.print()
  }

  return (
    <PageShell
      title="Application Schedule"
      description="Farmer and input dealer action sheet: what to apply, how much and when."
    >
      {/* Print-specific CSS styles */}
      <style>{`
        @media print {
          /* Hide non-printable elements */
          nav, header, footer, .no-print, button, a[href="#main-content"] {
            display: none !important;
          }

          /* Force high-contrast black and white for paper print */
          body, html, #root, main {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }

          /* Page break controls: never split a stage or card across pages */
          .schedule-card, .dealer-slip, .print-stage-row, tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* High contrast borders and backgrounds for standard thermal / ink printers */
          .print-border {
            border: 1.5pt solid #000000 !important;
          }

          .print-border-b {
            border-bottom: 1pt solid #000000 !important;
          }

          .print-subtle-bg {
            background: #f4f4f4 !important;
          }

          /* Remove all CSS transitions and transforms */
          * {
            animation: none !important;
            transition: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Navigation & Scenario Selector (Hidden in Print) */}
        <div className="no-print space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to={`/fields/${currentFieldId}/recommendation`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-secondary hover:text-ink-primary min-h-touch py-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.back')}</span>
            </Link>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <Button
                variant="primary"
                size="md"
                leftIcon={Printer}
                onClick={handlePrint}
                className="shadow-sm"
              >
                {t('schedule.savePdf')}
              </Button>
            </div>
          </div>

          {/* Quick Scenario Switcher Bar */}
          <div className="p-3 bg-bg-surface border border-border-default rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-ink-primary flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-primary-600" />
              Demo Scenarios:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/fields/1/schedule"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                  currentFieldId === '1'
                    ? 'bg-primary-700 text-ink-inverse shadow-xs'
                    : 'bg-bg-subtle text-ink-secondary hover:text-ink-primary'
                }`}
              >
                1. Wheat (5 Splits • Basal + Topdress)
              </Link>
              <Link
                to="/fields/2/schedule"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                  currentFieldId === '2'
                    ? 'bg-primary-700 text-ink-inverse shadow-xs'
                    : 'bg-bg-subtle text-ink-secondary hover:text-ink-primary'
                }`}
              >
                2. Rice (Rain Delay Alert)
              </Link>
              <Link
                to="/fields/3/schedule"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-touch inline-flex items-center ${
                  currentFieldId === '3'
                    ? 'bg-primary-700 text-ink-inverse shadow-xs'
                    : 'bg-bg-subtle text-ink-secondary hover:text-ink-primary'
                }`}
              >
                3. Maize (Balanced 3-Stage)
              </Link>
            </div>
          </div>

          {/* Offline Fallback Banner */}
          {isOfflineFallback && (
            <OfflineNotice
              timestamp={cachedTimestamp}
              onRetry={loadScheduleData}
            />
          )}
        </div>

        {/* Loading State */}
        {loading && !rec && (
          <div className="space-y-4 animate-pulse">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* PRINTABLE SCHEDULE DOCUMENT (Optimized for 390px Mobile and A4 Paper Print) */}
        {/* ========================================================================= */}
        {rec && (
          <div className="space-y-6 bg-bg-surface border border-border-default rounded-2xl p-6 sm:p-8 shadow-xs print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
            
            {/* 1. Header: Farm, Field, Crop & Sowing Metadata */}
            <div className="border-b-2 border-ink-primary/15 pb-5 print:border-b-2 print:border-black print:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-primary-700 dark:text-primary-400 print:text-black">
                      KhetGPT • Agricultural Advisory Sheet
                    </span>
                    <span className="no-print">
                      <Badge variant="neutral" size="sm">
                        {rec.modelVersion}
                      </Badge>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight print:text-2xl print:text-black">
                    {field.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-ink-secondary print:text-black print:font-semibold">
                    <span className="inline-flex items-center gap-1 font-bold text-ink-primary print:text-black">
                      <Sprout className="w-3.5 h-3.5 text-primary-600 print:hidden" />
                      {t('fieldProfile.currentCrop')}: {formatCrop(rec.cropType)} ({formatVariety(rec.cropType, rec.cropVariety) || 'Standard'})
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-accent-amber print:hidden" />
                      {t('fieldProfile.area')}: {formatNumber(fieldArea)} {t('common.acres')}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-ink-muted print:hidden" />
                      {t('common.date')}: {formatDate(field.sowingDate)}
                    </span>
                  </div>
                </div>

                {/* Print button on top right of paper */}
                <div className="text-left sm:text-right shrink-0 print:text-right">
                  <div className="text-xs text-ink-muted print:text-black print:font-mono">
                    {t('common.date')}: {formatDate(rec.createdAt)}
                  </div>
                  {totalEstimatedCost != null && (
                    <div className="text-sm font-extrabold text-ink-primary print:text-black mt-1">
                      {t('recommendation.estimatedCost')}: {formatInr(totalEstimatedCost)}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Short Risk Note (Understandable without colour alone) */}
              <div className="mt-4 p-3.5 rounded-xl border border-border-default bg-bg-subtle print:border print:border-black print:bg-white flex items-start gap-2.5">
                <RiskIcon className="w-4 h-4 shrink-0 mt-0.5 text-ink-primary print:text-black" />
                <div className="text-xs leading-relaxed text-ink-primary print:text-black">
                  <strong className="uppercase font-bold tracking-wide block print:inline">
                    {riskDetails.printTag}{' '}
                  </strong>
                  <span>{riskDetails.desc}</span>
                </div>
              </div>
            </div>

            {/* 3. Dealer Order Slip / Fertilizer Input Summary Box */}
            <div className="dealer-slip p-5 rounded-xl border-2 border-primary-500/30 bg-primary-50/20 dark:bg-primary-950/10 print:border print:border-black print:bg-white space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary-500/20 dark:border-primary-800/40 pb-2 print:border-b print:border-black">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary-700 dark:text-primary-300 print:text-black" />
                  <h2 className="text-sm font-black text-ink-primary uppercase tracking-wider print:text-black">
                    Input Dealer Order Slip ({fieldArea} Acres Total)
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-ink-muted print:text-black">
                  Hand this sheet directly to your agro-dealer
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-default print:border-b print:border-black text-[11px] text-ink-muted print:text-black uppercase font-bold">
                      <th className="py-2 pr-3">{t('schedule.product')}</th>
                      <th className="py-2 px-3">{t('schedule.ratePerAcre')}</th>
                      <th className="py-2 px-3 font-extrabold text-ink-primary print:text-black">
                        {t('schedule.totalQuantity', { area: formatNumber(fieldArea, 1) })}
                      </th>
                      <th className="py-2 pl-3 font-black text-primary-700 dark:text-primary-300 print:text-black">
                        {t('schedule.bagEquivalent')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle print:divide-y print:divide-black">
                    {dealerSummary.map((item, idx) => (
                      <tr key={idx} className="print-stage-row">
                        <td className="py-2.5 pr-3 font-bold text-ink-primary print:text-black">
                          {item.name}
                          <span className="block text-[10px] text-ink-muted print:text-black font-normal">
                            {t('schedule.stagesLabel', { stages: item.stages.join(' + ') })}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-ink-secondary print:text-black">
                          {formatNumber(item.totalKgPerAcre, 1)} {t('common.kgPerAcre')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-ink-primary print:text-black">
                          {formatNumber(item.totalKg, 1)} {t('common.kg')}
                        </td>
                        <td className="py-2.5 pl-3 font-bold text-primary-700 dark:text-primary-300 print:text-black">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg-surface border border-border-default print:border-black print:px-0">
                            <Package className="w-3.5 h-3.5 text-primary-600 print:hidden" />
                            {calculateBags(item.type, item.totalKg, isHindi)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Chronological Application Schedule: What, How Much and When */}
            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-2 print:border-b print:border-black">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-600 print:text-black" />
                  <h2 className="text-sm font-black text-ink-primary uppercase tracking-wider print:text-black">
                    {t('schedule.timelineTitle', { count: formatNumber(rec.schedule?.length || 0) })}
                  </h2>
                </div>
                <span className="text-[11px] text-ink-muted print:text-black">
                  {t('schedule.readUnder30s')}
                </span>
              </div>

              {/* Stage-by-Stage Cards */}
              <div className="space-y-3">
                {rec.schedule?.map((item, idx) => {
                  const itemFieldTotalKg = (item.quantityKgPerAcre * fieldArea).toFixed(1)
                  const bagsFormatted = calculateBags(item.fertilizerType, Number(itemFieldTotalKg), isHindi)
                  const timingHint =
                    STAGE_TIMING_HINTS[item.stage?.toLowerCase()]?.[isHindi ? 'hi' : 'en'] ||
                    (isHindi ? 'फसल की आवश्यकता अनुसार निर्धारित समय पर डालें' : 'Apply as scheduled according to crop uptake window')
                  const isDelay = item.rainDelay || (item.rainDelayNote && item.rainDelayNote.length > 0)

                  return (
                    <div
                      key={idx}
                      className={`schedule-card p-4 rounded-xl border transition-all print:border print:border-black print:p-3 print:bg-white ${
                        isDelay
                          ? 'border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20'
                          : 'border-border-default bg-bg-surface'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        {/* Stage, Product & Timing */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-primary-300 print:bg-black print:text-white">
                              {t('schedule.splitNumber', { num: formatNumber(idx + 1) })} • {formatStage(item.stage)}
                            </span>
                            <span className="text-xs font-bold font-mono text-ink-primary print:text-black flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-ink-muted print:hidden" />
                              {t('schedule.applyByLabel', { date: formatDate(item.applyBy) })}
                            </span>
                            {isDelay && (
                              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300 print:border-black print:bg-white print:text-black flex items-center gap-1">
                                <CloudRain className="w-3 h-3 print:hidden" />
                                {t('schedule.rainHold')}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-extrabold text-ink-primary print:text-black">
                            {formatFertilizer(item.fertilizerType)}
                          </h3>

                          <p className="text-xs text-ink-secondary print:text-black italic">
                            {timingHint}
                          </p>

                          {item.rainDelayNote && (
                            <p className="text-xs font-bold text-blue-800 dark:text-blue-200 print:text-black print:font-bold">
                              {item.rainDelayNote}
                            </p>
                          )}
                        </div>

                        {/* Quantity in kg/acre and bags */}
                        <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border-subtle print:border-none">
                          <div className="text-lg font-black text-ink-primary print:text-black">
                            {formatNumber(item.quantityKgPerAcre, 1)}{' '}
                            <span className="text-xs font-bold text-ink-secondary print:text-black">
                              {t('common.kgPerAcre')}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-primary-700 dark:text-primary-300 print:text-black">
                            {t('schedule.kgForPlot', { count: formatNumber(Number(itemFieldTotalKg), 1) })}
                          </div>
                          <div className="text-xs font-mono text-ink-muted print:text-black">
                            ≈ {bagsFormatted}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 5. Bottom Instructions for Smallholder Farmer & Input Dealer */}
            <div className="pt-4 border-t-2 border-ink-primary/10 print:border-t-2 print:border-black print:pt-3 text-xs text-ink-secondary print:text-black space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px]">
                <span>
                  <strong>{t('schedule.fieldVerification')}:</strong> GPS Coordinates: {field.latitude || '28.6139'}° N, {field.longitude || '77.2090'}° E
                </span>
                <span>
                  <strong>{t('schedule.weatherProvenance')}:</strong> Open-Meteo ({rec.weatherSource === 'live' ? t('recommendation.liveWeather') : t('recommendation.staleWeather')})
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {t('schedule.footerInstructions')}
              </p>
            </div>

            {/* Print trigger button in document footer */}
            <div className="no-print pt-2 flex justify-end">
              <Button
                variant="outline"
                size="md"
                leftIcon={Printer}
                onClick={handlePrint}
              >
                {t('schedule.savePdf')}
              </Button>
            </div>

          </div>
        )}
      </div>
    </PageShell>
  )
}
