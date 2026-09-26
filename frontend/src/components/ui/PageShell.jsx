import { useEffect } from 'react'

export default function PageShell({ title, children }) {
  useEffect(() => {
    document.title = title === 'KhetGPT' ? 'KhetGPT' : `${title} — KhetGPT`
  }, [title])

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-medium text-field-900">{title}</h1>
      <div className="mt-4 text-ink/80">{children}</div>
    </main>
  )
}
