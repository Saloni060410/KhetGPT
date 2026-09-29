import { ChevronDown } from 'lucide-react'
import { EVENT_FILTERS } from '../../utils/historyEvents.js'

export default function FilterSelect({ value, onChange }) {
  return (
    <div className="relative inline-block">
      <label htmlFor="event-filter" className="sr-only">Filter history</label>
      <select
        id="event-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none min-h-[44px] pl-4 pr-10 rounded-md border-2 border-border-default bg-white text-sm font-medium text-ink-primary cursor-pointer focus:outline-none focus:border-primary-600"
      >
        {EVENT_FILTERS.map((f) => (
          <option key={f.id} value={f.id}>Filter: {f.label}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted" aria-hidden="true" />
    </div>
  )
}
