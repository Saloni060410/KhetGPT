import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  FlaskConical,
  Sprout,
  Calendar,
  History,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Info,
  Check,
  Scale,
  Clock,
  Layers,
  ShieldCheck,
  Plus,
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import FormField from '../components/ui/FormField.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import Toast from '../components/ui/Toast.jsx'
import * as endpoints from '../services/endpoints.js'
import { useFarmStore } from '../store/useFarmStore.js'

// The six soil fields fixed by the problem statement — never add, remove, or rename
const SOIL_FIELD_CONFIGS = [
  {
    key: 'n',
    label: 'Available Nitrogen (N)',
    unit: 'kg/ha',
    min: 0,
    max: 1500,
    step: '1',
    help: 'Available mineral nitrogen in root zone. Major driver of biomass, leafy growth, and chlorophyll synthesis.',
    placeholder: 'e.g. 210',
  },
  {
    key: 'p',
    label: 'Available Phosphorus (P)',
    unit: 'kg/ha',
    min: 0,
    max: 500,
    step: '0.1',
    help: 'Extractable phosphorus (P2O5 equivalent). Crucial for early root establishment and energy transfer.',
    placeholder: 'e.g. 14.5',
  },
  {
    key: 'k',
    label: 'Available Potassium (K)',
    unit: 'kg/ha',
    min: 0,
    max: 1000,
    step: '1',
    help: 'Exchangeable potassium (K2O equivalent). Enhances stalk strength, water regulation, and disease resistance.',
    placeholder: 'e.g. 180',
  },
  {
    key: 'ph',
    label: 'Soil pH',
    unit: 'pH scale (0 - 14)',
    min: 0,
    max: 14,
    step: '0.1',
    help: 'Soil reaction index. Dictates availability and solubility of essential macro and micronutrients.',
    placeholder: 'e.g. 7.2',
  },
  {
    key: 'organicCarbon',
    label: 'Organic Carbon',
    unit: '%',
    min: 0,
    max: 100,
    step: '0.01',
    help: 'Soil organic carbon (SOC) percentage. Boosts cation exchange capacity, microbial life, and moisture retention.',
    placeholder: 'e.g. 0.54',
  },
  {
    key: 'moisture',
    label: 'Soil Moisture',
    unit: '%',
    min: 0,
    max: 100,
    step: '0.1',
    help: 'Volumetric soil moisture level in the topsoil layer at time of test sampling.',
    placeholder: 'e.g. 38.0',
  },
]

/**
 * Computes soil rating (low, medium, high / acidic, neutral, alkaline)
 * STRICTLY from /reference/soil-ratings cutoffs, never from hardcoded numbers in the UI.
 */
