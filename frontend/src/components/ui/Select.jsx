import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(function Select(
  {
    id,
    disabled = false,
    hasError = false,
    options = [],
    placeholder = 'Select an option',
    className = '',
    children,
    ...props
  },
  ref,
) {
  return (
    <div className="relative flex items-center w-full">
      <select
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : undefined}
        className={`
          w-full min-h-touch rounded-lg border bg-bg-surface text-ink-primary
          text-base appearance-none pr-10 pl-3.5 py-2.5 transition-colors duration-fast ease-default cursor-pointer
          ${
            hasError
              ? 'border-risk-high-text focus-visible:ring-2 focus-visible:ring-risk-high-text focus-visible:outline-none'
              : 'border-border-default hover:border-border-strong focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none'
          }
          disabled:opacity-50 disabled:bg-bg-muted disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className="text-ink-muted">
            {placeholder}
          </option>
        )}
        {children
          ? children
          : options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
      </select>
      <div className="absolute right-3.5 pointer-events-none text-ink-muted">
        <ChevronDown className="w-5 h-5" aria-hidden="true" />
      </div>
    </div>
  )
})

export default Select
