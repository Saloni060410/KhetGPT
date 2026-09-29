import { useEffect, useMemo, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import LocationPicker from './LocationPicker.jsx'
import { useFarmStore } from '../../store/useFarmStore.js'
import * as endpoints from '../../services/endpoints.js'

const labelClass = 'block text-sm font-semibold text-ink-primary mb-1.5'
const controlClass =
  'w-full min-h-[46px] px-3.5 rounded-md border-2 border-border-default hover:border-border-strong focus:border-primary-600 bg-white text-ink-primary focus:outline-none'

/** Registers a farm and its first field in one step: name, crop, area, sowing date, location. */
export default function AddFarmModal({ isOpen, onClose, onCreated }) {
  const { createFarm, createField, deleteFarm } = useFarmStore()
  const [crops, setCrops] = useState([])
  const [name, setName] = useState('')
  const [cropType, setCropType] = useState('')
  const [growthStage, setGrowthStage] = useState('')
  const [area, setArea] = useState('2.0')
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [irrigation, setIrrigation] = useState('irrigated')
  const [location, setLocation] = useState({ latitude: null, longitude: null, placeName: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen || crops.length) return undefined
    let active = true
    endpoints
      .getReferenceCrops()
      .then((list) => {
        if (!active || !Array.isArray(list)) return
        setCrops(list)
        if (list[0]) {
          setCropType(list[0].id)
          setGrowthStage(list[0].stages?.[0]?.id || '')
        }
      })
      .catch(() => {
        if (active) setErrors({ server: 'Could not load the crop list. Check your connection and reopen this form.' })
      })
    return () => {
      active = false
    }
  }, [isOpen, crops.length])

  const stages = useMemo(() => crops.find((c) => c.id === cropType)?.stages || [], [crops, cropType])

  const changeCrop = (id) => {
    setCropType(id)
    // Each crop starts at its own first stage (rice is transplanted, not sown).
    setGrowthStage(crops.find((c) => c.id === id)?.stages?.[0]?.id || '')
  }

  const validate = () => {
    const errs = {}
    if (name.trim().length < 2) errs.name = 'Give the plot a name (at least 2 characters).'
    if (!cropType) errs.crop = 'Choose a crop.'
    const acres = parseFloat(area)
    if (!(acres > 0)) errs.area = 'Enter the area in acres.'
    if (location.latitude == null || location.longitude == null) {
      errs.location = 'Set the plot location so we can fetch its weather.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    setErrors({})
    let farm = null
    try {
      farm = await createFarm({ name: name.trim() })
      const field = await createField(farm.id, {
        name: name.trim(),
        areaAcres: parseFloat(area),
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        cropType,
        growthStage: growthStage || undefined,
        irrigation,
        sowingDate,
      })
      onCreated?.({ farm, field })
      setName('')
    } catch (err) {
      // Don't leave an empty farm behind when its field failed to create.
      if (farm) await deleteFarm(farm.id).catch(() => {})
      setErrors({ server: err?.message || 'Could not register this plot. Try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add a new farm" description="Register a plot to start planning its fertilizer." className="max-w-2xl max-h-[92vh] overflow-y-auto">
      <form onSubmit={submit} noValidate className="space-y-4 text-sm">
        {errors.server && (
          <div role="alert" className="p-3 rounded-md bg-risk-high-bg border border-risk-high-border text-risk-high-text">
            {errors.server}
          </div>
        )}

        <div>
          <label htmlFor="farm-name" className={labelClass}>Plot name</label>
          <input id="farm-name" className={controlClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North Plot" autoComplete="off" aria-invalid={errors.name ? 'true' : undefined} />
          {errors.name && <p className="mt-1 text-xs text-risk-high-text">{errors.name}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="farm-crop" className={labelClass}>Crop</label>
            <select id="farm-crop" className={controlClass} value={cropType} onChange={(e) => changeCrop(e.target.value)} disabled={!crops.length}>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>{c.name_en}</option>
              ))}
            </select>
            {errors.crop && <p className="mt-1 text-xs text-risk-high-text">{errors.crop}</p>}
          </div>
          <div>
            <label htmlFor="farm-stage" className={labelClass}>Growth stage now</label>
            <select id="farm-stage" className={controlClass} value={growthStage} onChange={(e) => setGrowthStage(e.target.value)} disabled={!stages.length}>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name_en}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="farm-area" className={labelClass}>Area (acres)</label>
            <input id="farm-area" type="number" step="0.1" min="0.1" className={controlClass} value={area} onChange={(e) => setArea(e.target.value)} aria-invalid={errors.area ? 'true' : undefined} />
            {errors.area && <p className="mt-1 text-xs text-risk-high-text">{errors.area}</p>}
          </div>
          <div>
            <label htmlFor="farm-sown" className={labelClass}>Sowing date</label>
            <input id="farm-sown" type="date" max={new Date().toISOString().slice(0, 10)} className={controlClass} value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} />
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Irrigation</legend>
          <div className="grid grid-cols-2 gap-3">
            {['irrigated', 'rainfed'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setIrrigation(v)}
                aria-pressed={irrigation === v}
                className={`min-h-[44px] rounded-md border-2 font-medium capitalize cursor-pointer transition-colors ${
                  irrigation === v ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-border-default hover:border-border-strong'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <span className={labelClass}>Location</span>
          <LocationPicker
            latitude={location.latitude}
            longitude={location.longitude}
            placeName={location.placeName}
            onChange={setLocation}
            error={errors.location}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
          <button type="button" onClick={onClose} className="min-h-[44px] px-5 rounded-full text-ink-secondary hover:bg-bg-subtle font-medium cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !crops.length} className="min-h-[46px] px-7 rounded-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium shadow-md cursor-pointer">
            {submitting ? 'Registering…' : 'Add farm'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
