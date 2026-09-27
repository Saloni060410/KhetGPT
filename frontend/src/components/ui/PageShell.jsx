import useDocumentTitle from '../../hooks/useDocumentTitle.js'
import Card from './Card.jsx'

export default function PageShell({ title, description, children, action }) {
  useDocumentTitle(title)

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-ink-secondary mt-1">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>

      <Card className="p-4 sm:p-6">
        <div className="text-ink-primary leading-relaxed break-words">{children}</div>
      </Card>
    </div>
  )
}
