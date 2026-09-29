import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Off-canvas mobile menu: focus trap, Esc to close, backdrop click, page scroll locked while open.
 * The caller owns the toggle button and should set aria-expanded on it.
 */
export default function Drawer({ open, onClose, title = 'Menu', side = 'right', dark = false, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const focusables = () => Array.from(panel?.querySelectorAll(FOCUSABLE) || [])
    focusables()[0]?.focus()

    function onKey(e) {
      if (e.key === 'Escape') {
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden no-print" role="presentation">
      <div className="absolute inset-0 bg-ink-primary/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute top-0 bottom-0 ${side === 'left' ? 'left-0' : 'right-0'} w-[min(20rem,88vw)] shadow-lg flex flex-col ${
          dark ? 'bg-bg-sidebar text-ink-sidebar' : 'bg-bg-base text-ink-primary'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <span className="font-semibold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="min-h-touch min-w-touch inline-flex items-center justify-center rounded-full hover:bg-black/10 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">{children}</div>
      </div>
    </div>
  )
}
