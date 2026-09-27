import { forwardRef } from 'react'

const Textarea = forwardRef(function Textarea(
  {
    id,
    disabled = false,
    hasError = false,
    rows = 3,
    className = '',
    ...props
  },
  ref,
) {
  return (
    <textarea
      ref={ref}
      id={id}
      disabled={disabled}
      rows={rows}
      aria-invalid={hasError ? 'true' : undefined}
      className={`
        w-full min-h-touch rounded-lg border bg-bg-surface text-ink-primary placeholder:text-ink-muted
        text-base p-3.5 transition-colors duration-fast ease-default resize-y
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
  )
})

export default Textarea
