import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-primary-600 text-ink-inverse hover:bg-primary-700 active:bg-primary-900 border border-transparent shadow-sm',
  accent:
    'bg-terracotta-600 text-ink-inverse hover:bg-terracotta-700 active:bg-terracotta-700 border border-transparent shadow-md',
  secondary:
    'bg-primary-100 text-primary-700 hover:bg-primary-200 active:bg-primary-200 border border-primary-200',
  outline:
    'bg-bg-surface text-ink-primary hover:bg-bg-subtle active:bg-bg-muted border border-border-default shadow-sm',
  ghost:
    'bg-transparent text-ink-secondary hover:bg-bg-subtle active:bg-bg-muted border border-transparent',
  danger:
    'bg-risk-high-text text-ink-inverse hover:opacity-90 active:opacity-100 border border-transparent shadow-sm',
}

const SIZES = {
  sm: 'min-h-touch px-3 py-2 text-sm gap-1.5',
  md: 'min-h-touch px-4 py-2.5 text-base gap-2',
  lg: 'min-h-touch px-6 py-3 text-lg gap-2.5',
}

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || isLoading
  const variantClasses = VARIANTS[variant] || VARIANTS.primary
  const sizeClasses = SIZES[size] || SIZES.md

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`
        inline-flex items-center justify-center font-medium rounded-md
        min-w-touch select-none cursor-pointer
        transition-all duration-fast ease-default
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variantClasses}
        ${sizeClasses}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-current shrink-0" aria-hidden="true" />
      ) : (
        LeftIcon && <LeftIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
      )}
      <span className="truncate">{children}</span>
      {!isLoading && RightIcon && (
        <RightIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
      )}
    </button>
  )
})

export default Button
