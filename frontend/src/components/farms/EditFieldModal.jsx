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

function EditFieldForm({ field, onClose, onSuccess, onError }) {
  const { updateFieldOptimistic } = useFarmStore()

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

  // Form State initialized directly from field
  const [name, setName] = useState(field.name || '')
  const [areaAcres, setAreaAcres] = useState(
    field.areaAcres != null ? String(field.areaAcres) : '1.0'
  )
  const [pincode, setPincode] = useState(field.pincode || '')
  const [cropType, setCropType] = useState(field.cropType || 'wheat')
  const [cropVariety, setCropVariety] = useState(field.cropVariety || '')
  const [growthStage, setGrowthStage] = useState(field.growthStage || 'sowing')
  const [sowingDate, setSowingDate] = useState(
    field.sowingDate ? field.sowingDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )

  // Selected crop & stages from reference data
  const currentCrop = useMemo(() => crops.find((c) => c.id === cropType), [crops, cropType])
  const currentStages = useMemo(() => currentCrop?.stages || [], [currentCrop])
  const hasVarieties = Boolean(currentCrop?.varieties && currentCrop.varieties.length > 0)

  // Location State
  const [latitude, setLatitude] = useState(
    field.latitude != null ? Number(field.latitude) : null
  )
  const [longitude, setLongitude] = useState(
    field.longitude != null ? Number(field.longitude) : null
  )
  const [placeName, setPlaceName] = useState(
    field.latitude && field.longitude
      ? `Field Plot (${field.latitude}°, ${field.longitude}°)`
      : ''
  )

  // Submission / Error State
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
    if (!name.trim()) {
      errs.name = 'Field name is required.'
    }

    const acres = parseFloat(areaAcres)
    if (isNaN(acres) || acres <= 0) {
      errs.areaAcres = 'Enter a valid area in acres.'
    }

    if (latitude == null || longitude == null) {
      errs.location = 'Field coordinates (latitude & longitude) are required for weather forecasts.'
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
        pincode: pincode.trim() || null,
        cropType,
        cropVariety: cropVariety.trim() || null,
        growthStage,
        sowingDate,
      }

      // Optimistic update handles immediate UI sync and rollback if API fails
      const updated = await updateFieldOptimistic(field.id, payload)
      onClose?.()
      onSuccess?.(updated)
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to update field'
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

      {/* 1. Basic Plot Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Field Name"
          required
          error={errors.name}
        >
          <div className="relative">
            <Input
              type="text"
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
          required
          error={errors.areaAcres}
        >
          <Input
            type="number"
            step="0.1"
            min="0.1"
            value={areaAcres}
            onChange={(e) => {
              setAreaAcres(e.target.value)
              if (errors.areaAcres) setErrors((prev) => ({ ...prev, areaAcres: null }))
            }}
          />
        </FormField>
      </div>

      {/* 2. Location Picker with 3 Ways & Explicit Confirmation Display */}
      <div className="pt-2 border-t border-border-default space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary-600" />
            <span>Plot Location & Coordinates</span>
            <span className="text-risk-high-text font-normal">*</span>
          </span>
          <span className="text-xs text-ink-muted">Used by Open-Meteo for rain & temperature</span>
        </div>

        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          placeName={placeName}
          onChange={handleLocationChange}
          error={errors.location}
        />
      </div>

      {/* 3. Pincode Label (Optional label only, never turned into coords) */}
      <div className="pt-2 border-t border-border-default">
        <FormField
          label="Postal Pincode (Optional Label)"
          hint="Label only for postal records. Open-Meteo weather uses coordinates above, not pincode."
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="e.g. 110001 (optional label)"
              value={pincode}
              maxLength={10}
              onChange={(e) => setPincode(e.target.value)}
              className="pl-9"
            />
            <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          </div>
        </FormField>
      </div>

      {/* 4. Crop & Agronomy Details */}
      <div className="pt-2 border-t border-border-default space-y-3">
        <span className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary-600" />
          <span>Crop & Agronomy Lifecycle</span>
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
            <FormField label="Crop Variety (Optional)">
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

      {/* Action Buttons */}
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
          Save Changes
        </Button>
      </div>
    </form>
  )
}

export default function EditFieldModal({
  isOpen,
  onClose,
  field,
  onSuccess,
  onError,
}) {
  if (!isOpen || !field) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Field Plot"
      description="Update crop status, plot dimensions, and weather coordinates."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <EditFieldForm
        key={field.id}
        field={field}
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Modal>
  )
}
