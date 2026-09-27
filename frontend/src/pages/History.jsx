import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  FlaskConical 
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const SEASONS_DATA = [
  {
    id: 'rabi-2024',
    season: 'Rabi 2024–25',
    status: 'In Progress (CRI Stage)',
    isCurrent: true,
    crop: 'Wheat (HD 3086)',
    acres: '8.5 Acres',
    fertilizers: '20 Bags Urea · 9 Bags DAP · 3.5 Bags Potash',
    yieldOutcome: 'Target: 23+ Quintals/Acre',
    savings: '₹3,400 Saved',
    soilTest: 'pH 7.4 · OC 0.48% · P 16.0 kg/ha',
  },
  {
    id: 'kharif-2024',
    season: 'Kharif 2024',
    status: 'Harvested Oct 2024 ✓',
    isCurrent: false,
    crop: 'Paddy / Rice (PR 126)',
    acres: '8.5 Acres',
    fertilizers: '18 Bags Urea · 4 Bags Zinc Sulphate',
    yieldOutcome: 'Achieved: 31.2 Quintals/Acre (+8.5% over district avg)',
    savings: '₹3,600 Saved',
    soilTest: 'pH 7.5 · OC 0.45% · P 15.5 kg/ha',
  },
  {
    id: 'rabi-2023',
    season: 'Rabi 2023–24',
    status: 'Harvested April 2024 ✓',
    isCurrent: false,
    crop: 'Wheat (PBW 725)',
    acres: '8.5 Acres',
    fertilizers: '22 Bags Urea · 9 Bags DAP · 4 Bags Potash',
    yieldOutcome: 'Achieved: 22.8 Quintals/Acre',
    savings: '₹4,200 Saved',
    soilTest: 'pH 7.6 · OC 0.42% · P 14.0 kg/ha',
  },
];

export default function History() {
  const { fieldId = '1' } = useParams();
  useDocumentTitle('Season Archive & Soil Ledger — KhetGPT');

  return (
    <div className="space-y-8 font-sans text-[#1C1B18]">
      
      {/* 1. Header with Staggered Reveal */}
      <div className="animate-reveal flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
        <div>
          <Link 
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#756F63] hover:text-[#1C1B18] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Field Operations</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight">
            Season Archive &amp; Soil Ledger
          </h1>
          <p className="text-sm text-[#756F63] mt-1.5">
            Plot A · 8.5 Acres · Ludhiana North Farm · 3 continuous seasons tracked
          </p>
        </div>

        <Link
          to={`/fields/${fieldId}/soil`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#DCD6C7] hover:border-[#1C1B18] text-[#1C1B18] text-xs font-medium bg-white/80 hover:bg-white transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <FlaskConical className="w-3.5 h-3.5 text-[#756F63]" />
          <span>Enter New Soil Test</span>
        </Link>
      </div>

      {/* 2. Lifetime Impact Docket */}
      <div className="animate-reveal delay-1 p-6 rounded-2xl border border-[#D8CEBC] bg-white/80 backdrop-blur-xs grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-xs">
        <div>
          <div className="text-xs text-[#756F63] uppercase tracking-wider">Total Tracked</div>
          <div className="font-serif text-2xl text-[#1C1B18] mt-1">3 Crop Seasons</div>
          <div className="text-xs text-[#756F63] mt-0.5">Continuous field records</div>
        </div>

        <div>
          <div className="text-xs text-[#756F63] uppercase tracking-wider">Cumulative Savings</div>
          <div className="font-serif text-2xl text-[#2D5430] mt-1">₹11,200 Saved</div>
          <div className="text-xs text-[#756F63] mt-0.5">Avoided uncalibrated fertilizer</div>
        </div>

        <div>
          <div className="text-xs text-[#756F63] uppercase tracking-wider">Excess Nitrogen Prevented</div>
          <div className="font-serif text-2xl text-[#2D5430] mt-1">95 kg Cut</div>
          <div className="text-xs text-[#756F63] mt-0.5">Groundwater leaching prevented</div>
        </div>
      </div>

      {/* 3. Season Log Journal Rows */}
      <div className="animate-reveal delay-2 space-y-3">
        <div className="text-xs font-medium uppercase tracking-wider text-[#756F63] px-2">
          Season Archive Ledger
        </div>

        <div className="divide-y divide-[#EAE4D5] border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs shadow-xs overflow-hidden">
          {SEASONS_DATA.map((item) => (
            <div
              key={item.id}
              className="p-5 sm:p-6 hover:bg-[#FAF8F5] transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-xl text-[#1C1B18]">
                    {item.season}
                  </span>
                  <span className="text-sm font-medium text-[#756F63]">
                    · {item.crop}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      item.isCurrent
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#DCFCE7] text-[#166534]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="font-serif text-lg text-[#2D5430]">
                  {item.savings}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                <div>
                  <span className="text-[#756F63] block">Prescribed Application:</span>
                  <span className="font-medium text-[#1C1B18]">{item.fertilizers}</span>
                </div>
                <div>
                  <span className="text-[#756F63] block">Soil Baseline At Sowing:</span>
                  <span className="font-medium text-[#1C1B18]">{item.soilTest}</span>
                </div>
                <div>
                  <span className="text-[#756F63] block">Harvest Yield:</span>
                  <span className="font-semibold text-[#2D5430]">{item.yieldOutcome}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Soil Improvement Progression */}
      <div className="animate-reveal delay-3 border border-[#D8CEBC] rounded-2xl bg-white/70 backdrop-blur-xs p-6 space-y-4 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#756F63]">
          3-Year Soil Quality Improvement (Plot A)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
            <div className="text-[#756F63]">Organic Carbon (OC %)</div>
            <div className="font-serif text-2xl text-[#2D5430] mt-1">
              0.42% → 0.48% (+14%)
            </div>
            <div className="text-[11px] text-[#756F63] mt-1">
              Balanced chemical dosing allows beneficial soil microbiology to recover.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
            <div className="text-[#756F63]">Soil Reaction (pH)</div>
            <div className="font-serif text-2xl text-[#1C1B18] mt-1">
              7.6 → 7.4 (Optimal Neutral)
            </div>
            <div className="text-[11px] text-[#756F63] mt-1">
              Balanced neutral pH ensures optimal nutrient root uptake efficiency.
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="animate-reveal delay-3 flex justify-end pt-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <span>Return to Field Operations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
