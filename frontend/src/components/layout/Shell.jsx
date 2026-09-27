import Navbar from './Navbar.jsx'

export default function Shell({ children }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-soil-atmosphere text-[#1C1B18] font-sans antialiased selection:bg-[#E8DCC4] selection:text-[#1C1B18]">
      {/* Skip to Content accessible link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#2D5430] focus:text-white focus:font-medium focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2D5430]"
      >
        Skip to main content
      </a>

      {/* Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8" tabIndex="-1">
        {children}
      </main>

      {/* App Footer */}
      <footer className="border-t border-[#E8E2D5] bg-[#FAF8F5]/80 py-6 text-xs text-[#756F63]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="font-serif text-sm text-[#1C1B18]">
            KhetGPT <span className="font-sans text-xs text-[#756F63]">· Punjab Agricultural Fertilizer Portal</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#756F63]">
            <span>ICAR-IISS STCR Calibrated</span>
            <span>•</span>
            <span>PAU Package of Practices</span>
            <span>•</span>
            <span>Live Open-Meteo Agromet</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
