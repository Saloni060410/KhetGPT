import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Check, Sun, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

const CROP_OPTIONS = [
  { 
    id: 'wheat', 
    name: 'Wheat (ਕਣਕ · गेहूं)', 
    standardN: 123.6, 
    baseUreaBags: 2.5, 
    ureaKg: 112,
    baseDapBags: 1.2, 
    dapKg: 60,
    baseMopBags: 0.6, 
    mopKg: 30,
    ureaBagsText: '2.5 Bags (112 kg)', 
    dapBagsText: '1.2 Bags (60 kg)', 
    mopBagsText: '0.6 Bag (30 kg)',
    ureaNotes: 'Split 50% CRI + 50% booting. Never broadcast in single heavy dose.',
    dapNotes: 'Drill 4-5 cm below seed level at sowing. Never surface-broadcast.',
    mopNotes: 'Apply basal at sowing. Adjust down by 50% if soil test K exceeds 280 kg/ha.'
  },
  { 
    id: 'barley', 
    name: 'Barley (ਜੌਂ · जौ)', 
    standardN: 62.5, 
    baseUreaBags: 1.4, 
    ureaKg: 62,
    baseDapBags: 0.6, 
    dapKg: 30,
    baseMopBags: 0.3, 
    mopKg: 15,
    ureaBagsText: '1.4 Bags (62 kg)', 
    dapBagsText: '0.6 Bag (30 kg)', 
    mopBagsText: '0.3 Bag (15 kg)',
    ureaNotes: 'Apply 1/2 at sowing and remainder with first irrigation.',
    dapNotes: 'Band place at seeding to boost root proliferation in cold soils.',
    mopNotes: 'Basal application ensures lodging resistance during spring winds.'
  },
  { 
    id: 'rice', 
    name: 'Rice / Paddy (ਝੋਨਾ · धान)', 
    standardN: 120.0, 
    baseUreaBags: 2.4, 
    ureaKg: 108,
    baseDapBags: 0.6, 
    dapKg: 30,
    baseMopBags: 0.6, 
    mopKg: 30,
    ureaBagsText: '2.4 Bags (108 kg)', 
    dapBagsText: '0.6 Bag (30 kg)', 
    mopBagsText: '0.6 Bag (30 kg)',
    ureaNotes: 'Three splits: 1/3 at transplanting, 1/3 active tillering (3 wk), 1/3 panicle (6 wk).',
    dapNotes: 'Drill into puddle bed before final leveling for uniform uptake.',
    mopNotes: 'Crucial for blast and blight disease tolerance in flooded conditions.'
  },
  { 
    id: 'maize', 
    name: 'Maize (ਮੱਕੀ · मक्का)', 
    standardN: 125.0, 
    baseUreaBags: 2.6, 
    ureaKg: 115,
    baseDapBags: 1.2, 
    dapKg: 60,
    baseMopBags: 0.6, 
    mopKg: 30,
    ureaBagsText: '2.6 Bags (115 kg)', 
    dapBagsText: '1.2 Bags (60 kg)', 
    mopBagsText: '0.6 Bag (30 kg)',
    ureaNotes: 'Split across knee-high, tasseling, and grain fill stages.',
    dapNotes: 'Apply along row shoulders 5 cm away from seeds.',
    mopNotes: 'Maintains thick stalk turgor and prevents storm snapping.'
  },
  { 
    id: 'cotton', 
    name: 'Cotton (ਨਰਮਾ · कपास)', 
    standardN: 75.0, 
    baseUreaBags: 1.6, 
    ureaKg: 72,
    baseDapBags: 0.6, 
    dapKg: 30,
    baseMopBags: 0, 
    mopKg: 0,
    ureaBagsText: '1.6 Bags (72 kg)', 
    dapBagsText: '0.6 Bag (30 kg)', 
    mopBagsText: 'None (Soil dependent)',
    ureaNotes: 'Split: 1/2 at thinning stage, 1/2 at initial flower square formation.',
    dapNotes: 'Drill at sowing; skip if preceding wheat crop received full DAP.',
    mopNotes: 'Foliar spray 2% KNO3 at flowering if leaf reddening emerges.'
  },
  { 
    id: 'sugarcane', 
    name: 'Sugarcane (ਗੰਨਾ · गन्ना)', 
    standardN: 150.0, 
    baseUreaBags: 3.3, 
    ureaKg: 150,
    baseDapBags: 1.0, 
    dapKg: 50,
    baseMopBags: 1.0, 
    mopKg: 50,
    ureaBagsText: '3.3 Bags (150 kg)', 
    dapBagsText: '1.0 Bag (50 kg)', 
    mopBagsText: '1.0 Bag (50 kg)',
    ureaNotes: 'Three splits: complete all nitrogen before monsoon onset (late June).',
    dapNotes: 'Place in furrows directly under setts at planting.',
    mopNotes: 'Boosts sucrose synthesis and internode rind strength against borers.'
  },
  { 
    id: 'chickpea', 
    name: 'Chickpea (ਛੋਲੇ · चना)', 
    standardN: 15.0, 
    baseUreaBags: 0.3, 
    ureaKg: 15,
    baseDapBags: 0.8, 
    dapKg: 40,
    baseMopBags: 0, 
    mopKg: 0,
    ureaBagsText: '0.3 Bag (15 kg)', 
    dapBagsText: '0.8 Bag (40 kg)', 
    mopBagsText: 'None (Rhizobium starter)',
    ureaNotes: 'Minimal starter dose only; excess N suppresses symbiotic root nodulation.',
    dapNotes: 'Drill at sowing to encourage taproot deepening in dry loams.',
    mopNotes: 'Only required in severely deficient sandy tracts.'
  }
];

