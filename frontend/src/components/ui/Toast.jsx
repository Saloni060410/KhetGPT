import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const TOAST_VARIANTS = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-risk-low-bg',
    border: 'border-risk-low-border',
    text: 'text-risk-low-text',
    title: 'Success',
  },
  error: {
    icon: XCircle,
    bg: 'bg-risk-high-bg',
    border: 'border-risk-high-border',
    text: 'text-risk-high-text',
    title: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-risk-med-bg',
    border: 'border-risk-med-border',
    text: 'text-risk-med-text',
    title: 'Warning',
  },
  info: {
    icon: Info,
    bg: 'bg-info-bg',
    border: 'border-info-border',
    text: 'text-info-text',
    title: 'Information',
  },
}

export default function Toast({
  variant = 'info',
  title,
  message,
  onClose,
  className = '',
}) {
  const config = TOAST_VARIANTS[variant] || TOAST_VARIANTS.info
  const IconComponent = config.icon

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-md
        transition-all duration-normal ease-spring
        ${config.bg} ${config.border}
        ${className}
      `}
    >
      <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${config.text}`} aria-hidden="true" />
      <div className="flex-1 min-w-0 pr-1">
        <h3 className={`text-sm font-semibold ${config.text}`}>
          {title || config.title}
        </h3>
        {message && <p className="text-sm text-ink-primary mt-0.5 leading-snug">{message}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="min-h-touch min-w-touch -mr-2 -mt-2 inline-flex items-center justify-center text-ink-muted hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-lg cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
