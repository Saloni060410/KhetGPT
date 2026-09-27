import React from 'react'
import { AlertCircle } from 'lucide-react'

export default function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  children,
  className = '',
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  // Clone single child to pass down id, aria-describedby, and hasError props
  const clonedChild =
    React.isValidElement(children) && id
      ? React.cloneElement(children, {
          id: children.props.id || id,
          'aria-describedby': children.props['aria-describedby'] || describedBy,
          hasError: Boolean(error) || children.props.hasError,
        })
      : children

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-semibold text-ink-primary flex items-center justify-between"
        >
          <span>
            {label}
            {required && (
              <span className="text-risk-high-text ml-1" aria-hidden="true">
                *
              </span>
            )}
          </span>
          {required && <span className="text-xs text-ink-muted font-normal">Required</span>}
        </label>
      )}

      {clonedChild}

      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-risk-high-text flex items-center gap-1.5 mt-0.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