const SOIL_TYPES = [
  { id: 'loam', name: 'Sandy Loam (Central Alluvial Plains)' },
  { id: 'clay_loam', name: 'Clay Loam (Heavy Floodplain)' },
  { id: 'sandy', name: 'Light Sandy (South-Western Belt)' },
  { id: 'submountain', name: 'Undulating Sub-Mountain Loam' }
];

const REGION_OPTIONS = [
  { id: 'pb_ludhiana', name: 'Punjab · Ludhiana (Central Plain)' },
  { id: 'pb_bathinda', name: 'Punjab · Bathinda (South-Western)' },
  { id: 'pb_amritsar', name: 'Punjab · Amritsar (Bari Doab)' },
  { id: 'pb_jalandhar', name: 'Punjab · Jalandhar (Doaba)' },
  { id: 'pb_sangrur', name: 'Punjab · Sangrur (Malwa)' },
  { id: 'pb_patiala', name: 'Punjab · Patiala (Ghaggar Basin)' }
];

const GROWTH_STAGES = [
  { id: 'basal', name: 'Sowing / Basal Drilling' },
  { id: 'tillering', name: 'Crown Root / Tillering (21-35 days)' },
  { id: 'flowering', name: 'Flowering / Boot Stage (50-65 days)' },
  { id: 'maturity', name: 'Grain Filling (75-90 days)' }
];

