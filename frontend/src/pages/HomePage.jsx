import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SoilScroll from '../components/SoilScroll';
import LanguageToggle from '../components/ui/LanguageToggle.jsx';
import { useT } from '../i18n/useT.js';
import { 
  Sprout, 
  ArrowUpRight, 
  DollarSign, 
  TrendingDown, 
  CloudSun, 
  ChevronDown
} from 'lucide-react';

export default function HomePage({ onNavigate }) {
  const { t } = useT();
  const navigate = useNavigate();
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Keep visible at very top of page
      if (currentScrollY < 80) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollYRef.current + 6) {
        // Scrolling down: hide header so animation viewport has 100% full-screen height
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollYRef.current - 10) {
        // Scrolling up: reveal header smoothly
        setHeaderVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (e, path) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col selection:bg-stone-800 selection:text-white">
      
      {/* Top Fixed Header with smooth auto-hide on scroll */}
      <header className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-[#070b0e]/85 border-b border-stone-800/60 px-6 sm:px-10 py-4 transition-all duration-300 ${
        headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={(e) => handleNav(e, '/')}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-wider font-mono text-stone-100">
              KHET<span className="text-emerald-400">GPT</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-xs font-mono text-stone-400">
            <a href="#scrollytelling" className="hover:text-stone-100 transition-colors">Strata Core</a>
            <a href="#economics" className="hover:text-stone-100 transition-colors">Input Economics</a>
            <a href="/optimizer" onClick={(e) => handleNav(e, '/optimizer')} className="hover:text-emerald-300 transition-colors">Field Optimizer</a>
            <a href="/dashboard" onClick={(e) => handleNav(e, '/dashboard')} className="hover:text-emerald-300 transition-colors">App Dashboard</a>
          </div>

          <div className="flex items-center space-x-3">
            <LanguageToggle />
            <a
              href="/login"
              onClick={(e) => handleNav(e, '/login')}
              className="px-3.5 py-1.5 rounded-full border border-stone-800 hover:border-stone-600 text-stone-300 hover:text-white font-mono text-xs transition-colors"
            >
              {t('nav.login')}
            </a>
            <a
              href="/dashboard"
              onClick={(e) => handleNav(e, '/dashboard')}
              className="px-4 py-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-mono text-xs font-medium tracking-wide transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-400/20"
            >
              Launch App
            </a>
          </div>
        </div>
      </header>

      {/* Hero Intro Section */}
      <section className="pt-36 pb-20 px-6 sm:px-8 max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-stone-400 mb-6">
          Agronomic Research & Variable-Rate Delivery
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-[1.15] mb-6">
          Subsurface Root Architecture & Soil Nitrogen Dynamics
        </h1>

        <p className="text-sm sm:text-base text-stone-400 max-w-2xl leading-relaxed mb-10 font-normal">
          Conventional agriculture applies up to 35% more synthetic N-P-K than root systems can absorb. The unabsorbed surplus oxidizes soil carbon, generates hardpan compaction, and leaches into groundwater.
        </p>

        {/* Scroll Prompt */}
        <a 
          href="#scrollytelling" 
          className="inline-flex flex-col items-center space-y-2 text-stone-500 hover:text-stone-300 transition-colors font-mono text-xs group"
        >
          <span className="tracking-wider uppercase text-[11px]">Scroll to Inspect Soil Core</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce group-hover:text-white" />
        </a>
      </section>

      {/* Seamless Transition into Dark Soil Scrollytelling */}
      <div className="h-24 bg-gradient-to-b from-[#070b0e] to-[#000000]" />

      {/* THE STICKY CANVAS SCROLLYTELLING COMPONENT */}
      <div id="scrollytelling" className="relative w-full bg-[#000000]">
        <SoilScroll />
      </div>

      {/* Seamless Transition out of Dark Soil Scrollytelling */}
      <div className="h-24 bg-gradient-to-b from-[#000000] to-[#070b0e]" />

      {/* Post-Scroll Scientific & Economic Proof Grid */}
      <section id="economics" className="py-24 px-6 sm:px-10 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-stone-400 mb-3">
            Operational Methodology
          </div>
          <h2 className="text-2xl sm:text-4xl font-medium text-white tracking-tight">
            Synchronized to Biological Uptake Curves
          </h2>
          <p className="text-sm text-stone-400 mt-3 leading-relaxed">
            Replacing broad-brush bulk applications with prescription rates matched to root-zone biological availability and local rainfall incorporation windows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-[#0b0f13] border border-stone-800/80 transition-all hover:border-stone-700">
            <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300 mb-6">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white mb-2">Eliminate 35% Input Waste</h3>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed mb-6">
              Average input cost savings of $48.20/acre by eliminating unabsorbed urea and phosphorus runoff before application.
            </p>
            <div className="font-mono text-xs text-stone-300 pt-4 border-t border-stone-800">
              Avg. $11,500 retained per 240 acres
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-[#0b0f13] border border-stone-800/80 transition-all hover:border-stone-700">
            <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300 mb-6">
              <TrendingDown className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white mb-2">Prevent Subsoil Hardpan</h3>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed mb-6">
              Humic and mycorrhizal chelation keeps soil aggregate channels open, allowing deep 60+ cm root penetration and drought resilience.
            </p>
            <div className="font-mono text-xs text-stone-300 pt-4 border-t border-stone-800">
              +12.4% soil moisture holding capacity
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-[#0b0f13] border border-stone-800/80 transition-all hover:border-stone-700">
            <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300 mb-6">
              <CloudSun className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white mb-2">Predictive Rain Windows</h3>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed mb-6">
              Application runs are calibrated to hyper-local 48-hour precipitation and soil temperature thresholds to ensure optimal incorporation.
            </p>
            <div className="font-mono text-xs text-stone-300 pt-4 border-t border-stone-800">
              Zero washout runoff hazard
            </div>
          </div>

        </div>
      </section>

      {/* Machine Telematics Compatibility Strip */}
      <section id="compatibility" className="py-14 border-y border-stone-800/80 bg-[#090d10] px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
              Telematics Compatibility
            </div>
            <p className="text-sm text-stone-300 font-normal">
              Direct prescription export via standard ISO-XML and Shapefile formats.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-stone-400">
            <span className="px-3.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300">
              John Deere Operations Center
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300">
              Raven Slingshot
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300">
              Trimble Ag
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300">
              Climate FieldView
            </span>
          </div>
        </div>
      </section>

      {/* Final Action Section */}
      <section className="py-28 px-6 text-center max-w-3xl mx-auto">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-stone-400 mb-4">
          Field Deployment
        </div>
        <h2 className="text-3xl sm:text-4xl font-medium text-white tracking-tight mb-4">
          Calculate Variable-Rate Prescription
        </h2>
        <p className="text-sm text-stone-400 mb-8 max-w-xl mx-auto leading-relaxed">
          Input your acreage, crop type, and soil test numbers to generate an immediate, field-calibrated application plan.
        </p>
        <a
          href="/optimizer"
          onClick={(e) => handleNav(e, '/optimizer')}
          className="inline-flex items-center space-x-2 px-7 py-3 rounded-full bg-white text-black hover:bg-stone-200 font-mono text-xs uppercase tracking-wider font-semibold transition-all active:scale-95 cursor-pointer"
        >
          <span>Open Field Optimizer</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-stone-900 py-8 px-6 text-center text-xs font-mono text-stone-600">
        © {new Date().getFullYear()} TerraYield Ag. Precision Agronomic Research OS.
      </footer>

    </div>
  );
}
