import { FlaskConical, Sprout, Sparkles } from 'lucide-react'
import ProductIcon from './ProductIcon.jsx'
import { formatDate } from '../../utils/format.js'

const ICON = {
  soil: { Icon: FlaskConical, tint: '#f8ddd0', fg: '#a23d1d' },
  sowing: { Icon: Sprout, tint: '#e7f0d6', fg: '#3f6a22' },
  plan: { Icon: Sparkles, tint: '#fbecc0', fg: '#8a5a0c' },
}

const dot = { soil: '#c9683f', sowing: '#587a34', fertilizer: '#587a34', plan: '#d9962b' }

/** Vertical log of field events: date on the left, a dot on the rail, a card on the right. */
export default function HistoryTimeline({ events, emptyText = 'Nothing recorded yet.' }) {
  if (!events.length) {
    return <p className="text-sm text-ink-secondary py-6 text-center">{emptyText}</p>
  }
  return (
    <ol className="relative">
      <span className="absolute top-2 bottom-2 left-[5.25rem] sm:left-[6.25rem] w-0.5 bg-border-strong/60" aria-hidden="true" />
      {events.map((e) => {
        const ic = ICON[e.kind]
        return (
          <li key={e.id} className="relative grid grid-cols-[4.6rem_1.4rem_1fr] sm:grid-cols-[5.6rem_1.4rem_1fr] gap-x-1 py-2.5">
            <time dateTime={String(e.date).slice(0, 10)} className="text-sm text-ink-primary text-right leading-tight pt-3">
              {formatDate(e.date, { month: 'short', day: 'numeric' })},<br />
              {new Date(e.date).getFullYear()}
            </time>
            <span className="relative flex justify-center pt-4" aria-hidden="true">
              <span className="w-3.5 h-3.5 rounded-full ring-4 ring-bg-subtle" style={{ backgroundColor: dot[e.kind] }} />
            </span>
            <div className="rounded-lg bg-white/70 border border-border-default shadow-sm p-3.5 flex gap-3 min-w-0">
              <span className="w-11 h-11 rounded-md inline-flex items-center justify-center shrink-0" style={{ backgroundColor: ic?.tint || '#efe1c8', color: ic?.fg }}>
                {e.kind === 'fertilizer' ? <ProductIcon type={e.productType} className="w-8 h-9" /> : <ic.Icon className="w-6 h-6" aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-ink-primary leading-tight">{e.title}</h3>
                {e.lines.map((line) => (
                  <p key={line} className="text-sm text-ink-secondary mt-0.5 leading-snug">{line}</p>
                ))}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
