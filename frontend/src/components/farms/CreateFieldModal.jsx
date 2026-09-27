import { useState, useEffect, useMemo } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import FormField from '../ui/FormField.jsx'
import LocationPicker from './LocationPicker.jsx'
import { useFarmStore } from '../../store/useFarmStore.js'
import * as endpoints from '../../services/endpoints.js'
import { Layers, MapPin, Hash, Sparkles } from 'lucide-react'

function CreateFieldForm({
  initialFarmId = '',
  farms = [],
  onClose,
  onSuccess,
  onError,
}) {
  const { createFieldOptimistic } = useFarmStore()

  // Reference crops fetched dynamically
  const [crops, setCrops] = useState([])

  useEffect(() => {
    let active = true
    endpoints.getReferenceCrops().then((res) => {
      if (active && Array.isArray(res)) {
        setCrops(res)
      }
    }).catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Form State initialized without effects
  const [selectedFarmId, setSelectedFarmId] = useState(
    initialFarmId || (farms.length > 0 ? farms[0].id : '')
  )
  const [name, setName] = useState('')
  const [areaAcres, setAreaAcres] = useState('2.0')
  const [pincode, setPincode] = useState('')
  const [cropType, setCropType] = useState('wheat')
  const [cropVariety, setCropVariety] = useState('')
  const [growthStage, setGrowthStage] = useState('sowing')
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().slice(0, 10))

  // Selected crop & stages from reference data
  const currentCrop = useMemo(() => crops.find((c) => c.id === cropType), [crops, cropType])
  const currentStages = useMemo(() => currentCrop?.stages || [], [currentCrop])
  const hasVarieties = Boolean(currentCrop?.varieties && currentCrop.varieties.length > 0)

  // Location State
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [placeName, setPlaceName] = useState('')

  // Validation / Submission State
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLocationChange = ({ latitude: lat, longitude: lng, placeName: nameLabel }) => {
    setLatitude(lat)
    setLongitude(lng)
    setPlaceName(nameLabel)
    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: null }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!selectedFarmId) {
      errs.farmId = 'Please select a parent farm.'
    }
    if (!name.trim()) {
      errs.name = 'Field name is required.'
    } else if (name.trim().length < 2) {
      errs.name = 'Field name must be at least 2 characters.'
    }

    const acres = parseFloat(areaAcres)
    if (isNaN(acres) || acres <= 0) {
      errs.areaAcres = 'Enter a valid field area in acres.'
    }

    // Coordinates required for weather
    if (latitude == null || longitude == null) {
      errs.location = 'Field coordinates (latitude and longitude) are required for weather forecasts.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        areaAcres: parseFloat(areaAcres),
        latitude: Number(latitude),
        longitude: Number(longitude),
        pincode: pincode.trim() || undefined,
        cropType,
        cropVariety: cropVariety.trim() || undefined,
        growthStage,
        sowingDate,
      }

      // Optimistic create handles adding field to store immediately and rolling back if failed
      const createdField = await createFieldOptimistic(selectedFarmId, payload)
      onClose?.()
      onSuccess?.(createdField)
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create field'
      setErrors((prev) => ({ ...prev, server: msg }))
      onError?.(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-1">
      {errors.server && (
        <div className="p-3 rounded-lg bg-risk-high-bg border border-risk-high-border text-xs text-risk-high-text">
          {errors.server}
        </div>
      )}

      {/* 1. Farm Selection */}
      <FormField label="Parent Farm" required error={errors.farmId}>
        <Select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          disabled={farms.length <= 1 && !!initialFarmId}
        >
          {farms.length === 0 && <option value="">No farms available</option>}
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>

      {/* 2. Basic Plot Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Field Name"
          hint="e.g. North Khet (Plot 04)"
          required
          error={errors.name}
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="Field or plot name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }))
              }}
              className="pl-9"
            />
            <Layers className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          </div>
        </FormField>

        <FormField
          label="Area in Acres"
          hint="Plot size for total dosage calculation"
          required
          error={errors.areaAcres}
        >
          <Input
            type="number"
            step="0.1"
            min="0.1"
            placeholder="e.g. 2.5"
            value={areaAcres}
            onChange={(e) => {
              setAreaAcres(e.target.value)
              if (errors.areaAcres) setErrors((prev) => ({ ...prev, areaAcres: null }))
            }}
          />
        </FormField>
      </div>

      {/* 3. Location Picker (Coordinates required for weather) */}
      <div className="pt-2 border-t border-border-default space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary-600" />
            <span>Plot Location & Coordinates</span>
            <span className="text-risk-high-text font-normal">*</span>
          </span>
          <span className="text-xs text-ink-muted">Required for weather sync</span>
        </div>

        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          placeName={placeName}
          onChange={handleLocationChange}
          error={errors.location}
        />
      </div>

      {/* 4. Pincode Label (Explicitly labeled as optional label only, never turned into coords) */}
      <div className="pt-2 border-t border-border-default">
        <FormField
          label="Postal Pincode (Optional Label)"
          hint="Label only for postal records. Open-Meteo weather uses coordinates above, not pincode."
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="e.g. 132001 (optional label)"
              value={pincode}
              maxLength={10}
              onChange={(e) => setPincode(e.target.value)}
              className="pl-9"
            />
            <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          </div>
        </FormField>
      </div>

      {/* 5. Crop & Agronomy Details */}
      <div className="pt-2 border-t border-border-default space-y-3">
        <span className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary-600" />
          <span>Crop & Sowing Plan</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Crop Type">
            <Select
              value={cropType}
              onChange={(e) => {
                const newCropId = e.target.value
                setCropType(newCropId)
                const c = crops.find((item) => item.id === newCropId)
                if (c?.stages?.[0]?.id) setGrowthStage(c.stages[0].id)
                if (!c?.varieties || c.varieties.length === 0) setCropVariety('')
              }}
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn} {c.nameHi ? `(${c.nameHi})` : ''}
                </option>
              ))}
            </Select>
          </FormField>

          {hasVarieties && (
            <FormField label="Crop Variety (Optional)" hint="e.g. HD-2967, PBW-343">
              <Select
                value={cropVariety}
                onChange={(e) => setCropVariety(e.target.value)}
              >
                <option value="">No specific variety / Leave empty</option>
                {currentCrop.varieties.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nameEn} {v.nameHi ? `(${v.nameHi})` : ''}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label="Current Growth Stage">
            <Select value={growthStage} onChange={(e) => setGrowthStage(e.target.value)}>
              {currentStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.order ? `${s.order}. ` : ''}{s.nameEn} {s.nameHi ? `(${s.nameHi})` : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Sowing Date">
            <Input
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
            />
          </FormField>
        </div>
      </div>

      {/* Modal Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={!name.trim() || latitude == null || longitude == null}
        >
          Save Field Plot
        </Button>
      </div>
    </form>
  )
}

export default function CreateFieldModal({
  isOpen,
  onClose,
  initialFarmId = '',
  farms = [],
  onSuccess,
  onError,
}) {
  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Field Plot"
      description="Register a plot with coordinates to enable Open-Meteo weather tracking and precision recommendations."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <CreateFieldForm
        key={`${initialFarmId}-${farms.length}`}
        initialFarmId={initialFarmId}
        farms={farms}
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Modal>
  )
}
