import Navbar from './Navbar.jsx'

export default function Shell({ children }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-bg-base text-ink-primary font-sans antialiased selection:bg-primary-100 selection:text-primary-900">
      {/* Skip to Content accessible link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-primary-600 focus:text-ink-inverse focus:font-bold focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-700"
      >
        Skip to main content
      </a>

      {/* Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" tabIndex="-1">
        {children}
      </main>

      {/* App Footer */}
      <footer className="border-t border-border-default bg-bg-surface py-5 text-xs text-ink-secondary">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© 2026 KhetGPT — Sustainable Fertilizer Optimizer</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-ink-muted">
            <span>Deficit Engine</span>
            <span>•</span>
            <span>Open-Meteo</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
