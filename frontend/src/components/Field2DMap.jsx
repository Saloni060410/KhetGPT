import { useState } from 'react';
import {
  MapPin,
  Activity,
  Droplets,
  Tractor,
  ShieldCheck,
} from 'lucide-react';
import { DOCKET_DATA } from '../data/docketData';

export default function Field2DMap() {
  const [activeLayer, setActiveLayer] = useState('nitrogen'); // 'nitrogen' | 'potassium' | 'ph' | 'moisture'
  const [selectedProbe, setSelectedProbe] = useState(null);
  const [showTractorPath, setShowTractorPath] = useState(true);
  const [hoveredZone, setHoveredZone] = useState(null);

  const { field2D } = DOCKET_DATA;

  // Colors for heatmap layers
  const getZoneFill = (zone) => {
    switch (activeLayer) {
      case 'nitrogen':
        return zone.id === 'zone-1' ? 'rgba(239, 68, 68, 0.45)' : zone.id === 'zone-2' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(16, 185, 129, 0.45)';
      case 'potassium':
        return zone.id === 'zone-1' ? 'rgba(168, 85, 247, 0.55)' : zone.id === 'zone-2' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.3)';
      case 'ph':
        return 'rgba(6, 182, 212, 0.4)';
      case 'moisture':
        return zone.id === 'zone-3' ? 'rgba(14, 165, 233, 0.55)' : zone.id === 'zone-2' ? 'rgba(14, 165, 233, 0.35)' : 'rgba(14, 165, 233, 0.2)';
      default:
        return 'rgba(16, 185, 129, 0.4)';
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] bg-gradient-to-b from-[#FAF8F5] via-[#F3EFE6] to-[#ECE5D8] rounded-3xl overflow-hidden border border-[#E2DDD3] shadow-inner select-none flex flex-col p-3 sm:p-4">
      {/* 1. Map Header Controls & Layer Tabs */}
      <div className="flex items-center justify-between gap-2 z-10 flex-wrap pb-2 border-b border-[#E2DDD3]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-slate-200 shadow-xs text-slate-800 text-[11px] font-mono font-bold">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>PLOT A · 8.5 ACRES 2D GIS</span>
          </div>
          <span className="hidden sm:inline-block text-[10px] text-slate-500 font-mono">
            {field2D.gpsCenter}
          </span>
        </div>

        {/* Heatmap Layer Selector */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveLayer('nitrogen')}
            className={`px-2 py-1 rounded-xl text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeLayer === 'nitrogen'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>N-Deficit</span>
          </button>
          <button
            onClick={() => setActiveLayer('potassium')}
            className={`px-2 py-1 rounded-xl text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeLayer === 'potassium'
                ? 'bg-purple-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>K-Buffer</span>
          </button>
          <button
            onClick={() => setActiveLayer('ph')}
            className={`px-2 py-1 rounded-xl text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeLayer === 'ph'
                ? 'bg-cyan-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>pH (7.4)</span>
          </button>
          <button
            onClick={() => setActiveLayer('moisture')}
            className={`px-2 py-1 rounded-xl text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeLayer === 'moisture'
                ? 'bg-sky-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplets className="w-2.5 h-2.5" />
            <span>Radar</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive SVG 2D Precision Field Vector Canvas */}
      <div className="flex-1 relative w-full h-full my-2 flex items-center justify-center">
        <svg
          viewBox="0 0 500 340"
          className="w-full h-full max-h-[340px] drop-shadow-md overflow-visible"
        >
          <defs>
            {/* Pattern for soil furrows */}
            <pattern id="furrows" width="10" height="10" patternUnits="userSpaceOnUse">
              <line x1="0" y1="5" x2="10" y2="5" stroke="#d5cebd" strokeWidth="1" strokeDasharray="2,2" />
            </pattern>
            {/* Gradient for canal water */}
            <linearGradient id="canalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Background Outer Buffer Ground */}
          <rect x="10" y="10" width="480" height="320" rx="16" fill="#e8e2d4" stroke="#d6cdbc" strokeWidth="1.5" />

          {/* Plot A Boundary Polygon */}
          {/* Zone 1: North Terraced Basin (Upper area) */}
          <path
            d="M 30,30 L 470,30 L 470,130 L 30,145 Z"
            fill={getZoneFill(field2D.zones[0])}
            stroke="#1d4d2c"
            strokeWidth={hoveredZone === 'zone-1' ? 3 : 1.5}
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredZone('zone-1')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Zone 2: Central Furrow Alluvium (Middle area) */}
          <path
            d="M 30,145 L 470,130 L 470,240 L 30,245 Z"
            fill={getZoneFill(field2D.zones[1])}
            stroke="#1d4d2c"
            strokeWidth={hoveredZone === 'zone-2' ? 3 : 1.5}
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredZone('zone-2')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Zone 3: South Canal Border Bed (Lower area) */}
          <path
            d="M 30,245 L 470,240 L 470,305 L 30,305 Z"
            fill={getZoneFill(field2D.zones[2])}
            stroke="#1d4d2c"
            strokeWidth={hoveredZone === 'zone-3' ? 3 : 1.5}
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredZone('zone-3')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Furrow Lines Overlay */}
          <rect x="30" y="30" width="440" height="275" fill="url(#furrows)" opacity="0.6" pointerEvents="none" />

          {/* Sirhind Irrigation Feeder Canal (Right edge canal bank) */}
          <path
            d="M 474,25 L 490,25 L 490,310 L 474,310 Z"
            fill="url(#canalGrad)"
            stroke="#0369a1"
            strokeWidth="1"
          />
          <text x="484" y="165" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" transform="rotate(90, 484, 165)" textAnchor="middle">
            CANAL FEEDER (WATER SAFE)
          </text>

          {/* Tractor Broadcast Spray Track (Waylines) */}
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

          {/* Zone Labels on Map */}
          <g pointerEvents="none" fontFamily="system-ui" fontSize="10" fontWeight="600">
            <text x="50" y="60" fill="#1e293b" className="font-bold">ZONE 1: 3.2 Ac (Sandy Loam)</text>
            <text x="50" y="75" fill="#713f12" fontSize="9" fontFamily="monospace">Target: 4.2 Bags Urea · 0 Potash</text>

            <text x="50" y="170" fill="#1e293b" className="font-bold">ZONE 2: 3.5 Ac (Central Alluvium)</text>
            <text x="50" y="185" fill="#166534" fontSize="9" fontFamily="monospace">Target: 4.0 Bags Urea · Furrow Drill</text>

            <text x="50" y="270" fill="#1e293b" className="font-bold">ZONE 3: 1.8 Ac (Heavy Border)</text>
            <text x="50" y="285" fill="#0369a1" fontSize="9" fontFamily="monospace">Target: 1.8 Bags Urea · Canal Buffer</text>
          </g>

          {/* Interactive Soil Sampling Probes (P1 to P6) */}
          {field2D.soilProbes.map((probe) => {
            const isSelected = selectedProbe?.id === probe.id;
            const px = (probe.x / 100) * 440 + 30;
            const py = (probe.y / 100) * 275 + 30;

            return (
              <g
                key={probe.id}
                className="cursor-pointer"
                onClick={() => setSelectedProbe(probe)}
              >
                {/* Glow ring */}
                <circle
                  cx={px}
                  cy={py}
                  r={isSelected ? 10 : 7}
                  fill={isSelected ? '#10b981' : '#ffffff'}
                  stroke="#1e293b"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
                <circle cx={px} cy={py} r="3" fill={isSelected ? '#ffffff' : '#10b981'} />
                <text
                  x={px}
                  y={py - 10}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {probe.id}
                </text>
              </g>
            );
          })}

          {/* North Arrow Compass Indicator */}
          <g transform="translate(440, 45)">
            <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <polygon points="0,-11 -4,-2 4,-2" fill="#ef4444" />
            <polygon points="0,11 -4,2 4,2" fill="#64748b" />
            <text x="0" y="-13" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a">N</text>
          </g>
        </svg>

        {/* Selected Probe Telemetry Modal / Overlay */}
        {selectedProbe && (
          <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md border border-emerald-500 rounded-2xl p-3 shadow-xl w-60 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-1.5 mb-2">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <Activity className="w-3.5 h-3.5" />
                <span>LAB SOIL TEST {selectedProbe.name}</span>
              </span>
              <button
                onClick={() => setSelectedProbe(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
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

      {/* 3. Bottom Status Bar & Precision Guidance */}
      <div className="flex items-center justify-between gap-2 z-10 pt-2 border-t border-[#E2DDD3] text-[11px] text-slate-700 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTractorPath(!showTractorPath)}
            className={`px-2.5 py-1 rounded-xl border text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              showTractorPath
                ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Tractor className="w-3.5 h-3.5" />
            <span>Tractor Broadcast Waylines</span>
          </button>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
            6 Soil Test Core Points Active
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>PAU Variable Rate Fertilizer (VRT) Ready</span>
        </div>
      </div>
    </div>
  );
}
