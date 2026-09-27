export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`
        bg-bg-surface border border-border-default rounded-xl shadow-sm
        p-4 sm:p-5 transition-shadow duration-fast ease-default
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 pb-4 border-b border-border-subtle ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', as: Tag = 'h2', ...props }) {
  return (
    <Tag className={`text-lg font-bold text-ink-primary tracking-tight ${className}`} {...props}>
      {children}
    </Tag>
  )
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-ink-secondary ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`py-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`pt-4 border-t border-border-subtle flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Card