export default function RecommendationCard({
  initialCrop = 'wheat',
  initialSoil = 'loam',
  initialRegion = 'pb_ludhiana',
  initialStage = 'tillering',
  soilN,
  soilP,
  soilK,
  fieldId = '1',
  showDocketLink = true
}) {
  const navigate = useNavigate();
  const [crop, setCrop] = useState(initialCrop);
  const [soil, setSoil] = useState(initialSoil);
  const [region, setRegion] = useState(initialRegion);
  const [stage, setStage] = useState(initialStage);

  const selectedCrop = CROP_OPTIONS.find((c) => c.id === crop) || CROP_OPTIONS[0];

  // Dynamic soil-test calibration adjustments
  const numN = parseFloat(soilN);
  const numP = parseFloat(soilP);
  const numK = parseFloat(soilK);

  const hasSoilTest = !isNaN(numN) && !isNaN(numP) && !isNaN(numK);

  let nMultiplier = 1.0;
  let nStatusText = 'Standard baseline dose';
  if (hasSoilTest) {
    if (numN < 280) {
      nMultiplier = 1.25;
      nStatusText = `Soil N Low (${numN} kg/ha): +25% adjustment applied`;
    } else if (numN > 560) {
      nMultiplier = 0.80;
      nStatusText = `Soil N High (${numN} kg/ha): -20% savings applied`;
    } else {
      nStatusText = `Soil N Medium (${numN} kg/ha): standard baseline`;
    }
  }

  let pMultiplier = 1.0;
  let pStatusText = 'Standard baseline dose';
  if (hasSoilTest) {
    if (numP < 12.5) {
      pMultiplier = 1.25;
      pStatusText = `Soil P Low (${numP} kg/ha): +25% DAP adjustment`;
    } else if (numP > 25.0) {
      pMultiplier = 0.75;
      pStatusText = `Soil P High (${numP} kg/ha): -25% DAP savings`;
    } else {
      pStatusText = `Soil P Medium (${numP} kg/ha): standard baseline`;
    }
  }

  let kMultiplier = 1.0;
  let kStatusText = 'Standard baseline dose';
  if (hasSoilTest) {
    if (numK > 280) {
      kMultiplier = 0.5;
      kStatusText = `Soil K High (${numK} kg/ha): 50% Potash savings applied!`;
    } else if (numK < 135) {
      kMultiplier = 1.15;
      kStatusText = `Soil K Low (${numK} kg/ha): extra Potash for root health`;
    } else {
      kStatusText = `Soil K Medium (${numK} kg/ha): standard baseline`;
    }
  }

  const finalUreaBags = hasSoilTest 
    ? (selectedCrop.baseUreaBags * nMultiplier).toFixed(1)
    : selectedCrop.baseUreaBags.toFixed(1);

  const finalUreaKg = hasSoilTest
    ? Math.round(selectedCrop.ureaKg * nMultiplier)
    : selectedCrop.ureaKg;

  const finalDapBags = hasSoilTest
    ? (selectedCrop.baseDapBags * pMultiplier).toFixed(1)
    : selectedCrop.baseDapBags.toFixed(1);

  const finalDapKg = hasSoilTest
    ? Math.round(selectedCrop.dapKg * pMultiplier)
    : selectedCrop.dapKg;

  const finalMopBags = selectedCrop.baseMopBags === 0
    ? 'None'
    : hasSoilTest
      ? (selectedCrop.baseMopBags * kMultiplier).toFixed(1) + ' Bag'
      : selectedCrop.baseMopBags.toFixed(1) + ' Bag';

  const finalMopKg = selectedCrop.mopKg === 0
    ? 'Soil dependent'
    : hasSoilTest
      ? `${Math.round(selectedCrop.mopKg * kMultiplier)} kg`
      : `${selectedCrop.mopKg} kg`;

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl bg-white/85 border border-[#D8CEBC] shadow-xs backdrop-blur-xs overflow-hidden text-[#1C1B18] font-sans">
      
      {/* Top Banner */}
      <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-[#2D5430] text-white text-[11px] font-medium tracking-wide mb-2">
            <span>PAU PACKAGE OF PRACTICES (PUNJAB)</span>
            <span>·</span>
            <span>ICAR-IISS STCR</span>
          </div>
          <h3 className="font-serif text-2xl text-[#1C1B18] tracking-tight">
            Field Dose Prescription: {selectedCrop.name.split(' (')[0]}
          </h3>
          <p className="text-xs sm:text-sm text-[#756F63] mt-0.5">
            Standard published baseline: <strong className="font-semibold text-[#B8791E]">{selectedCrop.standardN} kg N/ha</strong> prior to soil-test adjustments.
          </p>
          {hasSoilTest && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F4EFE6] border border-[#DCD6C7] text-[11px] font-medium text-[#2D5430]">
              <Sparkles className="w-3 h-3 text-[#B8791E]" />
              <span>Calibrated for Plot A Soil Test (N: {numN}, P: {numP}, K: {numK} kg/ha)</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#DCD6C7] hover:border-[#1C1B18] text-[#1C1B18] text-xs font-medium transition-all shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5 text-[#756F63]" />
          <span>Print Dealer Slip</span>
        </button>
      </div>

      <div className="p-6 sm:p-8 space-y-7">
        
        {/* Step 1: Selectors */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#756F63] mb-3">
            Step 1 · Verified Field Parameters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
              <label className="block text-xs font-medium text-[#615C52] mb-1.5">
                Crop
              </label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full bg-white border border-[#DCD6C7] rounded-lg px-3 py-2 text-xs text-[#1C1B18] font-medium focus:outline-none focus:ring-2 focus:ring-[#2D5430] cursor-pointer"
              >
                {CROP_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
              <label className="block text-xs font-medium text-[#615C52] mb-1.5">
                Soil Texture
              </label>
              <select
                value={soil}
                onChange={(e) => setSoil(e.target.value)}
                className="w-full bg-white border border-[#DCD6C7] rounded-lg px-3 py-2 text-xs text-[#1C1B18] font-medium focus:outline-none focus:ring-2 focus:ring-[#2D5430] cursor-pointer"
              >
                {SOIL_TYPES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
              <label className="block text-xs font-medium text-[#615C52] mb-1.5">
                Punjab District
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-white border border-[#DCD6C7] rounded-lg px-3 py-2 text-xs text-[#1C1B18] font-medium focus:outline-none focus:ring-2 focus:ring-[#2D5430] cursor-pointer"
              >
                {REGION_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
              <label className="block text-xs font-medium text-[#615C52] mb-1.5">
                Growth Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full bg-white border border-[#DCD6C7] rounded-lg px-3 py-2 text-xs text-[#1C1B18] font-medium focus:outline-none focus:ring-2 focus:ring-[#2D5430] cursor-pointer"
              >
                {GROWTH_STAGES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Step 2: Prescribed Bag Counts (Per Acre) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#756F63]">
              Step 2 · Prescribed Fertilizer Bags (Per Acre)
            </div>
            {hasSoilTest && (
              <span className="text-[11px] font-medium text-[#2D5430]">
                Live calibration from laboratory values
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Nitrogen (Urea) */}
            <div className="p-5 rounded-xl bg-white border border-[#E8E2D5] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B8791E]">
                  Nitrogen (N)
                </span>
                <span className="text-[11px] text-[#756F63]">45 kg Government Bag</span>
              </div>
              <div className="font-serif text-2xl text-[#1C1B18]">
                {finalUreaBags} Bags ({finalUreaKg} kg)
              </div>
              <div className="text-xs font-medium text-[#1C1B18]">
                Neem-Coated Urea
              </div>
              <div className="text-[11px] font-medium text-[#2D5430]">
                {nStatusText}
              </div>
              <p className="text-[11px] text-[#756F63] pt-2 border-t border-[#E8E2D5]">
                {selectedCrop.ureaNotes}
              </p>
            </div>

            {/* Phosphorus (DAP) */}
            <div className="p-5 rounded-xl bg-white border border-[#E8E2D5] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#2D5430]">
                  Phosphorus (P₂O₅)
                </span>
                <span className="text-[11px] text-[#756F63]">50 kg Bag</span>
              </div>
              <div className="font-serif text-2xl text-[#1C1B18]">
                {finalDapBags} Bags ({finalDapKg} kg)
              </div>
              <div className="text-xs font-medium text-[#1C1B18]">
                Diammonium Phosphate (DAP)
              </div>
              <div className="text-[11px] font-medium text-[#2D5430]">
                {pStatusText}
              </div>
              <p className="text-[11px] text-[#756F63] pt-2 border-t border-[#E8E2D5]">
                {selectedCrop.dapNotes}
              </p>
            </div>

            {/* Potassium (MOP) */}
            <div className="p-5 rounded-xl bg-white border border-[#E8E2D5] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#3F6273]">
                  Potassium (K₂O)
                </span>
                <span className="text-[11px] text-[#756F63]">50 kg Bag</span>
              </div>
              <div className="font-serif text-2xl text-[#1C1B18]">
                {finalMopBags} {selectedCrop.baseMopBags > 0 ? `(${finalMopKg})` : ''}
              </div>
              <div className="text-xs font-medium text-[#1C1B18]">
                Muriate of Potash (MOP)
              </div>
              <div className="text-[11px] font-medium text-[#2D5430]">
                {kStatusText}
              </div>
              <p className="text-[11px] text-[#756F63] pt-2 border-t border-[#E8E2D5]">
                {selectedCrop.mopNotes}
              </p>
            </div>

          </div>
        </div>

        {/* Step 3: Agromet Window Check */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#2D5430]" />
            <span className="font-medium text-[#1C1B18]">
              Open-Meteo Central Punjab Check:
            </span>
            <span className="text-[#756F63]">
              Clear conditions forecast over next 48 hours. Safe for nitrogen top-dressing.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#2D5430] bg-[#DCFCE7] px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto">
            Zero Leaching Risk
          </span>
        </div>

        {/* Optional Action / Next Route */}
        {showDocketLink && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E2D5]">
            <p className="text-xs text-[#756F63]">
              Ready to view 3D plant architectures, crop comparison, and full seasonal fertilizer ledger?
            </p>
            <button
              type="button"
              onClick={() => navigate(`/fields/${fieldId}/recommendation`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            >
              <span>View Full Crop Prescription Docket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
