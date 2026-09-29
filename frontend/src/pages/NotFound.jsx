import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import useDocumentTitle from '../hooks/useDocumentTitle.js'
import { AddFarmArt } from '../components/illustrations/SmallArt.jsx'
import { BRAND } from '../components/brand/brand.js'

export default function NotFound() {
  useDocumentTitle(`Page not found — ${BRAND.name}`)
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-12">
      <div className="max-w-lg w-full text-center bg-white rounded-xl border border-border-default shadow-md p-8 sm:p-10">
        <AddFarmArt className="w-40 h-36 mx-auto" />
        <p className="mt-4 text-sm font-semibold tracking-widest text-terracotta-600">ERROR 404</p>
        <h1 className="mt-1 text-3xl font-bold text-ink-primary">This row is empty</h1>
        <p className="mt-2 text-ink-secondary">The page you asked for does not exist, or the link is out of date.</p>
        <p className="mt-4 text-xs font-mono text-ink-muted break-all bg-bg-subtle rounded-md px-3 py-2">{typeof window !== 'undefined' ? window.location.pathname : '/'}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-md">
            <Compass className="w-4 h-4" aria-hidden="true" /> Back to home
          </Link>
          <Link to="/dashboard" className="inline-flex items-center min-h-[48px] px-6 rounded-full border-2 border-primary-600 text-primary-700 hover:bg-primary-50 font-medium">
            My Fields
          </Link>
        </div>
      </div>
    </div>
  )
}
