import { useEffect } from 'react';
import { X, RotateCw, ArrowRight } from 'lucide-react';
import Crop3DViewer from './Crop3DViewer.jsx';

const CROP_AGRONOMY_DATA = {
  wheat: {
    name: 'Wheat (ਕਣਕ · गेहूं)',
    variety: 'PBW 824 / HD 3086 / DBW 187',
    season: 'Rabi Season (Nov Sowing · April Harvest)',
    cycle: '135–145 Days',
    standardN: '123.6 kg N · 62.5 kg P₂O₅ · 30 kg K₂O / ha',
    bagsPerAcre: '2.5 Bags Urea · 1.1 Bags DAP · 0.4 Bag Potash (MOP)',
    placement: 'Drill DAP & MOP 4–5 cm below seed level. Split urea at CRI (21–28 days) and booting (55 days).',
    irrigation: '4–5 Irrigations. 1st irrigation at Crown Root Initiation is critical for tiller survival.',
    source: 'PAU Package of Practices (Rabi, Table 3.2)',
  },
  barley: {
    name: 'Barley (ਜੌਂ · जौ)',
    variety: 'PL 891 / DWRB 123 (Malt & Feed Varieties)',
    season: 'Rabi Season (Mid Oct – Nov Sowing · March Harvest)',
    cycle: '120–130 Days',
    standardN: '62.5 kg N · 30 kg P₂O₅ · 15 kg K₂O / ha',
    bagsPerAcre: '1.4 Bags Urea · 0.6 Bag DAP · 0.3 Bag Potash (MOP)',
    placement: 'Full phosphorus & potash at sowing. Top-dress remaining nitrogen with 1st irrigation.',
    irrigation: '2–3 Irrigations. Highly drought-tolerant with low water requirement compared to wheat.',
    source: 'PAU Package of Practices (Rabi, Table 5.1)',
  },
  rice: {
    name: 'Rice / Paddy (ਝੋਨਾ · धान)',
    variety: 'PR 126 / Pusa Basmati 1121 / Pusa 1509',
    season: 'Kharif Season (June Transplanting · Oct Harvest)',
    cycle: '120–140 Days',
    standardN: '120 kg N · 30 kg P₂O₅ · 30 kg K₂O / ha',
    bagsPerAcre: '2.4 Bags Urea · 0.6 Bag DAP · 0.6 Bag Potash · 25 kg Zinc',
    placement: 'Apply DAP & Potash during puddle settling. Broadcast Urea in 3 equal splits (7, 21, 42 days).',
    irrigation: 'Maintain thin water layer during tillering. Drain standing water before top-dressing urea.',
    source: 'PAU Package of Practices (Kharif, Table 2.4)',
  },
  maize: {
    name: 'Maize (ਮੱਕੀ · मक्का)',
    variety: 'PMH 1 / PMH 13 / DKC 9108',
    season: 'Kharif / Spring Season (June or Feb Sowing)',
    cycle: '95–105 Days',
    standardN: '125 kg N · 60 kg P₂O₅ · 30 kg K₂O / ha',
    bagsPerAcre: '2.6 Bags Urea · 1.2 Bags DAP · 0.6 Bag Potash',
    placement: 'Drill all P & K at sowing. Split urea into 3: sowing, knee-high (V6), and pre-tasseling.',
    irrigation: 'Sensitive to waterlogging. Ensure excellent field drainage and avoid flood pools.',
    source: 'PAU Package of Practices (Kharif, Table 4.1)',
  },
  cotton: {
    name: 'Bt Cotton (ਨਰਮਾ · कपास)',
    variety: 'RCH 659 / Bioseed 6588 (American Bt Hybrids)',
    season: 'Kharif Season (April–May Sowing · Oct–Nov Picking)',
    cycle: '160–180 Days',
    standardN: '75 kg N · 30 kg P₂O₅ / ha',
    bagsPerAcre: '1.6 Bags Urea · 0.6 Bag DAP · Foliar KNO₃ spray',
    placement: 'Basal DAP at field prep. Half urea at thinning; half urea at first flower emergence.',
    irrigation: 'Deep furrow irrigation. Avoid excessive vegetative watering before flowering.',
    source: 'PAU Package of Practices (Kharif, Table 7.3)',
  },
  sugarcane: {
    name: 'Sugarcane (ਗੰਨਾ · गन्ना)',
    variety: 'CoJ 88 / CoPb 92 / Co 0238',
    season: 'Spring / Autumn Planting (Perennial Ratoonable)',
    cycle: '300–360 Days',
    standardN: '150 kg N / ha (Ratoon: 225 kg N / ha)',
    bagsPerAcre: '3.3 Bags Urea · 1.0 Bag DAP · 1.0 Bag Potash',
    placement: 'Place DAP in furrow bottoms below setts. Apply urea splits before monsoon onset.',
    irrigation: 'High water requirement (8–10 irrigations). Earthing up required prior to monsoon.',
    source: 'PAU Package of Practices (Kharif, Table 9.2)',
  },
  chickpea: {
    name: 'Chickpea / Gram (ਛੋਲੇ · चना)',
    variety: 'PBG 8 / PBG 7 / BG 1053 (Desi & Kabuli)',
    season: 'Rabi Season (Oct Sowing · March Harvest)',
    cycle: '140–150 Days',
    standardN: '15 kg N · 40 kg P₂O₅ / ha (Starter dose)',
    bagsPerAcre: '0.3 Bag Urea (Starter) · 0.8 Bag DAP · Rhizobium Inoculant',
    placement: 'Inoculate seed with Mesorhizobium culture. Drill starter DAP 7–10 cm deep.',
    irrigation: '1–2 light irrigations. Never irrigate during flowering to prevent flower drop.',
    source: 'PAU Package of Practices (Rabi, Table 6.1)',
  },
};