function computeSoilRating(paramKey, value, soilRatings) {
  if (value === '' || value == null || isNaN(Number(value))) {
    return null
  }
  const num = Number(value)
  if (!soilRatings || !soilRatings[paramKey]) {
    return null
  }

  const ratingConfig = soilRatings[paramKey]

  // pH handling
  if (paramKey === 'ph') {
    const acidicBelow = ratingConfig.acidicBelow
    const alkalineAbove = ratingConfig.alkalineAbove
    if (acidicBelow != null && num < acidicBelow) {
      return {
        level: 'acidic',
        label: `Acidic (< ${acidicBelow} pH)`,
        variant: 'warning',
        icon: AlertTriangle,
        help: `Below ${acidicBelow} pH — acidic reaction can lock phosphorus and reduce microbial vitality.`,
      }
    }
    if (alkalineAbove != null && num > alkalineAbove) {
      return {
        level: 'alkaline',
        label: `Alkaline (> ${alkalineAbove} pH)`,
        variant: 'warning',
        icon: AlertTriangle,
        help: `Above ${alkalineAbove} pH — alkaline conditions cause micronutrient (Zn, Fe) fixation.`,
      }
    }
    return {
      level: 'neutral',
      label: `Optimal Neutral (${ratingConfig.optimal || '6.5 - 7.5'})`,
      variant: 'success',
      icon: ShieldCheck,
      help: `Optimal neutral range for balanced uptake of primary and secondary nutrients.`,
    }
  }

  // N, P, K, organicCarbon handling
  const lowBelow = ratingConfig.lowBelow
  const highAbove = ratingConfig.highAbove
  const unit = ratingConfig.unit || ''

  if (lowBelow != null && num < lowBelow) {
    return {
      level: 'low',
      label: `Low (< ${lowBelow} ${unit})`,
      variant: 'warning',
      icon: AlertTriangle,
      help: `Below ${lowBelow} ${unit} threshold. Crop demand requires supplementary fertilization.`,
    }
  }
  if (highAbove != null && num > highAbove) {
    return {
      level: 'high',
      label: `High (> ${highAbove} ${unit})`,
      variant: 'primary',
      icon: Info,
      help: `Above ${highAbove} ${unit} threshold. Good reserve; recommended dosage will be calibrated.`,
    }
  }
  if (lowBelow != null && highAbove != null) {
    return {
      level: 'medium',
      label: `Medium / Optimal (${lowBelow} - ${highAbove} ${unit})`,
      variant: 'success',
      icon: ShieldCheck,
      help: `Balanced sufficiency range. Meets baseline nutritional requirements.`,
    }
  }

  return null
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
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

export default function SoilInput() {
  const { fieldId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = searchParams.get('tab') || 'soil'
  const setTab = (tab) => {
    setSearchParams({ tab })
  }

  const { fetchField, updateField } = useFarmStore()

  // General Loading & Toast State
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Reference Data State (fetched from endpoints, NEVER hardcoded)
  const [referenceCrops, setReferenceCrops] = useState([])
  const [referenceRatings, setReferenceRatings] = useState(null)
  const [referenceFertilizers, setReferenceFertilizers] = useState([])
  const [fieldData, setFieldData] = useState(null)

  // Historical / Seeded Lists
  const [pastSoilTests, setPastSoilTests] = useState([])
  const [pastFertilizerLogs, setPastFertilizerLogs] = useState([])

  // 1. Soil Test Form State
  const [soilForm, setSoilForm] = useState({
    n: '',
    p: '',
    k: '',
    ph: '',
    organicCarbon: '',
    moisture: '',
    testedOn: new Date().toISOString().slice(0, 10),
  })
  const [soilErrors, setSoilErrors] = useState({})
  const [isSubmittingSoil, setIsSubmittingSoil] = useState(false)
  const [soilSubmitError, setSoilSubmitError] = useState(null)
  const [soilSubmitSuccess, setSoilSubmitSuccess] = useState(null)

  // 2. Crop & Stage Form State
  const [cropForm, setCropForm] = useState({
    cropType: '',
    cropVariety: '',
    growthStage: '',
    sowingDate: new Date().toISOString().slice(0, 10),
  })
  const [cropErrors, setCropErrors] = useState({})
  const [isSubmittingCrop, setIsSubmittingCrop] = useState(false)
  const [cropSubmitError, setCropSubmitError] = useState(null)
  const [cropSubmitSuccess, setCropSubmitSuccess] = useState(null)

  // 3. Fertilizer Log Form State
  const [logForm, setLogForm] = useState({
    type: '',
    quantityKgPerAcre: '',
    appliedOn: new Date().toISOString().slice(0, 10),
  })
  const [logErrors, setLogErrors] = useState({})
  const [isSubmittingLog, setIsSubmittingLog] = useState(false)
  const [logSubmitError, setLogSubmitError] = useState(null)
  const [logSubmitSuccess, setLogSubmitSuccess] = useState(null)

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Dynamic document title
  useEffect(() => {
    document.title = 'Data Entry & Soil Health — KhetGPT'
  }, [])

  // Initial Data Fetching via effect
  useEffect(() => {
    let isCancelled = false

    async function fetchData() {
      try {
        const [cropsRes, ratingsRes, fertsRes, fieldRes, logsRes, soilTestsRes] =
          await Promise.allSettled([
            endpoints.getReferenceCrops(),
            endpoints.getReferenceSoilRatings(),
            endpoints.getReferenceFertilizers(),
            fetchField(fieldId),
            endpoints.getFertilizerLogs(fieldId),
            endpoints.getSoilTests(fieldId),
          ])

        if (isCancelled) return

        // Handle Crops
        if (cropsRes.status === 'fulfilled' && cropsRes.value) {
          setReferenceCrops(cropsRes.value)
        }

        // Handle Ratings
        if (ratingsRes.status === 'fulfilled' && ratingsRes.value) {
          setReferenceRatings(ratingsRes.value)
        }

        // Handle Fertilizers
        if (fertsRes.status === 'fulfilled' && fertsRes.value) {
          setReferenceFertilizers(fertsRes.value)
        }

        // Handle Field Info
        if (fieldRes.status === 'fulfilled' && fieldRes.value) {
          const loadedField = fieldRes.value
          setFieldData(loadedField)

          // Initialize Crop Form from current field settings if present
          setCropForm({
            cropType: loadedField.cropType || '',
            cropVariety: loadedField.cropVariety || '',
            growthStage: loadedField.growthStage || '',
            sowingDate: loadedField.sowingDate
              ? loadedField.sowingDate.slice(0, 10)
              : new Date().toISOString().slice(0, 10),
          })

          // If field already has a latest soil test, pre-fill form as a helpful baseline
          if (loadedField.latestSoilTest) {
            setSoilForm({
              n: String(loadedField.latestSoilTest.n ?? ''),
              p: String(loadedField.latestSoilTest.p ?? ''),
              k: String(loadedField.latestSoilTest.k ?? ''),
              ph: String(loadedField.latestSoilTest.ph ?? ''),
              organicCarbon: String(loadedField.latestSoilTest.organicCarbon ?? ''),
              moisture: String(loadedField.latestSoilTest.moisture ?? ''),
              testedOn: loadedField.latestSoilTest.testedOn
                ? loadedField.latestSoilTest.testedOn.slice(0, 10)
                : new Date().toISOString().slice(0, 10),
            })
          }
        }

        // Handle Fertilizer Logs
        if (logsRes.status === 'fulfilled' && logsRes.value) {
          const logs =
            logsRes.value.items || (Array.isArray(logsRes.value) ? logsRes.value : [])
          setPastFertilizerLogs(logs)
        }

        // Handle Soil Tests History
        if (soilTestsRes.status === 'fulfilled' && soilTestsRes.value) {
          const tests =
            soilTestsRes.value.items ||
            (Array.isArray(soilTestsRes.value) ? soilTestsRes.value : [])
          setPastSoilTests(tests)
        }
      } catch (err) {
        if (!isCancelled) {
          setToast({
            variant: 'danger',
            title: 'Error loading field data',
            message: err.message || 'Could not fetch field and reference lists.',
          })
        }
      } finally {
        if (!isCancelled) {
          setIsInitialLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [fieldId, fetchField])

  // Look up selected crop definition from reference data
  const selectedCrop = useMemo(() => {
    return referenceCrops.find((c) => c.id === cropForm.cropType) || null
  }, [referenceCrops, cropForm.cropType])

  // Does the selected crop have varieties?
  const hasVarieties = useMemo(() => {
    return Boolean(
      selectedCrop &&
        Array.isArray(selectedCrop.varieties) &&
        selectedCrop.varieties.length > 0,
    )
  }, [selectedCrop])

  // Growth stages for selected crop
  const availableStages = useMemo(() => {
    if (!selectedCrop || !Array.isArray(selectedCrop.stages)) return []
    return [...selectedCrop.stages].sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [selectedCrop])

  // Calculate Days After Sowing (DAS)
  const dasDays = useMemo(() => {
    if (!cropForm.sowingDate) return null
    try {
      const sowing = new Date(cropForm.sowingDate)
      const now = new Date()
      const diffTime = now - sowing
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 ? diffDays : null
    } catch {
      return null
    }
  }, [cropForm.sowingDate])

  // -------------------------------------------------------------
  // 1. Soil Test Submission
  // -------------------------------------------------------------
  const validateSoilForm = () => {
    const errs = {}

    SOIL_FIELD_CONFIGS.forEach((cfg) => {
      const val = soilForm[cfg.key]
      if (val === '' || val == null) {
        errs[cfg.key] = `${cfg.label} is required`
      } else {
        const num = Number(val)
        if (isNaN(num)) {
          errs[cfg.key] = `${cfg.label} must be a valid number`
        } else if (num < cfg.min) {
          errs[cfg.key] = `${cfg.label} cannot be less than ${cfg.min}`
        } else if (num > cfg.max) {
          errs[cfg.key] = `${cfg.label} cannot exceed ${cfg.max}`
        }
      }
    })

    if (!soilForm.testedOn) {
      errs.testedOn = 'Test sampling date is required'
    } else if (soilForm.testedOn > todayStr) {
      errs.testedOn = 'Test date cannot be in the future'
    }

    setSoilErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSoilSubmit = async (e) => {
    e.preventDefault()
    setSoilSubmitError(null)
    setSoilSubmitSuccess(null)

    if (!validateSoilForm()) return

    setIsSubmittingSoil(true)
    const payload = {
      n: Number(soilForm.n),
      p: Number(soilForm.p),
      k: Number(soilForm.k),
      ph: Number(soilForm.ph),
      organicCarbon: Number(soilForm.organicCarbon),
      moisture: Number(soilForm.moisture),
      testedOn: soilForm.testedOn,
    }

    try {
      const createdTest = await endpoints.createSoilTest(fieldId, payload)
      setSoilSubmitSuccess('Soil test recorded successfully!')
      setToast({
        variant: 'success',
        title: 'Soil test saved',
        message: 'Your soil health parameters have been safely stored.',
      })

      // Add to local list and update field latest soil test
      setPastSoilTests((prev) => [createdTest, ...prev])
      setFieldData((prev) => (prev ? { ...prev, latestSoilTest: createdTest } : prev))

      // Refresh field in store to sync latest soil test
      fetchField(fieldId).catch(() => {})
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || 'Failed to record soil test'
      setSoilSubmitError(errorMsg)
      setToast({
        variant: 'danger',
        title: 'Save failed',
        message: errorMsg,
      })
    } finally {
      setIsSubmittingSoil(false)
    }
  }

  // -------------------------------------------------------------
  // 2. Crop & Stage Submission
  // -------------------------------------------------------------
  const validateCropForm = () => {
    const errs = {}
    if (!cropForm.cropType) {
      errs.cropType = 'Please select a crop'
    }
    if (!cropForm.growthStage) {
      errs.growthStage = 'Please select a growth stage'
    }
    if (!cropForm.sowingDate) {
      errs.sowingDate = 'Sowing date is required'
    }

    setCropErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCropSubmit = async (e) => {
    e.preventDefault()
    setCropSubmitError(null)
    setCropSubmitSuccess(null)

    if (!validateCropForm()) return

    setIsSubmittingCrop(true)
    const patchPayload = {
      cropType: cropForm.cropType,
      cropVariety: hasVarieties && cropForm.cropVariety ? cropForm.cropVariety : null,
      growthStage: cropForm.growthStage,
      sowingDate: cropForm.sowingDate,
    }

    try {
      const updatedField = await updateField(fieldId, patchPayload)
      setCropSubmitSuccess('Crop and growth stage details updated successfully!')
      setToast({
        variant: 'success',
        title: 'Crop updated',
        message: 'Crop type, variety, and growth stage saved.',
      })
      setFieldData((prev) => (prev ? { ...prev, ...updatedField } : updatedField))
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || 'Failed to update crop details'
      setCropSubmitError(errorMsg)
      setToast({
        variant: 'danger',
        title: 'Update failed',
        message: errorMsg,
      })
    } finally {
      setIsSubmittingCrop(false)
    }
  }

  // When crop type changes, reset variety if new crop lacks varieties
  const handleCropTypeChange = (e) => {
    const newCropId = e.target.value
    const newCrop = referenceCrops.find((c) => c.id === newCropId)
    const newHasVarieties = Boolean(
      newCrop && Array.isArray(newCrop.varieties) && newCrop.varieties.length > 0,
    )
    const firstStage = newCrop?.stages?.[0]?.id || ''

    setCropForm((prev) => ({
      ...prev,
      cropType: newCropId,
      cropVariety: newHasVarieties ? prev.cropVariety : '',
      growthStage: firstStage || prev.growthStage,
    }))
    if (cropErrors.cropType) {
      setCropErrors((prev) => ({ ...prev, cropType: undefined }))
    }
  }

  // -------------------------------------------------------------
  // 3. Fertilizer Log Submission
  // -------------------------------------------------------------
  const validateLogForm = () => {
    const errs = {}
    if (!logForm.type) {
      errs.type = 'Please select a fertilizer product'
    }
    if (!logForm.quantityKgPerAcre) {
      errs.quantityKgPerAcre = 'Quantity is required'
    } else {
      const q = Number(logForm.quantityKgPerAcre)
      if (isNaN(q) || q <= 0) {
        errs.quantityKgPerAcre = 'Quantity must be greater than 0 kg/acre'
      } else if (q > 1000) {
        errs.quantityKgPerAcre = 'Quantity seems unusually high (> 1000 kg/acre)'
      }
    }

    if (!logForm.appliedOn) {
      errs.appliedOn = 'Application date is required'
    } else if (logForm.appliedOn > todayStr) {
      errs.appliedOn = 'Application date cannot be in the future'
    }

    setLogErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleLogSubmit = async (e) => {
    e.preventDefault()
    setLogSubmitError(null)
    setLogSubmitSuccess(null)

    if (!validateLogForm()) return

    setIsSubmittingLog(true)
    const payload = {
      type: logForm.type,
      quantityKgPerAcre: Number(logForm.quantityKgPerAcre),
      appliedOn: logForm.appliedOn,
    }

    try {
      const createdLog = await endpoints.createFertilizerLog(fieldId, payload)
      setLogSubmitSuccess('Fertilizer application logged successfully!')
      setToast({
        variant: 'success',
        title: 'Fertilizer logged',
        message: `${payload.quantityKgPerAcre} kg/acre recorded on ${payload.appliedOn}.`,
      })

      // Add to past list
      setPastFertilizerLogs((prev) => [createdLog, ...prev])

      // Reset form but preserve appliedOn date for ease of multiple entries
      setLogForm((prev) => ({
        ...prev,
        type: '',
        quantityKgPerAcre: '',
      }))
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || 'Failed to log fertilizer application'
      setLogSubmitError(errorMsg)
      setToast({
        variant: 'danger',
        title: 'Logging failed',
        message: errorMsg,
      })
    } finally {
      setIsSubmittingLog(false)
    }
  }

  // Fertilizer product name lookup helper
  const getFertilizerName = (typeId) => {
    const match = referenceFertilizers.find((f) => f.id === typeId)
    return match ? match.name : typeId?.toUpperCase() || 'Custom Fertilizer'
  }

  // Readiness status check for "Get Recommendation"
  const hasSoilTest = Boolean(fieldData?.latestSoilTest || pastSoilTests.length > 0)
  const hasCropAndStage = Boolean(fieldData?.cropType && fieldData?.growthStage)
  const isReadyForRec = hasSoilTest && hasCropAndStage

  return (
    <div className="space-y-6 py-2 max-w-7xl mx-auto">
      {/* Toast Feedback */}
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

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/fields/${fieldId}`}
            className="inline-flex items-center text-xs font-semibold text-ink-muted hover:text-primary-700 transition-colors mb-1.5"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Back to Field Overview</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-primary font-heading tracking-tight">
              {fieldData?.name ? `${fieldData.name} — Data Entry` : 'Field Data Entry Flow'}
            </h1>
            <Badge variant="primary" size="md" icon={Layers}>
              FR3 – FR5 Setup
            </Badge>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Configure soil health parameters, crop variety & growth stage, and past fertilizer applications.
          </p>
        </div>

        {/* Action: Link to Recommendation */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={isReadyForRec ? 'primary' : 'secondary'}
            leftIcon={Sparkles}
            onClick={() => navigate(`/fields/${fieldId}/recommendation`)}
            className={isReadyForRec ? 'shadow-md shadow-primary-700/20' : ''}
            id="btn-goto-recommendation"
          >
            Get Recommendation
          </Button>
        </div>
      </div>

      {/* Recommendation Readiness Overview Card */}
      <Card
        className={`p-4 sm:p-5 border-2 transition-all ${
          isReadyForRec
            ? 'border-primary-500/30 bg-primary-50/20'
            : 'border-border-default bg-bg-surface'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Recommendation Prerequisites
              </span>
              {isReadyForRec ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-risk-low-text bg-risk-low-bg px-2 py-0.5 rounded-full border border-risk-low-border">
                  <Check className="w-3 h-3" /> Ready to Optimize
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-risk-med-text bg-risk-med-bg px-2 py-0.5 rounded-full border border-risk-med-border">
                  <AlertCircle className="w-3 h-3" /> Missing Prerequisite Data
                </span>
              )}
            </div>
            <p className="text-sm text-ink-secondary">
              {isReadyForRec
                ? 'All mandatory requirements are satisfied. The agronomic deficit model can now produce your dated application plan.'
                : 'Both a valid soil health test and current crop selection are required before generating an AI schedule.'}
            </p>
          </div>

          {/* 3 Step Status Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            {/* Step 1 Status */}
            <div
              onClick={() => setTab('soil')}
              className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors ${
                hasSoilTest
                  ? 'border-risk-low-border bg-risk-low-bg/40 text-risk-low-text hover:bg-risk-low-bg/60'
                  : 'border-border-default bg-bg-subtle text-ink-secondary hover:border-primary-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  hasSoilTest ? 'bg-risk-low-text text-white' : 'bg-bg-muted text-ink-muted'
                }`}
              >
                {hasSoilTest ? <Check className="w-3 h-3" /> : '1'}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">1. Soil Test</div>
                <div className="text-[11px] opacity-80 truncate">
                  {hasSoilTest
                    ? `Recorded (${fieldData?.latestSoilTest?.n || pastSoilTests[0]?.n || 0} N)`
                    : 'Needed'}
                </div>
              </div>
            </div>

            {/* Step 2 Status */}
            <div
              onClick={() => setTab('crop')}
              className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors ${
                hasCropAndStage
                  ? 'border-risk-low-border bg-risk-low-bg/40 text-risk-low-text hover:bg-risk-low-bg/60'
                  : 'border-border-default bg-bg-subtle text-ink-secondary hover:border-primary-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  hasCropAndStage ? 'bg-risk-low-text text-white' : 'bg-bg-muted text-ink-muted'
                }`}
              >
                {hasCropAndStage ? <Check className="w-3 h-3" /> : '2'}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">2. Crop & Stage</div>
                <div className="text-[11px] opacity-80 truncate">
                  {hasCropAndStage
                    ? `${fieldData?.cropType} (${fieldData?.growthStage})`
                    : 'Needed'}
                </div>
              </div>
            </div>

            {/* Step 3 Status */}
            <div
              onClick={() => setTab('fertilizer')}
              className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors ${
                pastFertilizerLogs.length > 0
                  ? 'border-risk-low-border bg-risk-low-bg/40 text-risk-low-text hover:bg-risk-low-bg/60'
                  : 'border-border-default bg-bg-subtle text-ink-secondary hover:border-primary-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  pastFertilizerLogs.length > 0
                    ? 'bg-risk-low-text text-white'
                    : 'bg-bg-muted text-ink-muted'
                }`}
              >
                {pastFertilizerLogs.length > 0 ? (
                  <Check className="w-3 h-3" />
                ) : (
                  '3'
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">3. Fertilizer Logs</div>
                <div className="text-[11px] opacity-80 truncate">
                  {pastFertilizerLogs.length > 0
                    ? `${pastFertilizerLogs.length} logs recorded`
                    : 'Optional credit'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border-default overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setTab('soil')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap min-h-touch ${
            currentTab === 'soil'
              ? 'border-primary-600 text-primary-700 bg-primary-50/50'
              : 'border-transparent text-ink-muted hover:text-ink-primary hover:border-border-default'
          }`}
          id="tab-btn-soil"
        >
          <FlaskConical className="w-4 h-4" />
          <span>Soil Health Parameters</span>
          {hasSoilTest && (
            <span className="w-2 h-2 rounded-full bg-risk-low-text" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab('crop')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap min-h-touch ${
            currentTab === 'crop'
              ? 'border-primary-600 text-primary-700 bg-primary-50/50'
              : 'border-transparent text-ink-muted hover:text-ink-primary hover:border-border-default'
          }`}
          id="tab-btn-crop"
        >
          <Sprout className="w-4 h-4" />
          <span>Crop, Variety & Stage</span>
          {hasCropAndStage && (
            <span className="w-2 h-2 rounded-full bg-risk-low-text" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab('fertilizer')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap min-h-touch ${
            currentTab === 'fertilizer'
              ? 'border-primary-600 text-primary-700 bg-primary-50/50'
              : 'border-transparent text-ink-muted hover:text-ink-primary hover:border-border-default'
          }`}
          id="tab-btn-fertilizer"
        >
          <History className="w-4 h-4" />
          <span>Prior Fertilizer Logs</span>
          {pastFertilizerLogs.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary-100 text-primary-800 font-bold">
              {pastFertilizerLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* Loading Skeletons */}
      {isInitialLoading && (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 1: SOIL HEALTH PARAMETERS (FR3)                            */}
      {/* ============================================================= */}
      {!isInitialLoading && currentTab === 'soil' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-border-default mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-primary-600" />
                      Record Soil Test Results
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Fixed six-parameter soil test defined by PRD FR3. Live ratings calculated from reference cutoffs.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-bg-subtle text-ink-secondary border border-border-default">
                    POST /fields/:id/soil-tests
                  </span>
                </div>

                {/* Submit Error Banner (Input Preserved) */}
                {soilSubmitError && (
                  <div
                    role="alert"
                    className="p-4 mb-6 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high-text text-sm flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Unable to record soil test</div>
                      <div className="text-xs mt-0.5">{soilSubmitError}</div>
                    </div>
                  </div>
                )}

                {/* Submit Success Banner */}
                {soilSubmitSuccess && (
                  <div
                    role="status"
                    className="p-4 mb-6 rounded-xl bg-risk-low-bg border border-risk-low-border text-risk-low-text text-sm flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span className="font-semibold">{soilSubmitSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSoilSubmit} className="space-y-6">
                  {/* Sampling Date */}
                  <div className="max-w-xs">
                    <FormField
                      id="soil-testedOn"
                      label="Sample Collection Date"
                      required
                      hint="Date the laboratory or handheld soil sample was tested."
                      error={soilErrors.testedOn}
                    >
                      <Input
                        type="date"
                        max={todayStr}
                        value={soilForm.testedOn}
                        onChange={(e) => {
                          setSoilForm((prev) => ({ ...prev, testedOn: e.target.value }))
                          if (soilErrors.testedOn) {
                            setSoilErrors((prev) => ({ ...prev, testedOn: undefined }))
                          }
                        }}
                      />
                    </FormField>
                  </div>

                  {/* The Six Fixed Soil Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {SOIL_FIELD_CONFIGS.map((cfg) => {
                      const rating = computeSoilRating(
                        cfg.key,
                        soilForm[cfg.key],
                        referenceRatings,
                      )
                      const RatingIcon = rating?.icon

                      return (
                        <div
                          key={cfg.key}
                          className="p-4 rounded-xl border border-border-default bg-bg-base/60 space-y-2 hover:border-border-strong transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-ink-primary">
                              {cfg.label}
                            </span>
                            <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                              {cfg.unit}
                            </span>
                          </div>

                          <FormField
                            id={`soil-${cfg.key}`}
                            error={soilErrors[cfg.key]}
                          >
                            <Input
                              type="number"
                              min={cfg.min}
                              max={cfg.max}
                              step={cfg.step}
                              placeholder={cfg.placeholder}
                              value={soilForm[cfg.key]}
                              onChange={(e) => {
                                const val = e.target.value
                                setSoilForm((prev) => ({ ...prev, [cfg.key]: val }))
                                if (soilErrors[cfg.key]) {
                                  setSoilErrors((prev) => ({
                                    ...prev,
                                    [cfg.key]: undefined,
                                  }))
                                }
                              }}
                            />
                          </FormField>

                          {/* Dynamic Rating Feedback Chip */}
                          {rating && (
                            <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-fast">
                              <Badge
                                variant={rating.variant}
                                size="sm"
                                icon={RatingIcon}
                              >
                                {rating.label}
                              </Badge>
                              <span className="text-[11px] text-ink-muted truncate">
                                {rating.help}
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-ink-muted pt-0.5 leading-relaxed">
                            {cfg.help}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Submission Row */}
                  <div className="pt-4 border-t border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-ink-muted flex items-center gap-1.5">
                      <Info className="w-4 h-4 shrink-0 text-ink-muted" />
                      <span>
                        Values are validated against agronomic boundaries before saving.
                      </span>
                    </p>

                    <div className="flex items-center gap-3">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmittingSoil}
                        disabled={isSubmittingSoil}
                        leftIcon={Check}
                        id="btn-save-soil-test"
                      >
                        {isSubmittingSoil ? 'Recording Test...' : 'Save Soil Test'}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        rightIcon={ArrowRight}
                        onClick={() => setTab('crop')}
                      >
                        Next: Crop & Stage
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            </div>

            {/* Sidebar Column: Reference Ratings & Test History */}
            <div className="space-y-6">
              {/* Reference Cutoffs Card (Read from API) */}
              <Card className="p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-border-default mb-4">
                  <Scale className="w-4 h-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-ink-primary">
                    Reference Rating Cutoffs
                  </h3>
                </div>
                <p className="text-xs text-ink-muted mb-3">
                  Live thresholds served from <code>/reference/soil-ratings</code> used to evaluate nutrient sufficiency.
                </p>

                {referenceRatings ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-bg-subtle border border-border-default">
                      <div className="font-semibold text-ink-primary flex justify-between">
                        <span>Nitrogen (N)</span>
                        <span className="text-ink-muted">kg/ha</span>
                      </div>
                      <div className="flex justify-between text-ink-secondary mt-1">
                        <span>Low: &lt; {referenceRatings.n?.lowBelow}</span>
                        <span>High: &gt; {referenceRatings.n?.highAbove}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-bg-subtle border border-border-default">
                      <div className="font-semibold text-ink-primary flex justify-between">
                        <span>Phosphorus (P)</span>
                        <span className="text-ink-muted">kg/ha</span>
                      </div>
                      <div className="flex justify-between text-ink-secondary mt-1">
                        <span>Low: &lt; {referenceRatings.p?.lowBelow}</span>
                        <span>High: &gt; {referenceRatings.p?.highAbove}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-bg-subtle border border-border-default">
                      <div className="font-semibold text-ink-primary flex justify-between">
                        <span>Potassium (K)</span>
                        <span className="text-ink-muted">kg/ha</span>
                      </div>
                      <div className="flex justify-between text-ink-secondary mt-1">
                        <span>Low: &lt; {referenceRatings.k?.lowBelow}</span>
                        <span>High: &gt; {referenceRatings.k?.highAbove}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-bg-subtle border border-border-default">
                      <div className="font-semibold text-ink-primary flex justify-between">
                        <span>Organic Carbon (SOC)</span>
                        <span className="text-ink-muted">%</span>
                      </div>
                      <div className="flex justify-between text-ink-secondary mt-1">
                        <span>Low: &lt; {referenceRatings.organicCarbon?.lowBelow}%</span>
                        <span>High: &gt; {referenceRatings.organicCarbon?.highAbove}%</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-bg-subtle border border-border-default">
                      <div className="font-semibold text-ink-primary flex justify-between">
                        <span>Soil Reaction (pH)</span>
                        <span className="text-ink-muted">scale</span>
                      </div>
                      <div className="flex justify-between text-ink-secondary mt-1">
                        <span>Acidic: &lt; {referenceRatings.ph?.acidicBelow}</span>
                        <span>Alkaline: &gt; {referenceRatings.ph?.alkalineAbove}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Skeleton className="h-40 rounded-lg" />
                )}
              </Card>

              {/* Past Soil Tests Card */}
              <Card className="p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border-default mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary-600" />
                    <h3 className="text-sm font-bold text-ink-primary">
                      Test Records for Field
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-bg-muted text-ink-secondary">
                    {pastSoilTests.length} tests
                  </span>
                </div>

                {pastSoilTests.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {pastSoilTests.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="p-3 rounded-lg border border-border-default bg-bg-surface text-xs space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-ink-primary">
                            Sample {formatDate(t.testedOn || t.createdAt)}
                          </span>
                          {idx === 0 && (
                            <Badge variant="primary" size="sm">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-ink-secondary pt-1">
                          <div>
                            <span className="text-ink-muted">N:</span> {t.n} kg/ha
                          </div>
                          <div>
                            <span className="text-ink-muted">P:</span> {t.p} kg/ha
                          </div>
                          <div>
                            <span className="text-ink-muted">K:</span> {t.k} kg/ha
                          </div>
                          <div>
                            <span className="text-ink-muted">pH:</span> {t.ph}
                          </div>
                          <div>
                            <span className="text-ink-muted">SOC:</span> {t.organicCarbon}%
                          </div>
                          <div>
                            <span className="text-ink-muted">Moist:</span> {t.moisture}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-ink-muted">
                    No soil test records stored yet.
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: CROP, VARIETY & GROWTH STAGE (FR4)                      */}
      {/* ============================================================= */}
      {!isInitialLoading && currentTab === 'crop' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-border-default mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-primary-600" />
                      Configure Crop, Variety & Growth Stage
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Populated dynamically from <code>/reference/crops</code>. Variety selector appears only when crop supports varieties.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-bg-subtle text-ink-secondary border border-border-default">
                    PATCH /fields/:id
                  </span>
                </div>

                {/* Submit Error Banner (Input Preserved) */}
                {cropSubmitError && (
                  <div
                    role="alert"
                    className="p-4 mb-6 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high-text text-sm flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Unable to update crop details</div>
                      <div className="text-xs mt-0.5">{cropSubmitError}</div>
                    </div>
                  </div>
                )}

                {/* Submit Success Banner */}
                {cropSubmitSuccess && (
                  <div
                    role="status"
                    className="p-4 mb-6 rounded-xl bg-risk-low-bg border border-risk-low-border text-risk-low-text text-sm flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span className="font-semibold">{cropSubmitSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCropSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Crop Chooser */}
                    <FormField
                      id="crop-cropType"
                      label="Target Crop"
                      required
                      hint="Choose the active crop planted or scheduled for this field."
                      error={cropErrors.cropType}
                    >
                      <Select
                        value={cropForm.cropType}
                        onChange={handleCropTypeChange}
                        placeholder="Select Crop Type"
                      >
                        {referenceCrops.map((crop) => (
                          <option key={crop.id} value={crop.id}>
                            {crop.nameEn} {crop.nameHi ? `(${crop.nameHi})` : ''}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    {/* 2. Variety Chooser (Rendered ONLY when crop has varieties) */}
                    {hasVarieties ? (
                      <div className="animate-in fade-in duration-fast">
                        <FormField
                          id="crop-cropVariety"
                          label="Crop Variety"
                          hint="Optional variety identifier. Leave empty if uncertified or local seed."
                        >
                          <Select
                            value={cropForm.cropVariety}
                            onChange={(e) =>
                              setCropForm((prev) => ({
                                ...prev,
                                cropVariety: e.target.value,
                              }))
                            }
                            placeholder="Select Variety (Optional)"
                          >
                            <option value="">No specific variety / Leave empty</option>
                            {selectedCrop.varieties.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.nameEn} {v.nameHi ? `(${v.nameHi})` : ''}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-border-default bg-bg-subtle/50 flex items-center gap-3 text-xs text-ink-muted">
                        <Info className="w-4 h-4 shrink-0 text-ink-muted" />
                        <span>
                          {cropForm.cropType
                            ? `Selected crop (${selectedCrop?.nameEn || cropForm.cropType}) has no specific cultivar varieties registered.`
                            : 'Select a crop to view available variety options.'}
                        </span>
                      </div>
                    )}

                    {/* 3. Growth Stage Chooser */}
                    <FormField
                      id="crop-growthStage"
                      label="Current Growth Stage"
                      required
                      hint="Stage of crop development dictates nutrient uptake fraction."
                      error={cropErrors.growthStage}
                    >
                      <Select
                        value={cropForm.growthStage}
                        onChange={(e) => {
                          setCropForm((prev) => ({ ...prev, growthStage: e.target.value }))
                          if (cropErrors.growthStage) {
                            setCropErrors((prev) => ({
                              ...prev,
                              growthStage: undefined,
                            }))
                          }
                        }}
                        placeholder="Select Growth Stage"
                      >
                        {availableStages.length > 0 ? (
                          availableStages.map((stg) => (
                            <option key={stg.id} value={stg.id}>
                              {stg.order ? `${stg.order}. ` : ''}
                              {stg.nameEn} {stg.nameHi ? `(${stg.nameHi})` : ''}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            Select a crop first
                          </option>
                        )}
                      </Select>
                    </FormField>

                    {/* 4. Sowing Date */}
                    <FormField
                      id="crop-sowingDate"
                      label="Sowing Date"
                      required
                      hint="Date seed was sown or transplanted into this plot."
                      error={cropErrors.sowingDate}
                    >
                      <Input
                        type="date"
                        value={cropForm.sowingDate}
                        onChange={(e) => {
                          setCropForm((prev) => ({ ...prev, sowingDate: e.target.value }))
                          if (cropErrors.sowingDate) {
                            setCropErrors((prev) => ({
                              ...prev,
                              sowingDate: undefined,
                            }))
                          }
                        }}
                      />
                    </FormField>
                  </div>

                  {/* Sowing Timeline Helper */}
                  {dasDays != null && (
                    <div className="p-3 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-between text-xs text-primary-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary-700" />
                        <span>
                          Crop timeline: <strong>{dasDays} Days After Sowing (DAS)</strong>
                        </span>
                      </div>
                      <Badge variant="primary" size="sm">
                        Day {dasDays}
                      </Badge>
                    </div>
                  )}

                  {/* Submit Row */}
                  <div className="pt-4 border-t border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-ink-muted">
                      Updates the agronomic profile stored on the field.
                    </p>

                    <div className="flex items-center gap-3">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmittingCrop}
                        disabled={isSubmittingCrop}
                        leftIcon={Check}
                        id="btn-save-crop"
                      >
                        {isSubmittingCrop ? 'Saving Crop Info...' : 'Update Field Crop'}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        rightIcon={ArrowRight}
                        onClick={() => setTab('fertilizer')}
                      >
                        Next: Fertilizer Logs
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            </div>

            {/* Sidebar Column: Selected Crop Information */}
            <div className="space-y-6">
              <Card className="p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-border-default mb-4">
                  <Sprout className="w-4 h-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-ink-primary">
                    Crop Staging Reference
                  </h3>
                </div>

                {selectedCrop ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-ink-muted">Selected Crop</div>
                      <div className="text-base font-bold text-ink-primary">
                        {selectedCrop.nameEn}
                        {selectedCrop.nameHi && (
                          <span className="text-sm text-primary-700 font-normal ml-1">
                            ({selectedCrop.nameHi})
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-ink-muted mb-1.5">
                        Growth Stages ({availableStages.length})
                      </div>
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {availableStages.map((stg) => {
                          const isCurrent = cropForm.growthStage === stg.id
                          return (
                            <div
                              key={stg.id}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                isCurrent
                                  ? 'bg-primary-100/70 border border-primary-300 text-primary-900 font-semibold'
                                  : 'bg-bg-subtle text-ink-secondary'
                              }`}
                            >
                              <span>
                                {stg.order}. {stg.nameEn}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] bg-primary-600 text-white px-1.5 py-0.5 rounded font-bold">
                                  Current
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-ink-muted py-6 text-center">
                    Select a crop to preview developmental stages and variety details.
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: PRIOR FERTILIZER LOGS (FR5)                            */}
      {/* ============================================================= */}
      {!isInitialLoading && currentTab === 'fertilizer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-border-default mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary-600" />
                      Log Fertilizer Application
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Record previously applied fertilizers. Credited by the deficit model so you never over-apply nutrients.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-bg-subtle text-ink-secondary border border-border-default">
                    POST /fields/:id/fertilizer-logs
                  </span>
                </div>

                {/* Submit Error Banner (Input Preserved) */}
                {logSubmitError && (
                  <div
                    role="alert"
                    className="p-4 mb-6 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high-text text-sm flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Unable to record fertilizer application</div>
                      <div className="text-xs mt-0.5">{logSubmitError}</div>
                    </div>
                  </div>
                )}

                {/* Submit Success Banner */}
                {logSubmitSuccess && (
                  <div
                    role="status"
                    className="p-4 mb-6 rounded-xl bg-risk-low-bg border border-risk-low-border text-risk-low-text text-sm flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span className="font-semibold">{logSubmitSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleLogSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 1. Fertilizer Product Chooser */}
                    <div className="md:col-span-1">
                      <FormField
                        id="log-type"
                        label="Fertilizer Product"
                        required
                        hint="Product applied to field"
                        error={logErrors.type}
                      >
                        <Select
                          value={logForm.type}
                          onChange={(e) => {
                            setLogForm((prev) => ({ ...prev, type: e.target.value }))
                            if (logErrors.type) {
                              setLogErrors((prev) => ({ ...prev, type: undefined }))
                            }
                          }}
                          placeholder="Select Product"
                        >
                          {referenceFertilizers.map((fert) => (
                            <option key={fert.id} value={fert.id}>
                              {fert.name}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    </div>

                    {/* 2. Quantity (kg/acre) */}
                    <div className="md:col-span-1">
                      <FormField
                        id="log-quantity"
                        label="Quantity (kg/acre)"
                        required
                        hint="Dosage rate per acre"
                        error={logErrors.quantityKgPerAcre}
                      >
                        <Input
                          type="number"
                          min="0.1"
                          max="1000"
                          step="0.1"
                          placeholder="e.g. 50"
                          value={logForm.quantityKgPerAcre}
                          onChange={(e) => {
                            setLogForm((prev) => ({
                              ...prev,
                              quantityKgPerAcre: e.target.value,
                            }))
                            if (logErrors.quantityKgPerAcre) {
                              setLogErrors((prev) => ({
                                ...prev,
                                quantityKgPerAcre: undefined,
                              }))
                            }
                          }}
                        />
                      </FormField>
                    </div>

                    {/* 3. Applied Date (Cannot be future) */}
                    <div className="md:col-span-1">
                      <FormField
                        id="log-appliedOn"
                        label="Application Date"
                        required
                        hint="Cannot be in the future"
                        error={logErrors.appliedOn}
                      >
                        <Input
                          type="date"
                          max={todayStr}
                          value={logForm.appliedOn}
                          onChange={(e) => {
                            setLogForm((prev) => ({ ...prev, appliedOn: e.target.value }))
                            if (logErrors.appliedOn) {
                              setLogErrors((prev) => ({
                                ...prev,
                                appliedOn: undefined,
                              }))
                            }
                          }}
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Submission Row */}
                  <div className="pt-4 border-t border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-ink-muted">
                      Applications within the seasonal credit window reduce deficit requirements.
                    </p>

                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmittingLog}
                      disabled={isSubmittingLog}
                      leftIcon={Plus}
                      id="btn-add-fertilizer-log"
                    >
                      {isSubmittingLog ? 'Recording Log...' : 'Record Application Log'}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Past Applications Table */}
              <Card className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-border-default mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary-600" />
                    <h3 className="text-base font-bold text-ink-primary">
                      Past Fertilizer Applications
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-bg-subtle text-ink-secondary border border-border-default">
                    GET /fields/:id/fertilizer-logs
                  </span>
                </div>

                {pastFertilizerLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-ink-primary border-collapse">
                      <thead>
                        <tr className="border-b border-border-default text-xs uppercase text-ink-muted bg-bg-subtle/50">
                          <th className="py-3 px-3">Date Applied</th>
                          <th className="py-3 px-3">Fertilizer Product</th>
                          <th className="py-3 px-3 text-right">Dosage (kg/acre)</th>
                          <th className="py-3 px-3 text-right">Field Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {pastFertilizerLogs.map((log, index) => {
                          const area = fieldData?.areaAcres || 1.0
                          const totalKg = (
                            Number(log.quantityKgPerAcre) * Number(area)
                          ).toFixed(1)

                          return (
                            <tr
                              key={log.id || index}
                              className="hover:bg-bg-subtle/40 transition-colors"
                            >
                              <td className="py-3 px-3 text-xs font-semibold text-ink-secondary whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-ink-muted" />
                                  <span>{formatDate(log.appliedOn || log.createdAt)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-ink-primary">
                                {getFertilizerName(log.type)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-primary-700">
                                {log.quantityKgPerAcre} kg/acre
                              </td>
                              <td className="py-3 px-3 text-right text-xs text-ink-muted">
                                {totalKg} kg ({area} ac)
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-ink-muted space-y-2">
                    <History className="w-8 h-8 text-ink-muted/50 mx-auto" />
                    <div>No prior fertilizer applications logged yet for this field.</div>
                    <p className="text-xs text-ink-muted">
                      Use the form above to record past applications if any fertilizer was applied this season.
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar Column: Available Fertilizer Catalog */}
            <div className="space-y-6">
              <Card className="p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-border-default mb-4">
                  <Scale className="w-4 h-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-ink-primary">
                    Fertilizer Reference Catalog
                  </h3>
                </div>
                <p className="text-xs text-ink-muted mb-3">
                  Products served from <code>/reference/fertilizers</code> with standard NPK grade composition.
                </p>

                <div className="space-y-3">
                  {referenceFertilizers.map((fert) => (
                    <div
                      key={fert.id}
                      className="p-3 rounded-lg border border-border-default bg-bg-subtle/60 text-xs space-y-1.5"
                    >
                      <div className="font-bold text-ink-primary flex justify-between items-center">
                        <span>{fert.name}</span>
                        {fert.priceInrPerKg != null && (
                          <span className="text-[11px] text-ink-muted font-normal">
                            ₹{fert.priceInrPerKg}/kg
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-bg-surface border border-border-default text-primary-800 font-semibold">
                          N: {fert.nPct ?? 0}%
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-bg-surface border border-border-default text-primary-800 font-semibold">
                          P₂O₅: {fert.p2o5Pct ?? 0}%
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-bg-surface border border-border-default text-primary-800 font-semibold">
                          K₂O: {fert.k2oPct ?? 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Ready to Optimize CTA Card */}
              <Card className="p-5 border-2 border-primary-500/20 bg-primary-50/30">
                <div className="flex items-center gap-2 mb-2 text-primary-800 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  <span>Ready for Optimization?</span>
                </div>
                <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
                  When you have entered your soil analysis and configured your crop, proceed to generate the tailored fertilizer schedule.
                </p>
                <Button
                  variant="primary"
                  className="w-full justify-center shadow-md shadow-primary-700/20"
                  rightIcon={ArrowRight}
                  onClick={() => navigate(`/fields/${fieldId}/recommendation`)}
                >
                  Generate Recommendation
                </Button>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
