import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Printer, 
  Sun, 
  FileText
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const TIMELINE_STEPS = [
  {
    step: '01',
    title: 'Sowing Basal Placement',
    timing: 'Day 0 · Mid November 2025',
    fertilizers: '9 Bags DAP + 3.5 Bags Potash (MOP)',
    rate: '1.1 Bags DAP/Acre · 0.4 Bag MOP/Acre',
    instruction: 'Drill 4–5 cm below seed level during tractor field prep.',
    isDone: true,
    isCurrent: false,
    statusText: 'Applied 15 Nov ✓',
  },
  {
    step: '02',
    title: 'First Watering / Crown Root (CRI)',
    timing: 'Day 28 · Immediate Window',
    fertilizers: '10 Bags Neem-Coated Urea',
    rate: '1.2 Bags per Acre across 8.5 Acres',
    instruction: 'Broadcast uniformly before opening canal irrigation water.',
    isDone: false,
    isCurrent: true,
    statusText: 'Due Now · Weather Safe',
  },
  {
    step: '03',
    title: 'Second Watering / Booting Stage',
    timing: 'Day 55 · Expected Mid January 2026',
    fertilizers: '10 Bags Neem-Coated Urea',
    rate: '1.2 Bags per Acre across 8.5 Acres',
    instruction: 'Top-dress nitrogen before heading to maximize earhead length.',
    isDone: false,
    isCurrent: false,
    statusText: 'Scheduled for Jan 2026',
  },
];

export default function Schedule() {
  const { fieldId = '1' } = useParams();
  useDocumentTitle('Application Schedule — KhetGPT');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 font-sans text-[#1C1B18]">
      
      {/* 1. Header with Staggered Reveal */}
      <div className="animate-reveal flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
        <div>
          <Link 
            to={`/fields/${fieldId}/recommendation`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#756F63] hover:text-[#1C1B18] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Prescription Docket</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight">
            Application Schedule &amp; Timeline
          </h1>
          <p className="text-sm text-[#756F63] mt-1.5">
            Plot A · 8.5 Acres · Wheat (HD 3086) · Split 2 is due now
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 text-xs font-medium text-[#615C52] hover:text-[#1C1B18] border border-[#DCD6C7] rounded-lg bg-white/80 hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Retailer Purchase Slip</span>
        </button>
      </div>

      {/* 2. Distinctive Application Stepper */}
      <div className="animate-reveal delay-1 space-y-3">
        <div className="text-xs font-medium uppercase tracking-wider text-[#756F63] px-2">
          3-Split Nitrogen Application Protocol
        </div>

        <div className="divide-y divide-[#EAE4D5] border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs overflow-hidden shadow-xs">
          {TIMELINE_STEPS.map((item) => (
            <div
              key={item.step}
              className={`p-5 sm:p-6 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                item.isCurrent ? 'bg-[#FAF8F5]' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`font-serif text-2xl shrink-0 font-medium ${
                    item.isDone
                      ? 'text-[#2D5430]'
                      : item.isCurrent
                      ? 'text-[#B8791E]'
                      : 'text-[#C5BBAA]'
                  }`}
                >
                  {item.step}
                </span>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-serif text-xl text-[#1C1B18]">
                      {item.title}
                    </h2>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        item.isDone
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : item.isCurrent
                          ? 'bg-[#FEF3C7] text-[#92400E]'
                          : 'bg-[#F4F1EA] text-[#756F63]'
                      }`}
                    >
                      {item.statusText}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-[#1C1B18]">
                    {item.fertilizers}
                  </div>

                  <div className="text-xs text-[#756F63]">
                    {item.rate} · {item.timing}
                  </div>

                  <div className="text-xs text-[#8A8477] pt-1">
                    Placement: {item.instruction}
                  </div>
                </div>
              </div>

              {item.isCurrent && (
                <div className="sm:text-right shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#2D5430] font-medium bg-[#DCFCE7]/70 px-3 py-1 rounded-full">
                    <Sun className="w-3.5 h-3.5" />
                    Weather Safe · 0.0mm rain next 48h
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Official Cooperative Dealer Slip (Print-Ready Document) */}
      <div className="animate-reveal delay-2 border border-[#D8CEBC] rounded-2xl bg-white p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#2D5430]" />
            <div>
              <span className="font-serif text-xl text-[#1C1B18] block leading-tight">
                Fertilizer Dealer Purchase Slip
              </span>
              <span className="text-xs text-[#756F63]">
                ਖਾਦ ਖਰੀਦ ਪਰਚੀ · IFFCO / Cooperative Society
              </span>
            </div>
          </div>
          <span className="text-xs text-[#2D5430] font-medium bg-[#DCFCE7] px-2.5 py-1 rounded-full hidden sm:inline">
            Official University Ratio
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pb-4 border-b border-[#E8E2D5]">
          <div>
            <div className="text-[#756F63]">Farmer Name</div>
            <div className="font-semibold text-sm text-[#1C1B18] mt-0.5">Ramesh Patel</div>
          </div>
          <div>
            <div className="text-[#756F63]">Field Plot &amp; Area</div>
            <div className="font-semibold text-sm text-[#1C1B18] mt-0.5">Plot A (8.5 Acres)</div>
          </div>
          <div>
            <div className="text-[#756F63]">Target Crop</div>
            <div className="font-semibold text-sm text-[#1C1B18] mt-0.5">Wheat (HD 3086)</div>
          </div>
          <div>
            <div className="text-[#756F63]">Est. Subsidized Cost</div>
            <div className="font-serif text-lg font-bold text-[#2D5430] mt-0.5">~₹8,450</div>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1.5 border-b border-[#F4F1EA]">
            <span className="text-[#4A463D] font-medium">1. Neem-Coated Urea (45 kg bags)</span>
            <span className="font-semibold text-[#1C1B18]">20 Bags (10 Bags Due Now + 10 Bags Jan)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#F4F1EA]">
            <span className="text-[#4A463D] font-medium">2. DAP — Diammonium Phosphate (50 kg bags)</span>
            <span className="font-semibold text-[#1C1B18]">9 Bags (Drilled at Sowing)</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[#4A463D] font-medium">3. MOP — Muriate of Potash (50 kg bags)</span>
            <span className="font-semibold text-[#1C1B18]">3.5 Bags (Drilled at Sowing)</span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E8E2D5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#756F63]">
          <span>Certified under Punjab Agricultural University Package of Practices.</span>
          <button
            type="button"
            onClick={handlePrint}
            className="text-[#2D5430] font-semibold hover:underline cursor-pointer"
          >
            Click here to print slip
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="animate-reveal delay-3 flex justify-end pt-2">
        <Link
          to={`/fields/${fieldId}/history`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <span>View Past Season Records</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