export default function CropInspectorModal({ cropId, onClose, onSelectForCalculator }) {
  const data = CROP_AGRONOMY_DATA[cropId] || CROP_AGRONOMY_DATA.wheat;

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-reveal">
      <div className="relative w-full max-w-4xl bg-[#FAF8F5] rounded-3xl border border-[#D8CEBC] shadow-2xl overflow-hidden text-[#1C1B18] font-sans flex flex-col md:flex-row my-auto max-h-[90vh]">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-[#1C1B18] border border-[#D8CEBC] transition-all shadow-xs cursor-pointer"
          title="Close 3D Inspector"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Interactive 3D Canvas Stage */}
        <div className="w-full md:w-1/2 h-72 sm:h-96 md:h-auto min-h-[300px] bg-gradient-to-b from-[#F2ECE0] to-[#EAE2D2] relative flex flex-col justify-between p-4 border-b md:border-b-0 md:border-r border-[#D8CEBC]">
          
          {/* 3D Model Viewport */}
          <div className="w-full h-full absolute inset-0">
            <Crop3DViewer cropId={cropId} autoRotate={false} enableZoom={true} />
          </div>

          {/* Top Stage Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#2D5430] bg-white/80 px-2.5 py-1 rounded-full border border-[#D8CEBC] shadow-2xs">
              Interactive 3D Model
            </span>
            <span className="text-[11px] text-[#756F63] bg-white/60 px-2 py-0.5 rounded-md">
              Drag to rotate 360°
            </span>
          </div>

          {/* Bottom Floating Hint */}
          <div className="relative z-10 bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-[#D8CEBC] text-[11px] text-[#615C52] flex items-center justify-between shadow-2xs">
            <span>Scroll to zoom in / out</span>
            <RotateCw className="w-3.5 h-3.5 text-[#B8791E] animate-spin-slow" />
          </div>
        </div>

        {/* Right Side: Detailed Agronomic Profile */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto space-y-6">
          
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B8791E] block mb-1">
              PAU Certified Agronomy Profile
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1B18] tracking-tight">
              {data.name}
            </h2>
            <p className="text-xs text-[#756F63] mt-1 font-medium">
              {data.season} · {data.cycle}
            </p>
          </div>

          {/* Recommended Varieties */}
          <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D5] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#756F63] block">
              Recommended Punjab Varieties
            </span>
            <div className="text-sm font-semibold text-[#1C1B18]">
              {data.variety}
            </div>
          </div>

          {/* Standard Dose & Bags */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#756F63] block">
              Official University Fertilizer Recommendation
            </span>
            
            <div className="p-4 rounded-xl bg-white border border-[#E8E2D5] space-y-2">
              <div className="text-xs text-[#756F63]">
                Baseline Rate (Per Hectare):
              </div>
              <div className="font-serif text-lg text-[#1C1B18]">
                {data.standardN}
              </div>
              
              <div className="pt-2 border-t border-[#F4F1EA] text-xs">
                <span className="text-[#756F63] block text-[11px]">Recommended Purchase (Per Acre):</span>
                <span className="font-semibold text-[#2D5430]">{data.bagsPerAcre}</span>
              </div>
            </div>
          </div>

          {/* Application Method & Irrigation */}
          <div className="space-y-3 text-xs text-[#615C52]">
            <div>
              <strong className="text-[#1C1B18] block mb-0.5">Placement Instruction:</strong>
              <p className="leading-relaxed">{data.placement}</p>
            </div>
            <div>
              <strong className="text-[#1C1B18] block mb-0.5">Irrigation Guidance:</strong>
              <p className="leading-relaxed">{data.irrigation}</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-between gap-3">
            <span className="text-[11px] text-[#756F63]">
              {data.source}
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onSelectForCalculator) onSelectForCalculator(cropId);
              }}
              className="px-5 py-2.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Calculate Dose</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
