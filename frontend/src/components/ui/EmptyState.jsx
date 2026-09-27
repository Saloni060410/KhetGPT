import { Sprout } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Sprout,
  title = 'No records found',
  description = 'There is currently no data recorded for this field. Start by recording a new entry.',
  action,
  secondaryAction,
  className = '',
}) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center p-8 sm:p-12
        border border-dashed border-border-default rounded-2xl bg-bg-surface/60
        ${className}
      `}
    >
      <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-ink-primary tracking-tight mb-1.5">{title}</h3>
      <p className="text-sm text-ink-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
