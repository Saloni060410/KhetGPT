import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, ChevronDown } from 'lucide-react'
import { SoilBagArt } from '../components/illustrations/SmallArt.jsx'

export default function ServerError({ error, resetErrorBoundary }) {
  const [showDetails, setShowDetails] = useState(false)

  const retry = () => {
    if (resetErrorBoundary) resetErrorBoundary()
    else window.location.reload()
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-12 bg-bg-base">
      <div className="max-w-lg w-full text-center bg-white rounded-xl border border-border-default shadow-md p-8 sm:p-10">
        <SoilBagArt className="w-44 h-36 mx-auto" />
        <p className="mt-4 text-sm font-semibold tracking-widest text-risk-high-text">ERROR 500</p>
        <h1 className="mt-1 text-3xl font-bold text-ink-primary">Something went wrong on our side</h1>
        <p className="mt-2 text-ink-secondary">The page hit an unexpected problem. Your saved fields and soil tests are safe. Try again in a moment.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={retry} className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-md cursor-pointer">
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Try again
          </button>
          <Link to="/" className="inline-flex items-center min-h-[48px] px-6 rounded-full border-2 border-primary-600 text-primary-700 hover:bg-primary-50 font-medium">
            Back to home
          </Link>
        </div>
        {error && (
          <div className="mt-6 text-left">
            <button type="button" onClick={() => setShowDetails((v) => !v)} aria-expanded={showDetails} className="inline-flex items-center gap-1 text-sm font-medium text-ink-secondary hover:text-ink-primary cursor-pointer">
              Technical details <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {showDetails && (
              <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-bg-subtle p-3 text-xs text-ink-secondary whitespace-pre-wrap break-words">{String(error?.message || error)}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
