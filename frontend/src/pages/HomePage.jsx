import { useNavigate } from 'react-router-dom';
import SoilScroll from '../components/SoilScroll.jsx';
import LanguageToggle from '../components/ui/LanguageToggle.jsx';
import {
  WheatIcon,
} from '../components/icons/CropIcons.jsx';
import {
  ArrowRight,
} from 'lucide-react';

export default function HomePage({ onNavigate }) {
  const navigate = useNavigate();

  const handleNav = (e, path) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-soil-atmosphere text-[#1C1B18] font-sans selection:bg-[#E8DCC4] selection:text-[#1C1B18]">

      {/* ================= 1. FLOATING BESPOKE NAV DOCKET ================= */}
      <div className="sticky top-4 z-40 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <header className="bg-[#1C1B18]/95 backdrop-blur-md text-[#FAF8F5] rounded-2xl px-5 sm:px-7 py-3.5 flex items-center justify-between shadow-lg border border-[#3E382E]">
          
          {/* Brand Mark with DM Serif Display */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(e) => handleNav(e, '/')}
          >
            <div className="w-8 h-8 rounded-lg bg-[#2D5430] flex items-center justify-center shadow-xs">
              <WheatIcon size={24} accentColor="#FAF8F5" inkColor="#1C1B18" />
            </div>
            <span className="font-serif text-2xl tracking-tight text-[#FAF8F5]">
              Khet<span className="text-[#B8791E]">GPT</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-sans font-medium text-[#C5BBAA]">
            <button 
              type="button" 
              onClick={() => scrollTo('soil-cross-section')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Soil Core
            </button>
            <button 
              type="button" 
              onClick={() => scrollTo('formula-story')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Method
            </button>
            <button 
              type="button" 
              onClick={() => scrollTo('coverage')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Scope
            </button>
            <button 
              type="button" 
              onClick={(e) => handleNav(e, '/fields/1/soil')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Soil Test
            </button>
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button
              type="button"
              onClick={(e) => handleNav(e, '/dashboard')}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium tracking-wide shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Field Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      </div>

      <main>
        
        {/* ================= 2. HERO SECTION ================= */}
        <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-6 sm:px-12 max-w-6xl mx-auto overflow-hidden">
          
          <div className="absolute -top-4 right-12 opacity-10 pointer-events-none hidden lg:block transform rotate-12">
            <WheatIcon size={120} accentColor="#B8791E" inkColor="#1C1B18" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 flex flex-col items-start text-left animate-reveal">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#D8CEBC] text-[#2D5430] text-xs font-medium tracking-wider uppercase mb-5 shadow-2xs">
                <span>PAU PACKAGE OF PRACTICES · ICAR-IISS STCR</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.12] text-[#1C1B18] mb-6">
                Fertilizer doses calculated from real published university field trials, calibrated for your soil test.
              </h1>

              <div className="animate-reveal delay-1 p-4 rounded-xl bg-white/75 border border-[#D8CEBC] text-[#1C1B18] text-xs sm:text-sm mb-7 max-w-xl shadow-2xs">
                <span className="font-semibold text-[#B8791E]">123.6 kg/ha Nitrogen</span>: Punjab Agricultural University&apos;s published baseline rate for timely sown irrigated wheat.
              </div>

              <div className="animate-reveal delay-2 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={(e) => handleNav(e, '/fields/1/soil')}
                  className="w-full sm:w-auto px-7 py-3 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white font-medium text-sm tracking-wide shadow-xs transition-all active:scale-95 cursor-pointer text-center"
                >
                  Calibrate Soil Test →
                </button>
                <button
                  type="button"
                  onClick={(e) => handleNav(e, '/fields/1/recommendation')}
                  className="w-full sm:w-auto px-7 py-3 rounded-lg border border-[#D8CEBC] hover:border-[#1C1B18] bg-white/80 hover:bg-white text-[#1C1B18] font-medium text-sm tracking-wide transition-all active:scale-95 cursor-pointer text-center shadow-2xs flex items-center justify-center gap-2"
                >
                  <span>View Crop Prescriptions →</span>
                </button>
              </div>

              <p className="text-xs text-[#756F63] mt-6">
                Engineered for Punjab wheat, barley, rice, maize, cotton, sugarcane, and chickpea growers.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center animate-reveal delay-2">
              <div className="w-full rounded-2xl overflow-hidden border border-[#D8CEBC] bg-white shadow-xs">
                <img
                  src="/punjab_wheat_field.jpg"
                  alt="Documentary agronomic trial plot in Ludhiana Punjab showing drill-sown wheat seedlings on fertile alluvial loam soil"
                  className="w-full h-72 sm:h-84 object-cover"
                  loading="eager"
                  width="600"
                  height="450"
                />
                <div className="p-4 bg-white/90 border-t border-[#E8E2D5] text-xs text-[#756F63] flex items-center justify-between">
                  <span className="font-medium text-[#1C1B18]">Field Trial Plot · Ludhiana District</span>
                  <span className="text-[#2D5430] font-medium">Sandy Loam Horizon</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ================= 3. SCROLL-DRIVEN SOIL CORE ================= */}
        <div className="h-16 bg-gradient-to-b from-[#F8F5EE] to-black" />

        <div id="soil-cross-section" className="relative w-full bg-black">
          <SoilScroll />
        </div>

        <div className="h-16 bg-gradient-to-b from-black to-[#F8F5EE]" />

        {/* ================= 4. THREE-TERM METHOD ================= */}
        <section id="formula-story" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto">
          
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#2D5430] mb-2">
              Agronomic Method
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight mb-4">
              The Three-Term Calculation Formula
            </h2>
            <p className="text-sm sm:text-base text-[#756F63] leading-relaxed">
              Commercial fertilizer apps treat crop nutrition as a black box. KhetGPT uses the transparent deficit methodology established by Punjab Agricultural University and the Indian Council of Agricultural Research:
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-white/80 border border-[#D8CEBC] mb-10 shadow-xs backdrop-blur-xs">
            <div className="text-xs uppercase tracking-widest text-[#B8791E] font-semibold mb-3">
              Deficit Formula Architecture
            </div>
            <div className="font-serif text-xl sm:text-2xl text-[#1C1B18] flex flex-wrap items-center gap-3 leading-snug">
              <span className="bg-[#FAF8F5] px-3.5 py-1.5 rounded-lg border border-[#DCD6C7]">
                Fertilizer Needed
              </span>
              <span className="text-[#B8791E] font-bold">=</span>
              <span className="bg-[#2D5430] text-white px-3.5 py-1.5 rounded-lg">
                Standard PAU Dose
              </span>
              <span className="text-[#B8791E] font-bold">+</span>
              <span className="bg-[#3F6273] text-white px-3.5 py-1.5 rounded-lg">
                Soil-Test Adjustment
              </span>
              <span className="text-[#B8791E] font-bold">−</span>
              <span className="bg-[#9C4530] text-white px-3.5 py-1.5 rounded-lg">
                Prior Credit
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            <div className="p-6 rounded-2xl bg-white/75 border border-[#D8CEBC] shadow-xs backdrop-blur-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#2D5430] font-semibold block mb-2">
                  Term 1 · Base Requirement
                </span>
                <h3 className="font-serif text-xl text-[#1C1B18] mb-2">
                  Standard Published Dose
                </h3>
                <p className="text-xs text-[#756F63] leading-relaxed">
                  Published nutrient benchmark from PAU Package of Practices for optimal crop yield across Punjab agro-climatic zones.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8E2D5] text-[11px] font-medium text-[#2D5430]">
                Source: PAU Research Tables
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/75 border border-[#D8CEBC] shadow-xs backdrop-blur-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#3F6273] font-semibold block mb-2">
                  Term 2 · Soil Fertility Offset
                </span>
                <h3 className="font-serif text-xl text-[#1C1B18] mb-2">
                  ICAR-IISS Calibration
                </h3>
                <p className="text-xs text-[#756F63] leading-relaxed">
                  Adjustment based on laboratory soil test readings. Low soil phosphorus increases base dose by 25%; high soil phosphorus decreases base dose by 25%.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8E2D5] text-[11px] font-medium text-[#3F6273]">
                Source: ICAR-IISS STCR Matrix
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/75 border border-[#D8CEBC] shadow-xs backdrop-blur-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#9C4530] font-semibold block mb-2">
                  Term 3 · Organic &amp; Basal Credit
                </span>
                <h3 className="font-serif text-xl text-[#1C1B18] mb-2">
                  Prior Season Credit
                </h3>
                <p className="text-xs text-[#756F63] leading-relaxed">
                  Full nutrient credit for green manuring with dhaincha, farmyard manure incorporation, or basal DAP drilled at sowing.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8E2D5] text-[11px] font-medium text-[#9C4530]">
                Source: Farmer&apos;s Field History
              </div>
            </div>

          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#1C1B18] text-[#FAF8F5] border border-[#3E382E] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#3E382E]">
              <span className="text-xs uppercase tracking-wider text-[#B8791E] font-semibold">
                Worked Example: Irrigated Wheat, Ludhiana District
              </span>
              <span className="text-xs text-[#C5BBAA]">
                Soil: Sandy Loam · Low N, Medium P, High K
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-[#25231F] rounded-xl border border-[#3E382E]">
                <span className="text-[#8C8474] block text-[10px]">1. Standard PAU Base:</span>
                <span className="text-white font-serif text-lg">120 kg N/ha</span>
              </div>
              <div className="p-3.5 bg-[#25231F] rounded-xl border border-[#3E382E]">
                <span className="text-[#8C8474] block text-[10px]">2. Soil-Test Adjustment:</span>
                <span className="text-[#B8791E] font-serif text-lg">+30 kg N (+25%)</span>
              </div>
              <div className="p-3.5 bg-[#25231F] rounded-xl border border-[#3E382E]">
                <span className="text-[#8C8474] block text-[10px]">3. Sowing DAP Credit:</span>
                <span className="text-[#9C4530] font-serif text-lg">−18 kg N (1 bag)</span>
              </div>
              <div className="p-3.5 bg-[#2D5430] rounded-xl border border-[#486E42]">
                <span className="text-[#D8D0BF] block text-[10px]">Net Field Dose:</span>
                <span className="text-white font-serif text-lg">132 kg N/ha</span>
              </div>
            </div>
            
            <p className="text-xs text-[#C5BBAA] mt-4 leading-relaxed">
              The net dose translates to exactly 2.9 bags of Urea per acre, split into 50% at first crown-root irrigation (21–28 days) and 50% before panicle emergence.
            </p>
          </div>

        </section>

        {/* ================= 5. COVERAGE SCOPE ================= */}
        <section id="coverage" className="py-16 px-6 sm:px-12 max-w-6xl mx-auto border-t border-[#E8E2D5]">
          
          <div className="max-w-2xl mb-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#2D5430] mb-2">
              Verified Scope
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight mb-2">
              Real Data Coverage
            </h2>
            <p className="text-xs sm:text-sm text-[#756F63]">
              We report only the verified scope programmed into this prototype. Zero invented adoption numbers.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl bg-white/75 border border-[#D8CEBC] shadow-xs backdrop-blur-xs">
              <div className="font-serif text-4xl text-[#2D5430] mb-1">7</div>
              <div className="text-xs font-semibold text-[#1C1B18]">Punjab Field Crops</div>
              <p className="text-xs text-[#756F63] mt-1.5 leading-relaxed">Wheat, barley, rice, maize, cotton, sugarcane, and chickpea.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/75 border border-[#D8CEBC] shadow-xs backdrop-blur-xs">
              <div className="font-serif text-4xl text-[#B8791E] mb-1">14</div>
              <div className="text-xs font-semibold text-[#1C1B18]">Punjab Districts</div>
              <p className="text-xs text-[#756F63] mt-1.5 leading-relaxed">Mapped across Central Plains, South-Western, and Malwa zones.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/75 border border-[#D8CEBC] shadow-xs backdrop-blur-xs">
              <div className="font-serif text-4xl text-[#3F6273] mb-1">3</div>
              <div className="text-xs font-semibold text-[#1C1B18]">Agronomic Frameworks</div>
              <p className="text-xs text-[#756F63] mt-1.5 leading-relaxed">PAU Package of Practices, ICAR-IISS STCR, and IMD Agromet.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/75 border border-[#D8CEBC] shadow-xs backdrop-blur-xs">
              <div className="font-serif text-4xl text-[#1C1B18] mb-1">0</div>
              <div className="text-xs font-semibold text-[#1C1B18]">Proprietary Guesswork</div>
              <p className="text-xs text-[#756F63] mt-1.5 leading-relaxed">Every calculation is traceable to published research pages.</p>
            </div>
          </div>
        </section>



      </main>

      {/* ================= 10. REFINED FOOTER ================= */}
      <footer className="bg-[#1C1B18] text-[#FAF8F5] pt-14 pb-12 px-6 sm:px-12 border-t border-[#3E382E]">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#3E382E] text-xs">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2D5430] flex items-center justify-center">
                  <WheatIcon size={20} accentColor="#FAF8F5" inkColor="#1C1B18" />
                </div>
                <span className="font-serif text-xl tracking-tight text-[#FAF8F5]">
                  Khet<span className="text-[#B8791E]">GPT</span>
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#25231F] border border-[#3E382E] text-xs text-[#C5BBAA] leading-relaxed">
                <strong className="text-white block mb-1">Academic Prototype Disclaimer:</strong>
                KhetGPT was developed for an agronomy hackathon using published agricultural research. It is a research prototype, not commercial extension advice. Always verify final application rates with your district Krishi Vigyan Kendra (KVK) or Block Agriculture Officer.
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="font-semibold text-[#B8791E] uppercase tracking-wider text-xs">
                Contents
              </div>
              <ul className="space-y-1.5 text-[#C5BBAA] text-xs">
                <li><button type="button" onClick={() => scrollTo('soil-cross-section')} className="hover:text-white transition-colors cursor-pointer">Soil Cross-Section</button></li>
                <li><button type="button" onClick={() => scrollTo('formula-story')} className="hover:text-white transition-colors cursor-pointer">Three-Term Formula</button></li>
                <li><button type="button" onClick={() => scrollTo('coverage')} className="hover:text-white transition-colors cursor-pointer">Verified Scope</button></li>
                <li><a href="/fields/1/soil" onClick={(e) => handleNav(e, '/fields/1/soil')} className="hover:text-white transition-colors">Soil Health Calibration</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="font-semibold text-[#B8791E] uppercase tracking-wider text-xs">
                Language &amp; Tools
              </div>
              <div className="pt-1">
                <LanguageToggle />
              </div>
              <ul className="space-y-1.5 text-[#C5BBAA] text-xs pt-1">
                <li><a href="/dashboard" onClick={(e) => handleNav(e, '/dashboard')} className="hover:text-white transition-colors">Farmer Field Ledger</a></li>
                <li><a href="/fields/1/soil" onClick={(e) => handleNav(e, '/fields/1/soil')} className="hover:text-white transition-colors">Soil Test Calibration</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8C8474]">
            <div>KhetGPT · Open Agronomy Research Prototype (Punjab)</div>
            <div>Built with PAU Package of Practices &amp; ICAR-IISS STCR Data</div>
          </div>

        </div>
      </footer>

    </div>
  );
}
