import { useState } from 'react'
import { RotateCw, FlaskConical, CalendarDays, Sprout, Check } from 'lucide-react'
import CropArt, { cropTheme } from '../illustrations/CropArt.jsx'
import { CROPS_DATA } from '../../data/cropsData.js'

const meta = (id) => CROPS_DATA.find((c) => c.id === id)

/** Season label without the sowing/harvest detail: "Rabi (Nov Sowing ...)" -> "Rabi". */
const seasonWord = (text) => String(text || '').split(/[\s(]/)[0]

/** Small selectable crop tile beside the big card. */
export function CropTile({ crop, selected, onSelect }) {
  const theme = cropTheme(crop)
  return (
    <button
      type="button"
      onClick={() => onSelect(crop)}
      aria-pressed={selected}
      className={`relative shrink-0 w-[9.5rem] sm:w-full rounded-lg overflow-hidden text-left cursor-pointer transition-all duration-normal ease-spring hover:-translate-y-1 focus-visible:-translate-y-1 shadow-md ${
        selected ? 'ring-4 ring-primary-600' : ''
      }`}
      style={{ backgroundColor: theme.deep, boxShadow: '5px 5px 0 -1px rgba(38,41,26,.18), var(--shadow-md)' }}
    >
      <div className="pt-2 px-2 h-[7.4rem]" style={{ backgroundColor: theme.bg }}>
        <CropArt crop={crop} className="w-full h-full" title="" />
      </div>
      <div className="py-2 text-center text-white font-semibold text-lg tracking-wide">
        {theme.name.replace('Golden ', '')}
      </div>
      {selected && (
        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-600 text-white inline-flex items-center justify-center" aria-hidden="true">
          <Check className="w-4 h-4" />
        </span>
      )}
    </button>
  )
}

function Metric({ icon: Icon, label, value, detail, tint }) {
  return (
    <div className="rounded-lg border border-border-default bg-white/70 p-2.5 flex flex-col items-center text-center gap-1">
      <span className="w-10 h-10 rounded-full inline-flex items-center justify-center" style={{ backgroundColor: tint.bg, color: tint.fg }}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="text-xs text-ink-secondary leading-tight">{label}</span>
      <span className="text-sm font-semibold text-ink-primary leading-snug">{value}</span>
      {detail && <span className="text-[11px] text-ink-muted leading-tight">{detail}</span>}
    </div>
  )
}

/** "Rabi (Nov Sowing · April Harvest)" -> ["Rabi", "Nov Sowing · April Harvest"] */
function splitSeason(text) {
  const m = String(text || '').match(/^([^(]+?)\s*\((.*)\)\s*$/)
  return m ? [m[1].trim(), m[2].trim()] : [String(text || 'n/a'), null]
}

/**
 * The big crop card. Front: illustration and name. Back (flip): the crop's data and metrics
 * and a button that confirms it for this soil test. Flipping is a 3D turn, instant when the
 * visitor prefers reduced motion.
 */
export default function CropCard({ crop, stageCount, varietyCount, onConfirm }) {
  const [flipped, setFlipped] = useState(false)
  const theme = cropTheme(crop)
  const info = meta(crop)
  const commonName = theme.name.replace('Golden ', '')

  return (
    <div className="flip-scene w-full max-w-[19rem] mx-auto lg:mx-0">
      <div className="card-stack rounded-xl">
        <div className="flip-card relative h-[26rem]" data-flipped={flipped}>
          {/* Front */}
          <div
            className="flip-face absolute inset-0 bg-[#fdf7e8] rounded-xl border border-border-default p-4 flex flex-col"
            aria-hidden={flipped}
            inert={flipped ? '' : undefined}
          >
            <div className="relative flex-1 rounded-lg overflow-hidden flex items-end justify-center" style={{ backgroundColor: theme.bg }}>
              <CropArt crop={crop} className="w-[86%] h-full" title={`${commonName} illustration`} />
              <span
                className="absolute -bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-11 h-11 rounded-full bg-[#fdf7e8] border-2 inline-flex items-center justify-center"
                style={{ borderColor: theme.bg }}
                aria-hidden="true"
              >
                <Sprout className="w-5 h-5" style={{ color: theme.deep }} />
              </span>
            </div>
            <div className="pt-8 text-center">
              <h3 className="text-2xl font-bold uppercase tracking-wide text-primary-700 leading-tight">{theme.name}</h3>
              {theme.sci && <p className="text-sm italic text-ink-secondary">({theme.sci})</p>}
              <p className="mt-2 text-sm text-ink-primary">
                {info ? `${seasonWord(info.season)} season` : 'Season varies'} <span className="text-ink-muted">|</span> {info ? info.duration : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="mt-3 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full border-2 border-primary-600 text-primary-700 hover:bg-primary-50 text-sm font-semibold cursor-pointer transition-colors"
            >
              <RotateCw className="w-4 h-4" aria-hidden="true" /> Flip for crop data
            </button>
          </div>

          {/* Back */}
          <div
            className="flip-face flip-back absolute inset-0 bg-[#fdf7e8] rounded-xl border border-border-default p-4 flex flex-col"
            aria-hidden={!flipped}
            inert={!flipped ? '' : undefined}
          >
            <button
              type="button"
              onClick={() => setFlipped(false)}
              aria-label="Back to the front of the card"
              title="Back to card"
              className="absolute top-2.5 right-2.5 min-h-touch min-w-touch inline-flex items-center justify-center rounded-full text-ink-muted hover:text-ink-primary hover:bg-black/5 cursor-pointer"
            >
              <RotateCw className="w-4 h-4 -scale-x-100" aria-hidden="true" />
            </button>
            <p className="text-center text-sm text-ink-secondary pt-1">
              <span className="font-semibold text-ink-primary uppercase">{commonName}</span> | Planting guide
            </p>
            <h3 className="mt-0.5 text-center text-xl font-bold uppercase tracking-wide text-primary-700">Data &amp; Metrics</h3>
            <div className="mt-3 grid grid-cols-2 gap-2.5 flex-1 content-start">
              <Metric icon={FlaskConical} label="Target soil pH" value={info ? info.idealPh : 'n/a'} tint={{ bg: '#e7f0d6', fg: '#3f6a22' }} />
              <Metric icon={CalendarDays} label="Sowing season" value={splitSeason(info?.season)[0]} detail={splitSeason(info?.season)[1]} tint={{ bg: '#f8ddd0', fg: '#a23d1d' }} />
              <Metric icon={Sprout} label="Crop duration" value={info ? info.duration : 'n/a'} tint={{ bg: '#fbecc0', fg: '#8a5a0c' }} />
              <Metric
                icon={RotateCw}
                label="Growth stages tracked"
                value={`${stageCount ?? '?'} stages${varietyCount ? ` · ${varietyCount} varieties` : ''}`}
                tint={{ bg: '#dcecf6', fg: '#245e83' }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onConfirm?.(crop)
                setFlipped(false)
              }}
              className="mt-3 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-full bg-primary-700 hover:bg-primary-900 text-white font-semibold shadow-md cursor-pointer transition-colors"
            >
              Select for Soil Test
              <span className="w-6 h-6 rounded-full bg-white/20 inline-flex items-center justify-center" aria-hidden="true">
                <Check className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
