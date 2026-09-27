import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Sprout,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  Layers,
  FlaskConical,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  CloudSun,
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Toast from '../components/ui/Toast.jsx'
import useDocumentTitle from '../hooks/useDocumentTitle.js'
import { useFarmStore } from '../store/useFarmStore.js'
import CreateFarmModal from '../components/farms/CreateFarmModal.jsx'
import CreateFieldModal from '../components/farms/CreateFieldModal.jsx'
import DeleteFarmModal from '../components/farms/DeleteFarmModal.jsx'

export default function Dashboard() {
  useDocumentTitle('Farms & Fields — KhetGPT')

  const {
    farms,
    fields,
    isLoading,
    error,
    fetchFarms,
    fetchFields,
    clearError,
  } = useFarmStore()

  // Modals state
  const [isCreateFarmOpen, setIsCreateFarmOpen] = useState(false)
  const [isCreateFieldOpen, setIsCreateFieldOpen] = useState(false)
  const [selectedFarmForField, setSelectedFarmForField] = useState('')
  const [farmToDelete, setFarmToDelete] = useState(null)

  // Notification Toast state
  const [toast, setToast] = useState(null) // { variant: 'success'|'error', title, message }

  const showToast = useCallback((variant, title, message) => {
    setToast({ variant, title, message })
    setTimeout(() => {
      setToast((curr) => (curr?.title === title ? null : curr))
    }, 4500)
  }, [])

  // Initial load
  const loadData = useCallback(async () => {
    try {
      const loadedFarms = await fetchFarms()
      // Fetch all fields across loaded farms
      await Promise.all(
        loadedFarms.map((farm) => fetchFields(farm.id).catch(() => []))
      )
    } catch {
      // Error handled by store
    }
  }, [fetchFarms, fetchFields])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Helpers to calculate stats
  const totalFarms = farms.length
  const totalFields = fields.length
  const totalAcres = fields.reduce((acc, f) => acc + (Number(f.areaAcres) || 0), 0)

  const handleOpenCreateField = (farmId) => {
    setSelectedFarmForField(farmId || (farms[0]?.id ?? ''))
    setIsCreateFieldOpen(true)
  }

  return (
    <div className="space-y-6 py-2 max-w-7xl mx-auto">
      {/* Toast Notification Alert */}
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

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <Sprout className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
              Farm & Field Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
            My Land & Fields
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Manage your farms, configure field plot coordinates for Open-Meteo weather tracking, and access precision fertilizer recommendations.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsCreateFarmOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Farm</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            disabled={farms.length === 0}
            onClick={() => handleOpenCreateField()}
            className="flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>Add Field Plot</span>
          </Button>
        </div>
      </div>

      {/* 2. Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-risk-high-bg border border-risk-high-border text-sm text-risk-high-text flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              clearError()
              loadData()
            }}
            className="shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* 3. Summary Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-1">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
            Total Farms
          </span>
          <div className="text-2xl sm:text-3xl font-black text-ink-primary">
            {isLoading ? <Skeleton className="h-8 w-12" /> : totalFarms}
          </div>
          <span className="text-[11px] text-ink-muted">Registered agricultural holdings</span>
        </div>

        <div className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-1">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
            Field Plots
          </span>
          <div className="text-2xl sm:text-3xl font-black text-primary-600 dark:text-primary-400">
            {isLoading ? <Skeleton className="h-8 w-12" /> : totalFields}
          </div>
          <span className="text-[11px] text-ink-muted">Tracked plots with coordinates</span>
        </div>

        <div className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-1">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
            Total Area
          </span>
          <div className="text-2xl sm:text-3xl font-black text-ink-primary">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              `${totalAcres.toFixed(1)} `
            )}
            <span className="text-sm font-normal text-ink-muted">Acres</span>
          </div>
          <span className="text-[11px] text-ink-muted">Combined cultivation area</span>
        </div>

        <div className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-1">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
            Weather Tracking
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CloudSun className="w-6 h-6 text-emerald-500" />
            <span>Open-Meteo</span>
          </div>
          <span className="text-[11px] text-ink-muted">Live micro-forecast enabled</span>
        </div>
      </div>

      {/* 4. Loading State Skeleton */}
      {isLoading && farms.length === 0 && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border-default bg-bg-surface space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* 5. Empty State: No farms */}
      {!isLoading && farms.length === 0 && (
        <EmptyState
          icon={Sprout}
          title="No farms registered yet"
          description="Create your first farm profile to organize your land plots, monitor soil health, and receive precision fertilizer recommendations."
          action={
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsCreateFarmOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Farm</span>
            </Button>
          }
        />
      )}

      {/* 6. Farms and Fields List */}
      {!isLoading && farms.length > 0 && (
        <div className="space-y-8">
          {farms.map((farm) => {
            const farmFields = fields.filter((f) => String(f.farmId) === String(farm.id))

            return (
              <Card
                key={farm.id}
                className={`
                  p-5 sm:p-6 space-y-5 transition-all
                  ${farm._isOptimistic ? 'opacity-85 border-primary-300' : ''}
                `}
              >
                {/* Farm Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-ink-primary tracking-tight">
                        {farm.name}
                      </h2>
                      {farm._isOptimistic && (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Saving...
                        </span>
                      )}
                      <Badge variant="subtle">
                        {farmFields.length} {farmFields.length === 1 ? 'Field Plot' : 'Field Plots'}
                      </Badge>
                    </div>
                    <div className="text-xs text-ink-muted flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Registered{' '}
                        {farm.createdAt
                          ? new Date(farm.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recently'}
                      </span>
                    </div>
                  </div>

                  {/* Farm Level Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCreateField(farm.id)}
                      className="flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Field</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${farm.name}`}
                      onClick={() => setFarmToDelete(farm)}
                      className="text-ink-muted hover:text-risk-high-text"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Fields Grid inside this Farm */}
                {farmFields.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-border-default rounded-xl bg-bg-surface/40 space-y-2">
                    <p className="text-sm font-semibold text-ink-primary">
                      No field plots added to this farm yet.
                    </p>
                    <p className="text-xs text-ink-secondary max-w-md mx-auto">
                      Add a field plot with coordinates to calculate soil nutrient deficits and dated application schedules.
                    </p>
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenCreateField(farm.id)}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Field to {farm.name}</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {farmFields.map((field) => {
                      const hasCoords = field.latitude != null && field.longitude != null

                      return (
                        <div
                          key={field.id}
                          className={`
                            group rounded-xl border border-border-default bg-bg-surface hover:border-primary-400
                            hover:shadow-md transition-all duration-normal flex flex-col justify-between overflow-hidden
                            ${field._isOptimistic ? 'opacity-80 border-primary-200' : ''}
                          `}
                        >
                          {/* Top Card Info */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-base font-bold text-ink-primary group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                                  {field.name}
                                </h3>
                                <div className="text-xs text-ink-secondary font-medium mt-0.5">
                                  {field.areaAcres ? `${field.areaAcres} Acres` : 'Area not set'}
                                  {field.pincode && (
                                    <span className="text-ink-muted"> • Pin: {field.pincode}</span>
                                  )}
                                </div>
                              </div>
                              <span className="p-1 rounded-lg bg-bg-subtle text-ink-muted group-hover:text-primary-600 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                              </span>
                            </div>

                            {/* Crop & Stage Badges */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="neutral">
                                <Sprout className="w-3 h-3 mr-1 text-primary-600" />
                                <span className="capitalize">{field.cropType || 'Wheat'}</span>
                                {field.cropVariety && (
                                  <span className="text-ink-muted"> ({field.cropVariety})</span>
                                )}
                              </Badge>

                              <Badge variant="subtle">
                                <span className="capitalize">
                                  {field.growthStage?.replace(/_/g, ' ') || 'Sowing'}
                                </span>
                              </Badge>
                            </div>

                            {/* Location & Weather Coordinates */}
                            <div className="p-2.5 rounded-lg bg-bg-subtle/80 border border-border-default text-xs space-y-1">
                              <div className="flex items-center justify-between text-ink-secondary">
                                <span className="flex items-center gap-1 text-[11px] font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-primary-600" />
                                  <span>Coordinates:</span>
                                </span>
                                {hasCoords ? (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                    Weather Ready
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-600 font-semibold">
                                    Needs Location
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-ink-primary">
                                {hasCoords
                                  ? `${Number(field.latitude).toFixed(3)}° N, ${Number(field.longitude).toFixed(3)}° E`
                                  : 'Coordinates missing'}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="px-4 py-3 bg-bg-subtle/50 border-t border-border-default flex items-center justify-between gap-2">
                            <Link
                              to={`/fields/${field.id}`}
                              className="text-xs font-bold text-primary-700 dark:text-primary-300 hover:text-primary-800 hover:underline flex items-center gap-1"
                            >
                              <span>Field Profile</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>

                            <div className="flex items-center gap-2">
                              <Link
                                to={`/fields/${field.id}/soil`}
                                title="Soil Health Analysis"
                                className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-bg-surface border border-transparent hover:border-border-default transition-all"
                              >
                                <FlaskConical className="w-4 h-4" />
                              </Link>
                              <Link
                                to={`/fields/${field.id}/recommendation`}
                                title="Fertilizer Recommendation"
                                className="p-1.5 rounded-md text-primary-600 hover:text-primary-700 hover:bg-bg-surface border border-transparent hover:border-primary-200 transition-all"
                              >
                                <Sparkles className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <CreateFarmModal
        isOpen={isCreateFarmOpen}
        onClose={() => setIsCreateFarmOpen(false)}
        onSuccess={(newFarm) => {
          showToast('success', 'Farm Created', `Farm "${newFarm.name}" added successfully.`)
        }}
        onError={(errMsg) => {
          showToast('error', 'Action Rolled Back', errMsg)
        }}
      />

      <CreateFieldModal
        isOpen={isCreateFieldOpen}
        onClose={() => setIsCreateFieldOpen(false)}
        initialFarmId={selectedFarmForField}
        farms={farms}
        onSuccess={(newField) => {
          showToast('success', 'Field Registered', `Field "${newField.name}" created with weather coordinates.`)
        }}
        onError={(errMsg) => {
          showToast('error', 'Action Rolled Back', errMsg)
        }}
      />

      <DeleteFarmModal
        isOpen={!!farmToDelete}
        farm={farmToDelete}
        onClose={() => setFarmToDelete(null)}
        onSuccess={(msg) => {
          showToast('success', 'Farm Deleted', msg)
        }}
        onError={(errMsg) => {
          showToast('error', 'Deletion Failed', errMsg)
        }}
      />
    </div>
  )
}
