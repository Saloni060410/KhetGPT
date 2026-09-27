import { useState, useMemo } from 'react';
import {
  MapPin,
  Activity,
  Droplets,
  Tractor,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Calendar,
  FileText,
  Sparkles,
  Compass,
  TrendingDown,
} from 'lucide-react';
import { DOCKET_DATA } from '../data/docketData';

export default function Field2DMap({
  activeCrop: propCrop,
  crops: propCrops,
  onSelectCrop,
  onOpenDocket,
  onOpenDealerSlip,
  onOpenDates,
  onOpenAgronomist,
  onSwitchTo3D,
  isStandalone = false,
}) {
  const [activeLayer, setActiveLayer] = useState('nitrogen'); // 'nitrogen' | 'potassium' | 'ph' | 'moisture'
  const [selectedProbe, setSelectedProbe] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState('all'); // 'all' | 'zone-1' | 'zone-2' | 'zone-3'
  const [showTractorPath, setShowTractorPath] = useState(true);
  const [hoveredZone, setHoveredZone] = useState(null);

  const { field2D, crops: defaultCrops } = DOCKET_DATA;
  const cropsList = propCrops || defaultCrops;
  const crop = propCrop || cropsList[0];

  // Colors for heatmap layers
  const getZoneFill = (zone) => {
    const isSelected = selectedZoneId === zone.id;
    const isHovered = hoveredZone === zone.id;

    if (activeLayer === 'nitrogen') {
      const base =
        zone.id === 'zone-1'
          ? 'rgba(239, 68, 68, 0.55)'
          : zone.id === 'zone-2'
          ? 'rgba(245, 158, 11, 0.55)'
          : 'rgba(16, 185, 129, 0.55)';
      return isSelected || isHovered ? base.replace('0.55', '0.75') : base;
    }
    if (activeLayer === 'potassium') {
      const base =
        zone.id === 'zone-1'
          ? 'rgba(168, 85, 247, 0.65)'
          : zone.id === 'zone-2'
          ? 'rgba(168, 85, 247, 0.5)'
          : 'rgba(168, 85, 247, 0.35)';
      return isSelected || isHovered ? base.replace(/0\.\d+/, '0.8') : base;
    }
    if (activeLayer === 'ph') {
      const base = 'rgba(6, 182, 212, 0.5)';
      return isSelected || isHovered ? 'rgba(6, 182, 212, 0.75)' : base;
    }
    if (activeLayer === 'moisture') {
      const base =
        zone.id === 'zone-3'
          ? 'rgba(14, 165, 233, 0.65)'
          : zone.id === 'zone-2'
          ? 'rgba(14, 165, 233, 0.45)'
          : 'rgba(14, 165, 233, 0.25)';
      return isSelected || isHovered ? base.replace(/0\.\d+/, '0.8') : base;
    }
    return isSelected || isHovered ? 'rgba(16, 185, 129, 0.6)' : 'rgba(16, 185, 129, 0.4)';
  };

  // Zone specific fertilizer calculations for the selected crop
  const zonePrescription = useMemo(() => {
    // Proportions: Zone 1: 3.2/8.5 (~37.6%), Zone 2: 3.5/8.5 (~41.2%), Zone 3: 1.8/8.5 (~21.2%)
    const cropId = crop.id;

    if (selectedZoneId === 'zone-1') {
      return {
        zoneName: 'Zone 1: North Terraced Basin',
        punjabiTitle: 'ਜ਼ੋਨ 1 (ਉੱਤਰੀ ਰੇਤਲੀ ਜ਼ਮੀਨ)',
        acres: 3.2,
        soilType: 'Sandy Loam (ਰੇਤਲੀ ਦੋਮਟ)',
        nitrogenStatus: 'Low Deficit (195 kg/ha)',
        nitrogenBadgeColor: 'bg-red-100 text-red-800 border-red-200',
        potassiumStatus: 'Very High (330 kg/ha) · 100% Buffer',
        potassiumSavings: '₹2,720 Saved (0 MOP)',
        ph: 7.3,
        moisture: '28% Optimal',
        primaryFertilizer:
          cropId === 'chickpea'
            ? '0 Bags Urea (Rhizobium Active)'
            : cropId === 'sugarcane'
            ? '5.5 Bags Urea'
            : cropId === 'cotton'
            ? '3.0 Bags Urea'
            : cropId === 'rice'
            ? '4.5 Bags Urea'
            : cropId === 'barley'
            ? '2.3 Bags Urea'
            : '4.2 Bags Neem-Coated Urea (45kg)',
        secondaryFertilizer:
          cropId === 'chickpea'
            ? '1.5 Bags DAP Basal Placement'
            : cropId === 'cotton'
            ? '1.9 Bags DAP + 2 sprays Foliar K'
            : cropId === 'rice'
            ? '1.5 Bags ZnSO₄ 21%'
            : '1.5 Bags DAP (Applied) · 0 Potash',
        farmerAdvicePunjabi:
          'ਪਹਿਲੇ ਪਾਣੀ ਤੋਂ ਪਹਿਲਾਂ ਯੂਰੀਆ ਛੱਟਾ ਦਿਓ। ਪੋਟਾਸ਼ ਦੀ ਲੋੜ ਨਹੀਂ ਕਿਉਂਕਿ ਜ਼ਮੀਨ ਵਿੱਚ ਕੁਦਰਤੀ ਪੋਟਾਸ਼ ਬਹੁਤ ਹੈ।',
        farmerAdviceEnglish:
          'Broadcast top-dress Urea strictly before 1st canal irrigation. High natural soil potassium safely eliminates Potash.',
      };
    }

    if (selectedZoneId === 'zone-2') {
      return {
        zoneName: 'Zone 2: Central Furrow Alluvium',
        punjabiTitle: 'ਜ਼ੋਨ 2 (ਵਿਚਕਾਰਲਾ ਉਪਜਾਊ ਖੇਤਰ)',
        acres: 3.5,
        soilType: 'Loam Alluvium (ਉਪਜਾਊ ਦੋਮਟ)',
        nitrogenStatus: 'Medium-Low (215 kg/ha)',
        nitrogenBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        potassiumStatus: 'High (310 kg/ha) · Balanced',
        potassiumSavings: '₹2,975 Saved (0 MOP)',
        ph: 7.4,
        moisture: '31% Field Capacity',
        primaryFertilizer:
          cropId === 'chickpea'
            ? '0 Bags Urea (Nodule Protected)'
            : cropId === 'sugarcane'
            ? '5.8 Bags Urea'
            : cropId === 'cotton'
            ? '3.3 Bags Urea'
            : cropId === 'rice'
            ? '5.0 Bags Urea'
            : cropId === 'barley'
            ? '2.5 Bags Urea'
            : '4.0 Bags Neem-Coated Urea (45kg)',
        secondaryFertilizer:
          cropId === 'chickpea'
            ? '1.6 Bags DAP Basal'
            : cropId === 'cotton'
            ? '2.1 Bags DAP + Boron Spray'
            : cropId === 'rice'
            ? '1.6 Bags ZnSO₄ 21%'
            : '1.6 Bags DAP (Applied) · 0 Potash',
        farmerAdvicePunjabi:
          'ਸਿਆੜਾਂ ਦੇ ਨਾਲ-ਨਾਲ ਯੂਰੀਆ ਡਰਿੱਲ ਕਰੋ। ਮਿੱਟੀ ਵਿੱਚ ਨਮੀ ਪੂਰੀ ਹੈ, ਖਾਦ ਪੂਰੀ ਤਰ੍ਹਾਂ ਜੜ੍ਹਾਂ ਤੱਕ ਪਹੁੰਚੇਗੀ।',
        farmerAdviceEnglish:
          'Drill urea along the furrows. Balanced loam humus ensures rapid vegetative uptake at active tillering.',
      };
    }

    if (selectedZoneId === 'zone-3') {
      return {
        zoneName: 'Zone 3: South Canal Border Bed',
        punjabiTitle: 'ਜ਼ੋਨ 3 (ਨਹਿਰ ਕੰਢੇ ਵਾਲੀ ਜ਼ਮੀਨ)',
        acres: 1.8,
        soilType: 'Heavy Clay Loam (ਚੀਕਣੀ ਦੋਮਟ)',
        nitrogenStatus: 'Medium Optimal (240 kg/ha)',
        nitrogenBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        potassiumStatus: 'High (290 kg/ha)',
        potassiumSavings: '₹1,530 Saved (0 MOP)',
        ph: 7.5,
        moisture: '34% High Canal Moisture',
        primaryFertilizer:
          cropId === 'chickpea'
            ? '0 Bags Urea (Natural Fixation)'
            : cropId === 'sugarcane'
            ? '2.7 Bags Urea'
            : cropId === 'cotton'
            ? '1.7 Bags Urea'
            : cropId === 'rice'
            ? '2.5 Bags Urea'
            : cropId === 'barley'
            ? '1.2 Bags Urea'
            : '1.8 Bags Neem-Coated Urea (45kg)',
        secondaryFertilizer:
          cropId === 'chickpea'
            ? '0.9 Bags DAP Basal'
            : cropId === 'cotton'
            ? '1.0 Bags DAP'
            : cropId === 'rice'
            ? '0.9 Bags ZnSO₄ 21%'
            : '0.9 Bags DAP (Applied) · 0 Potash',
        farmerAdvicePunjabi:
          'ਨਹਿਰੀ ਪਾਣੀ ਦਾ ਅਸਰ ਹੋਣ ਕਾਰਨ ਪਹਿਲਾਂ ਹੀ ਨਮੀ ਜ਼ਿਆਦਾ ਹੈ। ਯੂਰੀਆ ਪਾਉਣ ਤੋਂ ਬਾਅਦ 24 ਘੰਟੇ ਪਾਣੀ ਨਾ ਛੱਡੋ।',
        farmerAdviceEnglish:
          'High seepage near Sirhind feeder canal. Broadcast urea and delay canal watering 24h to avoid waterlogging.',
      };
    }

    // Default: Entire Plot A (8.5 Acres Aggregate)
    const primaryTotal =
      cropId === 'chickpea'
        ? '0 Bags Chemical Urea (₹6,400 Saved)'
        : cropId === 'sugarcane'
        ? '14 Bags Neem-Coated Urea'
        : cropId === 'cotton'
        ? '8 Bags Urea Due Now (16 Season Total)'
        : cropId === 'rice'
        ? '12 Bags Neem-Coated Urea'
        : cropId === 'barley'
        ? '6 Bags Neem-Coated Urea'
        : '10 Bags Neem-Coated Urea Due Now';

    const secondaryTotal =
      cropId === 'chickpea'
        ? '4 Bags DAP Basal + 1 Foliar Spray'
        : cropId === 'cotton'
        ? '5 Bags DAP + 4 Potassium Nitrate Sprays'
        : cropId === 'rice'
        ? '4 Bags DAP + 4 Bags Zinc Sulfate (ZnSO₄)'
        : '4 Bags DAP Applied · 3.5 Bags Potash Saved';

    return {
      zoneName: 'All 8.5 Acres · Malwa Central Parcel',
      punjabiTitle: 'ਸਾਰੇ 8.5 ਏਕੜ (ਪਲਾਟ ਏ - ਮਾਲਵਾ ਫਾਰਮ)',
      acres: 8.5,
      soilType: 'Composite Sandy Loam & Alluvium',
      nitrogenStatus: 'Calibrated Average (210 kg/ha)',
      nitrogenBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      potassiumStatus: 'High Natural Buffer (310 kg/ha)',
      potassiumSavings: `${crop.estimatedSavings?.amount || '₹3,400'} Saved`,
      ph: 7.4,
      moisture: '31% Field Capacity (Optimal)',
      primaryFertilizer: primaryTotal,
      secondaryFertilizer: secondaryTotal,
      farmerAdvicePunjabi:
        'ਪੰਜਾਬ ਐਗਰੀਕਲਚਰਲ ਯੂਨੀਵਰਸਿਟੀ (PAU) ਦੇ ਹਿਸਾਬ ਨਾਲ ਖਾਦ ਦਾ ਸੰਤੁਲਨ ਤਿਆਰ ਹੈ। 48 ਘੰਟੇ ਮੌਸਮ ਸਾਫ਼ ਹੈ।',
      farmerAdviceEnglish:
        'Calibrated with PAU STCR yield equation. Zero precipitation window ensures 100% absorption without runoff.',
    };
  }, [crop, selectedZoneId]);

  return (
    <div className="relative w-full bg-[#FAF8F5] text-slate-900 rounded-3xl overflow-hidden border border-[#E2DDD3] shadow-xl flex flex-col">
      {/* ========================================================
          A. FARMER-FIRST 2D MAP HEADER & QUICK TOOLS
         ======================================================== */}
      <div className="p-3 sm:p-4 bg-white border-b border-[#E2DDD3] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1D4D2C] flex items-center justify-center text-white shadow-xs">
            <MapPin className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                2D Precision Soil GIS Map
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                ਸੌਖਾ ਨਕਸ਼ਾ
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Plot A · {field2D.plotName} · {field2D.gpsCenter}
            </p>
          </div>
        </div>

        {/* Switch back to 3D Button (for farmers who want to toggle) */}
        {onSwitchTo3D && (
          <button
            onClick={onSwitchTo3D}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-mono transition-all cursor-pointer shadow-xs active:scale-95"
            title="Switch back to 3D Farm Diorama"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">Switch to 3D Farm</span>
          </button>
        )}
      </div>

      {/* ========================================================
          B. ZONE SELECTOR TABS (TOUCH FRIENDLY FOR FARMERS)
         ======================================================== */}
      <div className="px-3 sm:px-4 py-2.5 bg-[#F6F3EC] border-b border-[#E2DDD3] flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-bold shrink-0">
          Select Zone:
        </span>

        <button
          onClick={() => setSelectedZoneId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedZoneId === 'all'
              ? 'bg-[#1D4D2C] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>ਸਾਰੇ ਜ਼ੋਨ · All 8.5 Ac</span>
        </button>

        {field2D.zones.map((z, idx) => {
          const isSelected = selectedZoneId === z.id;
          return (
            <button
              key={z.id}
              onClick={() => setSelectedZoneId(z.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-[#1D4D2C] text-white shadow-md font-bold'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: z.color || '#10b981' }}
              />
              <span>
                ਜ਼ੋਨ {idx + 1}: {z.acres} Ac
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          C. MAIN CONTENT: 2D VECTOR MAP & ZONE PRESCRIPTION CARD
         ======================================================== */}
      <div className={`p-3 sm:p-4 grid gap-4 ${isStandalone ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        
        {/* LEFT / TOP: Interactive SVG Map (8 cols on desktop if standalone) */}
        <div className={`${isStandalone ? 'lg:col-span-7 xl:col-span-7' : 'w-full'} flex flex-col gap-2`}>
          
          {/* Map Sub-Controls: Heatmap Layers + Waylines */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveLayer('nitrogen')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeLayer === 'nitrogen'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View Soil Nitrogen Deficit Layer"
              >
                <span>N-Deficit (ਨਾਈਟ੍ਰੋਜਨ)</span>
              </button>

              <button
                onClick={() => setActiveLayer('potassium')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeLayer === 'potassium'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View High Potassium Reserve (Savings)"
              >
                <span>K-Buffer (ਪੋਟਾਸ਼)</span>
              </button>

              <button
                onClick={() => setActiveLayer('ph')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeLayer === 'ph'
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View Soil pH Status (7.3-7.5)"
              >
                <span>pH (7.4)</span>
              </button>

              <button
                onClick={() => setActiveLayer('moisture')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeLayer === 'moisture'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View Open-Meteo Soil Moisture Layer"
              >
                <Droplets className="w-2.5 h-2.5" />
                <span>Radar (ਨਮੀ)</span>
              </button>
            </div>

            <button
              onClick={() => setShowTractorPath(!showTractorPath)}
              className={`px-2.5 py-1 rounded-xl border text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                showTractorPath
                  ? 'bg-[#1D4D2C] text-white border-emerald-700 shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle Tractor Broadcast Spray Lines"
            >
              <Tractor className="w-3 h-3" />
              <span>Waylines (ਟਰੈਕਟਰ ਰਾਹ)</span>
            </button>
          </div>

          {/* SVG Map Canvas Container */}
          <div className="relative w-full bg-gradient-to-b from-[#FAF8F5] via-[#F3EFE6] to-[#ECE5D8] rounded-2xl border border-[#E2DDD3] shadow-inner p-2 flex items-center justify-center overflow-hidden min-h-[300px]">
            <svg
              viewBox="0 0 500 340"
              className="w-full h-auto max-h-[360px] drop-shadow-md select-none overflow-visible"
            >
              <defs>
                {/* Furrow soil pattern */}
                <pattern id="furrows2d" width="10" height="10" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="5" x2="10" y2="5" stroke="#d5cebd" strokeWidth="1" strokeDasharray="2,2" />
                </pattern>
                {/* Canal gradient */}
                <linearGradient id="canalGrad2d" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>

              {/* Background plot buffer */}
              <rect x="10" y="10" width="480" height="320" rx="16" fill="#e8e2d4" stroke="#d6cdbc" strokeWidth="1.5" />

              {/* Zone 1: North Terraced Basin */}
              <path
                d="M 30,30 L 470,30 L 470,130 L 30,145 Z"
                fill={getZoneFill(field2D.zones[0])}
                stroke={selectedZoneId === 'zone-1' ? '#1D4D2C' : hoveredZone === 'zone-1' ? '#10b981' : '#1d4d2c'}
                strokeWidth={selectedZoneId === 'zone-1' ? 4 : hoveredZone === 'zone-1' ? 3 : 1.5}
                className="transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedZoneId(selectedZoneId === 'zone-1' ? 'all' : 'zone-1')}
                onMouseEnter={() => setHoveredZone('zone-1')}
                onMouseLeave={() => setHoveredZone(null)}
              />

              {/* Zone 2: Central Furrow Alluvium */}
              <path
                d="M 30,145 L 470,130 L 470,240 L 30,245 Z"
                fill={getZoneFill(field2D.zones[1])}
                stroke={selectedZoneId === 'zone-2' ? '#1D4D2C' : hoveredZone === 'zone-2' ? '#10b981' : '#1d4d2c'}
                strokeWidth={selectedZoneId === 'zone-2' ? 4 : hoveredZone === 'zone-2' ? 3 : 1.5}
                className="transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedZoneId(selectedZoneId === 'zone-2' ? 'all' : 'zone-2')}
                onMouseEnter={() => setHoveredZone('zone-2')}
                onMouseLeave={() => setHoveredZone(null)}
              />

              {/* Zone 3: South Canal Border Bed */}
              <path
                d="M 30,245 L 470,240 L 470,305 L 30,305 Z"
                fill={getZoneFill(field2D.zones[2])}
                stroke={selectedZoneId === 'zone-3' ? '#1D4D2C' : hoveredZone === 'zone-3' ? '#10b981' : '#1d4d2c'}
                strokeWidth={selectedZoneId === 'zone-3' ? 4 : hoveredZone === 'zone-3' ? 3 : 1.5}
                className="transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedZoneId(selectedZoneId === 'zone-3' ? 'all' : 'zone-3')}
                onMouseEnter={() => setHoveredZone('zone-3')}
                onMouseLeave={() => setHoveredZone(null)}
              />

              {/* Furrows Overlay */}
              <rect x="30" y="30" width="440" height="275" fill="url(#furrows2d)" opacity="0.6" pointerEvents="none" />

              {/* Sirhind Canal Feeder Right Edge */}
              <path
                d="M 474,25 L 490,25 L 490,310 L 474,310 Z"
                fill="url(#canalGrad2d)"
                stroke="#0369a1"
                strokeWidth="1"
              />
              <text
                x="484"
                y="165"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
                transform="rotate(90, 484, 165)"
                textAnchor="middle"
              >
                SIRHIND FEEDER CANAL (WATER SAFE)
              </text>

              {/* Tractor Waylines */}
              {showTractorPath && (
                <g stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.75" pointerEvents="none">
                  <line x1="50" y1="55" x2="450" y2="55" />
                  <line x1="450" y1="90" x2="50" y2="90" />
                  <line x1="50" y1="125" x2="450" y2="125" />
                  <line x1="450" y1="165" x2="50" y2="165" />
                  <line x1="50" y1="200" x2="450" y2="200" />
                  <line x1="450" y1="235" x2="50" y2="235" />
                  <line x1="50" y1="275" x2="450" y2="275" />
                </g>
              )}

              {/* Interactive Zone Labels */}
              <g pointerEvents="none" fontFamily="system-ui" fontSize="10" fontWeight="700">
                <text x="50" y="60" fill="#0f172a">
                  ZONE 1: 3.2 Ac (ਉੱਤਰੀ ਰੇਤਲੀ ਜ਼ਮੀਨ)
                </text>
                <text x="50" y="75" fill="#713f12" fontSize="9" fontFamily="monospace">
                  Low N (195 kg/ha) · Top-dress Urea
                </text>

                <text x="50" y="170" fill="#0f172a">
                  ZONE 2: 3.5 Ac (ਵਿਚਕਾਰਲਾ ਖੇਤਰ)
                </text>
                <text x="50" y="185" fill="#166534" fontSize="9" fontFamily="monospace">
                  Balanced Loam · Furrow Broadcast
                </text>

                <text x="50" y="270" fill="#0f172a">
                  ZONE 3: 1.8 Ac (ਨਹਿਰੀ ਬੰਨਾ)
                </text>
                <text x="50" y="285" fill="#0369a1" fontSize="9" fontFamily="monospace">
                  Heavy Clay Loam · High Moisture
                </text>
              </g>

              {/* Lab Soil Core Sampling Probes (P1 to P6) */}
              {field2D.soilProbes.map((probe) => {
                const isSelected = selectedProbe?.id === probe.id;
                const px = (probe.x / 100) * 440 + 30;
                const py = (probe.y / 100) * 275 + 30;

                return (
                  <g
                    key={probe.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedProbe(isSelected ? null : probe)}
                  >
                    <circle
                      cx={px}
                      cy={py}
                      r={isSelected ? 11 : 7}
                      fill={isSelected ? '#1D4D2C' : '#ffffff'}
                      stroke="#0f172a"
                      strokeWidth="2"
                      className="transition-all duration-150"
                    />
                    <circle cx={px} cy={py} r="3" fill={isSelected ? '#ffffff' : '#10b981'} />
                    <text
                      x={px}
                      y={py - 11}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {probe.id}
                    </text>
                  </g>
                );
              })}

              {/* North Arrow Compass */}
              <g transform="translate(440, 45)">
                <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <polygon points="0,-11 -4,-2 4,-2" fill="#ef4444" />
                <polygon points="0,11 -4,2 4,2" fill="#64748b" />
                <text x="0" y="-13" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a">
                  N
                </text>
              </g>
            </svg>

            {/* Probe Telemetry Floating Box */}
            {selectedProbe && (
              <div className="absolute top-3 right-3 z-30 bg-white/95 backdrop-blur-md border border-emerald-600 rounded-2xl p-3 shadow-xl w-64 text-xs animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-1.5 mb-2">
                  <span className="flex items-center gap-1.5 text-[#1D4D2C]">
                    <Activity className="w-3.5 h-3.5" />
                    <span>SOIL LAB TEST · {selectedProbe.id}</span>
                  </span>
                  <button
                    onClick={() => setSelectedProbe(null)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available N:</span>
                    <span className="font-bold text-amber-600">{selectedProbe.n} kg/ha</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available P₂O₅:</span>
                    <span className="font-bold text-emerald-700">{selectedProbe.p} kg/ha</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available K₂O:</span>
                    <span className="font-bold text-purple-700">{selectedProbe.k} kg/ha</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Soil Reaction:</span>
                    <span className="font-bold text-cyan-700">pH {selectedProbe.ph}</span>
                  </div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">PAU Classification:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {selectedProbe.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
            <span>💡 Tip: Tap any zone or probe on the map to inspect calibrated soil fertility.</span>
            <span>Sirhind Canal Basin · Sandy Loam</span>
          </div>
        </div>

        {/* RIGHT / BOTTOM: Zone Prescription & Fertilizer Calculation Box (5 cols on desktop if standalone) */}
        <div className={`${isStandalone ? 'lg:col-span-5 xl:col-span-5' : 'w-full'} flex flex-col gap-3`}>
          
          {/* Active Crop Info & Quick Crop Switcher */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E2DDD3] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                Prescription Crop:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                {crop.season}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: crop.color || '#10b981' }}
                />
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900 leading-tight">
                    {crop.name} ({crop.punjabiName})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {crop.variety} · {crop.stageBadge || crop.currentStage}
                  </p>
                </div>
              </div>

              {/* Crop Change buttons if onSelectCrop provided */}
              {onSelectCrop && (
                <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] scrollbar-none">
                  {cropsList.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelectCrop(c.id)}
                      className={`w-6 h-6 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center shrink-0 ${
                        c.id === crop.id
                          ? 'bg-[#1D4D2C] text-white shadow-xs scale-105'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={`Switch to ${c.name} (${c.punjabiName})`}
                    >
                      {c.name.slice(0, 1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zone Fertilizer Requirement Card (Prominent & High Contrast) */}
          <div className="bg-[#1D4D2C] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-800 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-700/60 pb-2.5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block">
                  Target Zone Fertilizer Dosage · ਖਾਦ ਦੀ ਮਾਤਰਾ
                </span>
                <h4 className="text-base font-serif font-bold text-white">
                  {zonePrescription.zoneName}
                </h4>
                <span className="text-xs text-emerald-200 font-medium">
                  {zonePrescription.punjabiTitle}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-extrabold text-amber-300 block">
                  {zonePrescription.acres} Ac
                </span>
                <span className="text-[10px] text-emerald-300 font-mono">
                  {zonePrescription.soilType}
                </span>
              </div>
            </div>

            {/* Fertilizer Numbers */}
            <div className="space-y-2">
              <div className="bg-emerald-950/60 rounded-xl p-3 border border-emerald-700/50">
                <span className="text-[10px] font-mono uppercase text-emerald-300 font-semibold block">
                  Primary Top-Dress (ਯੂਰੀਆ):
                </span>
                <div className="text-base sm:text-lg font-mono font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{zonePrescription.primaryFertilizer}</span>
                </div>
              </div>

              <div className="bg-emerald-950/60 rounded-xl p-3 border border-emerald-700/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-300 font-semibold block">
                    Secondary Basal &amp; Potash:
                  </span>
                  <div className="text-xs font-mono font-medium text-slate-200">
                    {zonePrescription.secondaryFertilizer}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-emerald-300 block">Potash Savings</span>
                  <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-0.5 justify-end">
                    <TrendingDown className="w-3 h-3 text-amber-300" />
                    <span>{zonePrescription.potassiumSavings}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Advice in Gurmukhi and English */}
            <div className="bg-emerald-900/50 rounded-xl p-3 border border-emerald-700/40 space-y-1">
              <p className="text-xs text-amber-200 font-medium leading-relaxed">
                🌾 {zonePrescription.farmerAdvicePunjabi}
              </p>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                {zonePrescription.farmerAdviceEnglish}
              </p>
            </div>
          </div>

          {/* Soil Telemetry Quick Pills */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-white p-2.5 rounded-xl border border-[#E2DDD3] shadow-2xs">
              <span className="text-[10px] text-slate-500 block">Soil Nitrogen Level:</span>
              <span className="font-bold text-slate-800">{zonePrescription.nitrogenStatus}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-[#E2DDD3] shadow-2xs">
              <span className="text-[10px] text-slate-500 block">Soil Potassium Buffer:</span>
              <span className="font-bold text-purple-700">{zonePrescription.potassiumStatus}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-[#E2DDD3] shadow-2xs">
              <span className="text-[10px] text-slate-500 block">Soil pH Reaction:</span>
              <span className="font-bold text-cyan-700">pH {zonePrescription.ph} (Optimal)</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-[#E2DDD3] shadow-2xs">
              <span className="text-[10px] text-slate-500 block">Open-Meteo Moisture:</span>
              <span className="font-bold text-emerald-700">{zonePrescription.moisture}</span>
            </div>
          </div>

          {/* Quick Farmer Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {onOpenDocket && (
              <button
                onClick={onOpenDocket}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono font-semibold shadow-2xs cursor-pointer active:scale-95 transition-all"
                title="Open Full Prescription Docket"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Full Docket</span>
              </button>
            )}

            {onOpenDealerSlip && (
              <button
                onClick={onOpenDealerSlip}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono font-semibold shadow-2xs cursor-pointer active:scale-95 transition-all"
                title="Print Mandi Dealer Fertilizer Slip"
              >
                <Printer className="w-3.5 h-3.5 text-blue-700" />
                <span>Dealer Slip</span>
              </button>
            )}

            {onOpenDates && (
              <button
                onClick={onOpenDates}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono font-semibold shadow-2xs cursor-pointer active:scale-95 transition-all"
                title="View Irrigation & Application Dates"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Dates (ਤਾਰੀਖਾਂ)</span>
              </button>
            )}

            {onOpenAgronomist && (
              <button
                onClick={onOpenAgronomist}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#1D4D2C] hover:bg-[#163c22] text-white text-xs font-mono font-semibold shadow-2xs cursor-pointer active:scale-95 transition-all"
                title="Ask Agronomist AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Ask AI</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          D. BOTTOM COMPLIANCE & ACCESSIBILITY FOOTER
         ======================================================== */}
      <div className="p-3 bg-white border-t border-[#E2DDD3] flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 font-mono text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Punjab Agricultural University (PAU) · ICAR STCR Calibrated</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
          <span>Target Yield: 22.5 Q/Acre</span>
          <span>•</span>
          <span>Zero Groundwater Nitrate Runoff</span>
        </div>
      </div>
    </div>
  );
}
