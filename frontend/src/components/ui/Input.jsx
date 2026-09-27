import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    id,
    type = 'text',
    disabled = false,
    hasError = false,
    className = '',
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    ...props
  },
  ref,
) {
  return (
    <div className="relative flex items-center w-full">
      {LeftIcon && (
        <div className="absolute left-3.5 pointer-events-none text-ink-muted">
          <LeftIcon className="w-5 h-5" aria-hidden="true" />
        </div>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : undefined}
        className={`
          w-full min-h-touch rounded-lg border bg-bg-surface text-ink-primary placeholder:text-ink-muted
          text-base transition-colors duration-fast ease-default
          py-2.5 ${LeftIcon ? 'pl-11' : 'pl-3.5'} ${RightIcon ? 'pr-11' : 'pr-3.5'}
          ${
            hasError
              ? 'border-risk-high-text focus-visible:ring-2 focus-visible:ring-risk-high-text focus-visible:outline-none'
              : 'border-border-default hover:border-border-strong focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none'
          }
          disabled:opacity-50 disabled:bg-bg-muted disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {RightIcon && (
        <div className="absolute right-3.5 pointer-events-none text-ink-muted">
          <RightIcon className="w-5 h-5" aria-hidden="true" />
        </div>
      )}
    </div>
  )
})

export default Input
