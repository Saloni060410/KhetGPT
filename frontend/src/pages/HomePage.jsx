import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Sprout, 
  ArrowUpRight, 
  CheckCircle2, 
  CloudRain, 
  Layers, 
  Scale, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  ChevronRight, 
  ArrowRight,
  Calculator,
  Compass,
  FileCheck
} from 'lucide-react'
import LanguageToggle from '../components/ui/LanguageToggle.jsx'
import { useT } from '../i18n/useT.js'

export default function HomePage({ onNavigate }) {
  const { t, language } = useT()
  const navigate = useNavigate()

  // Live active demo field selection for the immediate on-screen simulator
  const [activeFieldId, setActiveFieldId] = useState('1')

  const handleNav = (e, path) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(path)
    } else {
      navigate(path)
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  // Real agronomy scenarios matching seed database
  const demoFields = {
    '1': {
      id: '1',
      name: language === 'hi' ? 'उत्तर भूखंड • गेहूं (HD-2967)' : 'North Plot • Wheat (HD-2967)',
      crop: language === 'hi' ? 'गेहूं' : 'Wheat',
      variety: 'HD-2967',
      area: '3.5',
      areaUnit: language === 'hi' ? 'एकड़' : 'acres',
      stage: language === 'hi' ? 'कल्ले फूटने की अवस्था (25 दिन)' : 'Tillering Stage (25 DAS)',
      status: language === 'hi' ? 'कम जोखिम • मौसम अनुकूल' : 'Low Risk • Weather Clear',
      recommendation: {
        product: 'Urea (46% N)',
        rate: '35 kg / acre',
        bags: '2.7 bags (45 kg)',
        splitNote: language === 'hi' ? 'पहला शीर्ष छिड़काव (Top-dressing)' : '1st Top-dressing (Vegetative)',
        weatherNote: language === 'hi' ? 'अगले 48 घंटे में भारी बारिश की कोई संभावना नहीं (0.2 मिमी)।' : 'No rain (>15mm) expected in 48h (0.2mm forecast). Clear to apply.',
        nDeficit: '-28 kg/ha',
        pDeficit: 'Balanced (Soil P High)',
        kDeficit: 'Standard maintenance dose',
        formula: 'Net N = Standard (120) - Soil Test (52) - Manure Credit (40) = 28 kg/ha',
      }
    },
    '2': {
      id: '2',
      name: language === 'hi' ? 'दक्षिण टीला • धान (पूसा 1121)' : 'South Ridge • Rice (Pusa 1121)',
      crop: language === 'hi' ? 'धान' : 'Rice',
      variety: 'Pusa 1121',
      area: '5.0',
      areaUnit: language === 'hi' ? 'एकड़' : 'acres',
      stage: language === 'hi' ? 'बुवाई पूर्व / रोपाई (बेसल)' : 'Basal / Pre-Transplant',
      status: language === 'hi' ? 'मध्यम जोखिम • वर्षा प्रतीक्षा' : 'Moderate Risk • Rain Watch',
      recommendation: {
        product: 'DAP (18-46-0) + MOP (60% K2O)',
        rate: '50 kg DAP + 20 kg MOP / acre',
        bags: '5.0 bags DAP + 2.0 bags MOP',
        splitNote: language === 'hi' ? 'बुवाई के समय मिट्टी में मिलाना' : 'Incorporate into soil at puddle/sowing',
        weatherNote: language === 'hi' ? '36 घंटे में 18 मिमी वर्षा का अनुमान। रोपाई के बाद छिड़काव करें।' : '18mm rain expected in 36h. Incorporate into mud or delay until post-rain.',
        nDeficit: '-45 kg/ha',
        pDeficit: '-26 kg/ha (Soil P Low)',
        kDeficit: '-18 kg/ha (Soil K Medium)',
        formula: 'Net P2O5 = Target (60) - Soil Available (34) = 26 kg/ha',
      }
    }
  }

  const currentField = demoFields[activeFieldId] || demoFields['1']

  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col selection:bg-emerald-900 selection:text-emerald-100 antialiased font-sans">
      
      {/* Top Header Bar */}
      <header className="w-full border-b border-stone-800/80 bg-[#070b0e]/95 backdrop-blur-sm z-30 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
              <Sprout className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wider font-mono text-stone-100">
                KHET<span className="text-emerald-400">GPT</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400 -mt-0.5 hidden sm:inline">
                ICAR STCR Agronomy Engine
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-mono text-stone-400">
            <a href="#simulator" className="hover:text-emerald-400 transition-colors">
              {t('landing.exploreEngine')}
            </a>
            <Link to="/fields/1/recommendation" className="hover:text-emerald-400 transition-colors">
              {t('nav.recommendation')}
            </Link>
            <Link to="/fields/1/schedule" className="hover:text-emerald-400 transition-colors">
              {t('nav.schedule')}
            </Link>
            <Link to="/fields/1/risk-check" className="hover:text-emerald-400 transition-colors">
              {t('nav.riskCheck')}
            </Link>
          </nav>

          {/* Controls & Launch CTAs */}
          <div className="flex items-center space-x-3">
            <LanguageToggle />
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white font-mono text-xs transition-colors"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-semibold tracking-wide transition-all shadow-sm shadow-emerald-500/20 flex items-center space-x-1.5"
            >
              <span>{t('landing.launchApp')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Single-Viewport Compact Hero & Live Agronomy Engine Matrix */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-between">
        
        {/* Core Split Section: Value Proposition & Live Simulator */}
        <section id="simulator" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch mb-8">
          
          {/* Left Column: Clear, Real Agronomic Message (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Pillar Badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('landing.badge')}</span>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                {t('landing.headline')}
              </h1>

              {/* Subheadline (Real Copy Only) */}
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {t('landing.subheadline')}
              </p>
            </div>

            {/* Direct Interactive Field Selector Pills */}
            <div className="bg-[#0b0f14] border border-stone-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                <span className="uppercase tracking-wider font-semibold">{t('landing.activeField')}:</span>
                <span className="text-emerald-400 text-[11px] font-bold">2 Live Calibrations</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFieldId('1')}
                  className={`px-3 py-2 rounded-lg text-left text-xs font-mono transition-all border ${
                    activeFieldId === '1'
                      ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="font-semibold text-white">{t('landing.wheatSample')}</div>
                  <div className="text-[11px] text-stone-400 truncate">{t('landing.stageTillering')}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFieldId('2')}
                  className={`px-3 py-2 rounded-lg text-left text-xs font-mono transition-all border ${
                    activeFieldId === '2'
                      ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="font-semibold text-white">{t('landing.riceSample')}</div>
                  <div className="text-[11px] text-stone-400 truncate">{t('landing.stageBasal')}</div>
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/dashboard"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold tracking-wide transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <span>{t('landing.launchApp')}</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <Link
                to={`/fields/${currentField.id}/risk-check`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-stone-700 hover:border-stone-500 bg-stone-900/70 text-stone-200 hover:text-white font-mono text-xs font-semibold transition-all active:scale-95"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('landing.checkMyPlan')}</span>
              </Link>
              <Link
                to={`/fields/${currentField.id}/schedule`}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-stone-800 hover:border-stone-700 bg-stone-900/40 text-stone-400 hover:text-stone-200 font-mono text-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('landing.dealerSchedule')}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Live Interactive Agronomic Card (7 cols) */}
          <div className="lg:col-span-7 bg-[#0b0f14] border border-stone-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            {/* Background subtle technical grid */}
            <div className="absolute inset-0 agri-grid-bg opacity-30 pointer-events-none" />

            <div className="relative space-y-4">
              {/* Card Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800/80">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <span className="font-mono text-xs uppercase tracking-wider text-stone-300 font-bold">
                    {currentField.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-400">
                    {currentField.area} {currentField.areaUnit}
                  </span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-stone-900 border border-stone-700 text-emerald-400 font-mono text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{currentField.status}</span>
                </div>
              </div>

              {/* Main Prescribed Dose for Current Stage */}
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1">
                    {currentField.stage} • {t('recommendation.title')}
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {currentField.recommendation.product}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {currentField.recommendation.splitNote}
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-800">
                  <div className="text-base sm:text-lg font-bold text-emerald-300">
                    {currentField.recommendation.rate}
                  </div>
                  <div className="text-xs text-amber-300 font-medium">
                    {currentField.recommendation.bags}
                  </div>
                </div>
              </div>

              {/* 3 Nutrient Deficit Equation Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800/90 font-mono text-xs">
                  <div className="text-stone-400 text-[11px] uppercase tracking-wider mb-1">Nitrogen (N)</div>
                  <div className="text-emerald-400 font-bold text-sm">{currentField.recommendation.nDeficit}</div>
                  <div className="text-[10px] text-stone-400 mt-1">Urea Split Top-Dress</div>
                </div>
                <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800/90 font-mono text-xs">
                  <div className="text-stone-400 text-[11px] uppercase tracking-wider mb-1">Phosphorus (P)</div>
                  <div className="text-amber-400 font-bold text-sm">{currentField.recommendation.pDeficit}</div>
                  <div className="text-[10px] text-stone-400 mt-1">Soil Health Card Value</div>
                </div>
                <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800/90 font-mono text-xs">
                  <div className="text-stone-400 text-[11px] uppercase tracking-wider mb-1">Potassium (K)</div>
                  <div className="text-blue-400 font-bold text-sm">{currentField.recommendation.kDeficit}</div>
                  <div className="text-[10px] text-stone-400 mt-1">STCR Maintenance Rate</div>
                </div>
              </div>

              {/* Transparent Agronomy Math & Weather Hold Indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Weather check */}
                <div className="p-3 rounded-lg bg-[#0e161a] border border-cyan-900/40 text-xs font-mono space-y-1">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Open-Meteo 48h Weather Forecast</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    {currentField.recommendation.weatherNote}
                  </p>
                </div>

                {/* Formula */}
                <div className="p-3 rounded-lg bg-[#14120b] border border-amber-900/40 text-xs font-mono space-y-1">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
                    <Scale className="w-3.5 h-3.5" />
                    <span>ICAR STCR Equation Working</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-snug truncate">
                    {currentField.recommendation.formula}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Feature Routes to Live Pages */}
            <div className="relative pt-4 mt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <span className="text-stone-400 font-semibold">{t('landing.quickActions')}:</span>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/fields/${currentField.id}/recommendation`}
                  className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-colors flex items-center space-x-1"
                >
                  <span>{t('landing.viewRecommendation')}</span>
                  <ChevronRight className="w-3 h-3 text-emerald-400" />
                </Link>
                <Link
                  to={`/fields/${currentField.id}/schedule`}
                  className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-colors flex items-center space-x-1"
                >
                  <span>{t('landing.viewSchedule')}</span>
                  <ChevronRight className="w-3 h-3 text-emerald-400" />
                </Link>
                <Link
                  to={`/fields/${currentField.id}/risk-check`}
                  className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-colors flex items-center space-x-1"
                >
                  <span>{t('landing.checkRisk')}</span>
                  <ChevronRight className="w-3 h-3 text-emerald-400" />
                </Link>
              </div>
            </div>

          </div>

        </section>

        {/* The 4 Core Real-Copy Agronomic Pillars (No invented stats, no fake testimonials) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Pillar 1: STCR Equations */}
          <div className="p-4 rounded-xl bg-[#0b0f14] border border-stone-800/80 hover:border-stone-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {t('landing.pillar1Title')}
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                {t('landing.pillar1Desc')}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-800/60 font-mono text-[11px] text-emerald-400">
              Native N-P-K Subtraction
            </div>
          </div>

          {/* Pillar 2: 48h Rain Holds */}
          <div className="p-4 rounded-xl bg-[#0b0f14] border border-stone-800/80 hover:border-stone-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <CloudRain className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {t('landing.pillar2Title')}
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                {t('landing.pillar2Desc')}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-800/60 font-mono text-[11px] text-cyan-400">
              Open-Meteo Integration
            </div>
          </div>

          {/* Pillar 3: Commercial Bag Units */}
          <div className="p-4 rounded-xl bg-[#0b0f14] border border-stone-800/80 hover:border-stone-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {t('landing.pillar3Title')}
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                {t('landing.pillar3Desc')}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-800/60 font-mono text-[11px] text-amber-400">
              45 kg Urea / 50 kg DAP
            </div>
          </div>

          {/* Pillar 4: Prior Manure Credits */}
          <div className="p-4 rounded-xl bg-[#0b0f14] border border-stone-800/80 hover:border-stone-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Scale className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {t('landing.pillar4Title')}
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                {t('landing.pillar4Desc')}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-800/60 font-mono text-[11px] text-emerald-400">
              Organic Manure Deductions
            </div>
          </div>

        </section>

      </main>

      {/* Minimal Engineering Footer */}
      <footer className="border-t border-stone-800/80 py-4 px-4 sm:px-6 lg:px-8 bg-[#05080a] text-xs font-mono text-stone-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 font-bold">KHETGPT</span>
            <span>•</span>
            <span>Open Soil Test Deficit Standards (ICAR STCR)</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-stone-400">
            <Link to="/fields/1/recommendation" className="hover:text-stone-200">
              Recommendation
            </Link>
            <Link to="/fields/1/schedule" className="hover:text-stone-200">
              Schedule (PDF)
            </Link>
            <Link to="/fields/1/risk-check" className="hover:text-stone-200">
              Risk Check
            </Link>
            <Link to="/kit" className="hover:text-stone-200">
              Component Kit
            </Link>
            <Link to="/dashboard" className="text-emerald-400 hover:text-emerald-300 font-bold">
              Launch App →
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
