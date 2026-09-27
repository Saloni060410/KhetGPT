import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react'

const RISK_CONFIGS = {
  low: {
    label: 'Low Risk',
    icon: ShieldCheck,
    bg: 'bg-risk-low-bg',
    text: 'text-risk-low-text',
    border: 'border-risk-low-border',
    description: 'Safe application rate with balanced nutrient delivery.',
  },
  medium: {
    label: 'Medium Risk',
    icon: AlertTriangle,
    bg: 'bg-risk-med-bg',
    text: 'text-risk-med-text',
    border: 'border-risk-med-border',
    description: 'Moderate risk of nutrient deficit or mild excess.',
  },
  high: {
    label: 'High Risk',
    icon: AlertOctagon,
    bg: 'bg-risk-high-bg',
    text: 'text-risk-high-text',
    border: 'border-risk-high-border',
    description: 'High over-application or leaching danger detected.',
  },
}

export default function RiskBadge({
  level = 'low',
  customLabel,
  reason,
  showReason = false,
  size = 'md',
  className = '',
}) {
  const normalizedLevel = String(level).toLowerCase()
  const config = RISK_CONFIGS[normalizedLevel] || RISK_CONFIGS.low
  const IconComponent = config.icon

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2.5 font-semibold',
  }[size] || 'px-3 py-1.5 text-sm gap-2'

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size] || 'w-4 h-4'

  return (
    <div className={`inline-flex flex-col gap-1 items-start ${className}`}>
      <span
        role="status"
        aria-label={`Risk level: ${customLabel || config.label}`}
        className={`
          inline-flex items-center rounded-full border font-semibold select-none
          ${config.bg} ${config.text} ${config.border} ${sizeClasses}
        `}
      >
        <IconComponent className={`${iconSizes} shrink-0 stroke-[2.2]`} aria-hidden="true" />
        <span className="tracking-wide uppercase text-[0.85em] font-bold">
          {customLabel || config.label}
        </span>
      </span>

      {showReason && (
        <span className="text-xs text-ink-secondary max-w-xs mt-0.5">
          {reason || config.description}
        </span>
      )}
    </div>
  )
}
