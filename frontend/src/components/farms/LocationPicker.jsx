import { useState, useRef, useCallback } from 'react'
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Compass,
  Loader2,
  Check,
} from 'lucide-react'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import FormField from '../ui/FormField.jsx'
import * as endpoints from '../../services/endpoints.js'

export default function LocationPicker({
  latitude,
  longitude,
  placeName = '',
  onChange,
  error = null,
}) {
  const [activeTab, setActiveTab] = useState('gps') // 'gps' | 'search' | 'manual'

  // 1. GPS State
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState(null)

  // 2. Place Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const searchTimeoutRef = useRef(null)

  // 3. Manual Coordinate State
  const [manualLat, setManualLat] = useState(latitude != null ? String(latitude) : '')
  const [manualLng, setManualLng] = useState(longitude != null ? String(longitude) : '')
  const [manualError, setManualError] = useState(null)

  // Sync manual inputs when switching to manual tab
  const handleTabClick = (tab) => {
    setActiveTab(tab)
    if (tab === 'manual') {
      if (latitude != null) setManualLat(String(latitude))
      if (longitude != null) setManualLng(String(longitude))
    }
  }

  // Method 1: GPS / Current Device Location
  const handleUseCurrentLocation = useCallback(() => {
    setGpsError(null)

    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser. Please search for your village name or type coordinates.')
      return
    }

    setGpsLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false)
        const lat = Number(position.coords.latitude.toFixed(5))
        const lng = Number(position.coords.longitude.toFixed(5))
        const label = `Current Location (${lat >= 0 ? `${lat}° N` : `${Math.abs(lat)}° S`}, ${lng >= 0 ? `${lng}° E` : `${Math.abs(lng)}° W`})`

        onChange?.({
          latitude: lat,
          longitude: lng,
          placeName: label,
        })
      },
      (err) => {
        setGpsLoading(false)
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            setGpsError(
              'Location permission was denied. Please allow location access in your browser or search by village/city name.',
            )
            break
          case 2: // POSITION_UNAVAILABLE
            setGpsError(
              'Location information unavailable. Please search by village/city name or enter coordinates manually.',
            )
            break
          case 3: // TIMEOUT
            setGpsError(
              'Request to get location timed out. Please try searching by village name.',
            )
            break
          default:
            setGpsError('Unable to detect location. Please search for your village name.')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }, [onChange])

  // Method 2: Search by Place Name (Open-Meteo geocoding proxy)
  const executeSearch = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    try {
      const results = await endpoints.geocode(query.trim())
      setSearchResults(Array.isArray(results) ? results : [])
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSearchInputChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!val.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    // Debounce search by 350ms
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(val)
    }, 350)
  }

  const handleSelectSearchResult = (item) => {
    const lat = Number(Number(item.latitude).toFixed(5))
    const lng = Number(Number(item.longitude).toFixed(5))
    const formattedPlace = item.admin ? `${item.name}, ${item.admin}` : item.name

    onChange?.({
      latitude: lat,
      longitude: lng,
      placeName: formattedPlace,
    })
  }

  // Method 3: Manual Coordinate Entry
  const handleApplyManualCoords = (e) => {
    e?.preventDefault()
    setManualError(null)

    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setManualError('Latitude must be a valid number between -90 and 90.')
      return
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setManualError('Longitude must be a valid number between -180 and 180.')
      return
    }

    onChange?.({
      latitude: Number(lat.toFixed(5)),
      longitude: Number(lng.toFixed(5)),
      placeName: `Custom Coordinates (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
    })
  }

  const handleClearLocation = () => {
    onChange?.({
      latitude: null,
      longitude: null,
      placeName: '',
    })
    setManualLat('')
    setManualLng('')
    setGpsError(null)
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
  }

  const hasSelectedCoords = latitude != null && longitude != null

  return (
    <div className="space-y-4">
      {/* Method Tabs */}
      <div className="flex border-b border-border-default gap-2" role="tablist" aria-label="Location Methods">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'gps'}
          onClick={() => handleTabClick('gps')}
          className={`
            pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5
            ${
              activeTab === 'gps'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }
          `}
        >
          <Navigation className="w-4 h-4" />
          <span>Use GPS</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'search'}
          onClick={() => handleTabClick('search')}
          className={`
            pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5
            ${
              activeTab === 'search'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }
          `}
        >
          <Search className="w-4 h-4" />
          <span>Search Place</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'manual'}
          onClick={() => handleTabClick('manual')}
          className={`
            pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5
            ${
              activeTab === 'manual'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }
          `}
        >
          <Compass className="w-4 h-4" />
          <span>Manual Lat / Lng</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-border-default bg-bg-surface/50">
        {/* Tab 1: Current GPS */}
        {activeTab === 'gps' && (
          <div className="space-y-3">
            <p className="text-xs text-ink-secondary leading-relaxed">
              Detect your device&apos;s current satellite location. Ideal when standing at or near your farm.
            </p>

            <Button
              type="button"
              variant="secondary"
              onClick={handleUseCurrentLocation}
              isLoading={gpsLoading}
              className="w-full sm:w-auto"
            >
              <Navigation className="w-4 h-4 mr-2 text-primary-600" />
              <span>Detect My Current Location</span>
            </Button>

            {gpsError && (
              <div className="p-3 rounded-lg bg-risk-high-bg border border-risk-high-border text-xs text-risk-high-text flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-snug">{gpsError}</div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Place Name Search */}
        {activeTab === 'search' && (
          <div className="space-y-3">
            <p className="text-xs text-ink-secondary leading-relaxed">
              Search for your village, tehsil, town or district (powered by Open-Meteo).
            </p>

            <div className="relative">
              <Input
                type="text"
                placeholder="Type village or town name (e.g. Karnal, Ludhiana)..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    executeSearch(searchQuery)
                  }
                }}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Results Pick List */}
            {searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                  Select matching village/district:
                </span>
                <ul className="space-y-1" role="listbox">
                  {searchResults.map((item, idx) => {
                    const isSelected =
                      latitude === item.latitude && longitude === item.longitude
                    return (
                      <li key={`${item.name}-${item.latitude}-${idx}`}>
                        <button
                          type="button"
                          onClick={() => handleSelectSearchResult(item)}
                          className={`
                            w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer
                            ${
                              isSelected
                                ? 'bg-primary-50 border-primary-500 text-primary-900 font-semibold dark:bg-primary-950/40 dark:text-primary-200'
                                : 'bg-bg-surface border-border-default hover:border-primary-300 hover:bg-bg-subtle text-ink-primary'
                            }
                          `}
                        >
                          <div className="min-w-0">
                            <span className="font-semibold block truncate">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-ink-muted truncate block">
                              {item.admin || 'India'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[11px] text-ink-muted bg-bg-subtle px-1.5 py-0.5 rounded border border-border-default">
                              {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-primary-600 shrink-0" />
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {hasSearched && !isSearching && searchResults.length === 0 && (
              <div className="p-3 text-center text-xs text-ink-muted border border-dashed border-border-default rounded-lg">
                No matching places found for &quot;{searchQuery}&quot;. Try another spelling or enter coordinates manually.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Manual Lat / Lng */}
        {activeTab === 'manual' && (
          <form onSubmit={handleApplyManualCoords} className="space-y-3">
            <p className="text-xs text-ink-secondary leading-relaxed">
              Enter known GPS latitude and longitude in decimal degrees (e.g. 28.6139 and 77.2090).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Latitude (°N / °S)" hint="Between -90 and 90">
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 28.6139"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                />
              </FormField>

              <FormField label="Longitude (°E / °W)" hint="Between -180 and 180">
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 77.2090"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                />
              </FormField>
            </div>

            {manualError && (
              <div className="p-2.5 rounded-lg bg-risk-high-bg border border-risk-high-border text-xs text-risk-high-text">
                {manualError}
              </div>
            )}

            <Button type="submit" variant="secondary" className="w-full sm:w-auto">
              Set Coordinates
            </Button>
          </form>
        )}
      </div>

      {/* Confirmation Display: Shows chosen place and coordinates back to user before saving */}
      {hasSelectedCoords ? (
        <div className="p-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2 animate-in fade-in duration-normal">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Confirmed Location for Weather & Soil
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearLocation}
              aria-label="Change location"
              className="text-xs text-ink-muted hover:text-risk-high-text inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Change</span>
            </button>
          </div>

          <div className="bg-bg-surface/80 p-3 rounded-lg border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-ink-primary flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span>{placeName || 'Selected Field Location'}</span>
              </div>
              <div className="text-xs font-mono text-ink-secondary mt-0.5">
                Latitude: <strong className="text-ink-primary">{latitude}°</strong> • Longitude: <strong className="text-ink-primary">{longitude}°</strong>
              </div>
            </div>
            <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full self-start sm:self-auto">
              Ready for Weather Sync
            </span>
          </div>

          <p className="text-[11px] text-ink-muted leading-tight">
            ⚠️ Please confirm this location matches your farm plot. Accurate coordinates ensure reliable Open-Meteo rainfall and temperature forecasts for fertilizer scheduling.
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="leading-snug">
            <strong>Location required:</strong> A field must end up with latitude and longitude so Open-Meteo can provide local rain and temperature forecasts. Use GPS, search by place, or enter coordinates above.
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-risk-high-text mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
