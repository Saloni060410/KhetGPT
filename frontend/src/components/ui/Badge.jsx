const VARIANTS = {
  neutral: 'bg-bg-subtle text-ink-secondary border-border-default',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-risk-low-bg text-risk-low-text border-risk-low-border',
  warning: 'bg-risk-med-bg text-risk-med-text border-risk-med-border',
  danger: 'bg-risk-high-bg text-risk-high-text border-risk-high-border',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm font-medium',
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}) {
  const variantClasses = VARIANTS[variant] || VARIANTS.neutral
  const sizeClasses = SIZES[size] || SIZES.md

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium select-none
        ${variantClasses}
        ${sizeClasses}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  )
}
