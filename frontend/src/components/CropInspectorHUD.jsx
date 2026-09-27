import { useState, useMemo } from 'react';
import {
  X,
  Sprout,
  Sparkles,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Compass,
  Play,
  RotateCcw,
  TrendingDown,
  MapPin,
  Printer,
  FileText,
  Check,
} from 'lucide-react';
import { DOCKET_DATA } from '../data/docketData';
import Field2DMap from './Field2DMap';
import { useT } from '../i18n/useT.js';

/**
 * CropInspectorHUD: Comprehensive 3D Fertilizer Prescription Docket Console
 * Seamlessly integrates the full PAU-calibrated docket, 2D precision GIS mapping,
 * and 3D nutrient particle simulations directly within the fullscreen 3D environment.
 */
export default function CropInspectorHUD({
  crop,
  onClose,
  onSelectCrop,
  activeNutrientStream,
  onTriggerNutrientStream,
  onFocusCamera,
  onResetCamera,
  onApplyPrescription,
  onOpenDealerSlip,
  onOpenDates,
  onOpenSpecs,
  onOpenCalibration,
}) {
  const { isHindi } = useT();
  const [hudTab, setHudTab] = useState('docket'); // 'docket' | 'map2d'
  const [isExpanded, setIsExpanded] = useState(false);
  const [simulated, setSimulated] = useState(false);

  // Cross-reference crop with DOCKET_DATA
  const docketCrop = useMemo(() => {
    if (!crop) return DOCKET_DATA.crops[0];
    const found = DOCKET_DATA.crops.find((c) => c.id === crop.id);
    return found || DOCKET_DATA.crops[0];
  }, [crop]);

  if (!crop) return null;

  const handleSimulateUptake = (type = 'all') => {
    setSimulated(true);
    if (onTriggerNutrientStream) {
      onTriggerNutrientStream(type);
    }
    if (onApplyPrescription) {
      onApplyPrescription(docketCrop, {
        acres: 8.5,
        totalUreaBags: 10,
        stage: docketCrop.currentStage,
      });
    }
    setTimeout(() => {
      setSimulated(false);
      if (onTriggerNutrientStream) onTriggerNutrientStream(null);
    }, 4500);
  };

  // Content body containing the exact Docket sections from Images 1, 2, and 3
  const contentBody = (
    <>
      {/* ========================================================
          1. HEADER: Biological Stage, Crop Title & View Controls
         ======================================================== */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg font-bold text-slate-950 flex-shrink-0"
            style={{ backgroundColor: docketCrop.color || '#10b981' }}
          >
            <Sprout className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold tracking-wide uppercase">
                {docketCrop.stageBadge || 'ACTIVE PHENOLOGY'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                PLOT A · 8.5 AC
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight mt-0.5">
              {docketCrop.name}
            </h2>
            <p className="text-[11px] text-slate-400 font-mono -mt-0.5">
              {docketCrop.punjabiName} · {docketCrop.hindiName} · {docketCrop.variety}
            </p>
          </div>
        </div>

        {/* Console Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onOpenSpecs && onOpenSpecs()}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1"
            title="Inspect Physiological Specs"
          >
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">{isHindi ? 'विशेषताएं' : 'Inspect Specs'}</span>
          </button>

          <button
            onClick={onFocusCamera}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Focus Camera on 3D Crop"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={isExpanded ? 'Dock to Side HUD' : 'Expand Fullscreen Modal'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-rose-950/60 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
            title="Close Docket (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          2. NAVIGATION TABS: [📋 Prescription Docket] vs [🗺️ 2D Soil Map]
         ======================================================== */}
      <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/70 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setHudTab('docket')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              hudTab === 'docket'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isHindi ? 'सिफारिश डॉकेट' : 'Prescription Docket'}</span>
          </button>

          <button
            onClick={() => setHudTab('map2d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              hudTab === 'map2d'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isHindi ? '2D मृदा नक्शा' : '2D Soil GIS Map'}</span>
          </button>
        </div>

        {/* 7-Crops Switcher Dropdown / Mini-pills */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {DOCKET_DATA.crops.map((c) => {
            const isActive = c.id === docketCrop.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCrop(c)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white font-bold border border-white/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isHindi ? c.hindiName : c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          3. MAIN TAB CONTENT: DOCKET or 2D MAP
         ======================================================== */}
      {hudTab === 'map2d' ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 overscroll-contain [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full">
          <Field2DMap
            activeCrop={docketCrop}
            onOpenDealerSlip={onOpenDealerSlip}
            onOpenDates={onOpenDates}
            isStandalone={false}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain text-slate-100 [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* ========================================================
              CARD 1: RECOMMENDED ACTION (Replica of Image 1)
             ======================================================== */}
          <div className="bg-[#FAF8F5] text-slate-900 rounded-3xl p-5 sm:p-6 border border-[#E8E3DA] shadow-xl relative overflow-hidden">
            {/* Top Badge Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#1D4D2C] uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>RECOMMENDED ACTION</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-[11px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>{docketCrop.recommendedAction.badge || 'Moisture Optimal'}</span>
              </span>
            </div>

            {/* Main Dosage Title */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
              <h3 className="text-xl sm:text-2xl lg:text-[26px] font-serif font-extrabold text-slate-900 leading-tight">
                {docketCrop.recommendedAction.title}
              </h3>
              <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                {docketCrop.recommendedAction.subtext}
              </span>
            </div>

            {/* Agronomic Application Instructions */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans mt-2">
              {docketCrop.recommendedAction.description}
            </p>

            {/* Official PAU Benchmark Footer Bar */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-slate-600 gap-1">
              <span className="text-slate-500">Official PAU Benchmark:</span>
              <span className="font-semibold text-slate-800">
                {docketCrop.recommendedAction.pauBenchmark}
              </span>
            </div>
          </div>

          {/* ========================================================
              CARD 2: COMPLETE SEASON REQUIREMENT (Replica of Image 2)
             ======================================================== */}
          <div className="bg-[#FAF8F5] text-slate-900 rounded-3xl p-5 sm:p-6 border border-[#E8E3DA] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <span className="text-xs font-mono font-bold text-slate-700 tracking-wider uppercase">
                COMPLETE SEASON REQUIREMENT FOR {docketCrop.name.toUpperCase()} (8.5 ACRES)
              </span>
              <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                PAU Research Aligned
              </span>
            </div>

            <div className="space-y-3">
              {docketCrop.seasonRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-sm sm:text-base text-slate-900">
                        {req.name}
                      </span>
                      {req.statusType === 'due' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold border border-amber-300">
                          {req.status}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-semibold border border-emerald-300 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>{req.status}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono font-medium">
                      Total: <strong className="text-slate-800">{req.totalBags}</strong>
                    </div>
                    <p className="text-[11px] text-slate-600 font-sans leading-normal">
                      {req.splitProtocol}
                    </p>
                  </div>

                  <div className="text-left sm:text-right flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div
                      className={`text-base sm:text-lg font-serif font-extrabold ${
                        req.statusType === 'due' ? 'text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {req.dueAmount}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {req.dueSchedule}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================
              CARD 3: AGRONOMIC REASONING - 4 FACTORS (Replica of Image 3)
             ======================================================== */}
          <div className="bg-[#FAF8F5] text-slate-900 rounded-3xl p-5 sm:p-6 border border-[#E8E3DA] shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <span className="text-xs font-mono font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>AGRONOMIC REASONING - TOP DRIVING FACTORS (PRD #10)</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-semibold">
                Explainable Agronomy
              </span>
            </div>

            <div className={`grid gap-2.5 ${isExpanded ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {docketCrop.agronomicReasoning.map((reason, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all space-y-1"
                >
                  <div className="flex items-start gap-1.5 font-bold text-xs sm:text-[13px] text-slate-900 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                    <span>{reason.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans pl-3">
                    {reason.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================
              CARD 4: ESTIMATED SAVINGS BANNER (Replica of Image 3)
             ======================================================== */}
          <div className="bg-[#FAF8F5] text-slate-900 rounded-3xl p-4 sm:p-5 border border-[#E8E3DA] shadow-xl flex flex-col gap-3.5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center flex-shrink-0 shadow-xs">
                <TrendingDown className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  Estimated {docketCrop.estimatedSavings.amount} Saved in Unnecessary Fertilizer
                </h4>
                <p className="text-xs text-slate-600 font-sans mt-0.5 leading-relaxed">
                  {docketCrop.estimatedSavings.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200/80 text-xs font-sans font-medium">
              <button
                type="button"
                onClick={() => onOpenCalibration && onOpenCalibration('risk')}
                className="text-amber-800 hover:text-amber-950 transition-colors flex items-center gap-1 cursor-pointer underline decoration-amber-400 py-0.5"
              >
                <span>{isHindi ? 'अति-प्रयोग जोखिम जांचें' : 'Check Over-Application Risk'}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => onOpenCalibration && onOpenCalibration('calibrate')}
                className="text-emerald-800 hover:text-emerald-950 transition-colors flex items-center gap-1 cursor-pointer underline decoration-emerald-400 py-0.5"
              >
                <span>{isHindi ? 'मृदा मान कैलिब्रेट करें' : 'Calibrate Soil Values'}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>

          {/* ========================================================
              CARD 5: REAL-TIME 3D PARTICLE DELIVERY TRIGGERS
             ======================================================== */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 text-slate-100 shadow-inner">
            <div className="flex items-center justify-between text-xs font-mono mb-2.5">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>3D SUBTERRANEAN NUTRIENT DELIVERY:</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">PHYSICAL PARTICLES</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onTriggerNutrientStream(activeNutrientStream === 'urea' ? null : 'urea')}
                className={`p-2.5 rounded-xl border text-center font-mono transition-all cursor-pointer flex flex-col items-center ${
                  activeNutrientStream === 'urea'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-md shadow-sky-500/40 scale-105'
                    : 'bg-slate-950/80 text-sky-300 border-sky-500/30 hover:border-sky-500/60'
                }`}
              >
                <span className="text-xs font-bold">Urea [N]</span>
                <span className="text-[9px] opacity-75">Nitrogen Stream</span>
              </button>

              <button
                onClick={() => onTriggerNutrientStream(activeNutrientStream === 'dap' ? null : 'dap')}
                className={`p-2.5 rounded-xl border text-center font-mono transition-all cursor-pointer flex flex-col items-center ${
                  activeNutrientStream === 'dap'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/40 scale-105'
                    : 'bg-slate-950/80 text-amber-300 border-amber-500/30 hover:border-amber-500/60'
                }`}
              >
                <span className="text-xs font-bold">DAP [P]</span>
                <span className="text-[9px] opacity-75">Basal Placement</span>
              </button>

              <button
                onClick={() => onTriggerNutrientStream(activeNutrientStream === 'mop' ? null : 'mop')}
                className={`p-2.5 rounded-xl border text-center font-mono transition-all cursor-pointer flex flex-col items-center ${
                  activeNutrientStream === 'mop'
                    ? 'bg-purple-500 text-slate-950 border-purple-400 font-bold shadow-md shadow-purple-500/40 scale-105'
                    : 'bg-slate-950/80 text-purple-300 border-purple-500/30 hover:border-purple-500/60'
                }`}
              >
                <span className="text-xs font-bold">MOP [K]</span>
                <span className="text-[9px] opacity-75">Potassium Cation</span>
              </button>

              <button
                onClick={() => onTriggerNutrientStream(activeNutrientStream === 'vermicompost' ? null : 'vermicompost')}
                className={`p-2.5 rounded-xl border text-center font-mono transition-all cursor-pointer flex flex-col items-center ${
                  activeNutrientStream === 'vermicompost'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/40 scale-105'
                    : 'bg-slate-950/80 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60'
                }`}
              >
                <span className="text-xs font-bold">Bio [Org]</span>
                <span className="text-[9px] opacity-75">Rhizosphere</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          4. ACTION FOOTER BAR
         ======================================================== */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenDealerSlip && onOpenDealerSlip()}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
            title="Print Dealer Slip"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{isHindi ? 'खाद पर्ची' : 'Dealer Slip'}</span>
          </button>

          <button
            onClick={() => onOpenDates && onOpenDates()}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
            title="View Application Dates"
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{isHindi ? 'तिथियां' : 'Dates'}</span>
          </button>

          <button
            onClick={onResetCamera}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
            title="Reset 3D Overview"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isHindi ? 'रीसेट' : 'Reset Cam'}</span>
          </button>
        </div>

        <button
          onClick={() => handleSimulateUptake('all')}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
            simulated
              ? 'bg-teal-500 text-slate-950 shadow-teal-500/40'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 active:scale-95'
          }`}
        >
          {simulated ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{isHindi ? '3D में पोषण अवशोषण सक्रिय!' : 'Nutrient Uptake Active in 3D!'}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isHindi ? '3D पोषण सिमुलेशन चलाएं' : 'Simulate 3D Delivery & Uptake'}</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  // If expanded full screen modal mode
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl bg-slate-950/95 border border-slate-800 text-slate-100 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] min-h-0">
          {contentBody}
        </div>
      </div>
    );
  }

  // Docked floating HUD on the right side of the 3D scene
  return (
    <aside className="fixed sm:absolute top-16 sm:top-20 right-3 sm:right-6 bottom-4 z-40 w-[calc(100%-1.5rem)] sm:w-[500px] lg:w-[530px] max-w-[540px] pointer-events-auto flex flex-col min-h-0 max-h-[calc(100vh-5.5rem)] sm:max-h-[calc(100vh-6.5rem)] animate-in slide-in-from-right-6 duration-300">
      <div className="flex-1 min-h-0 backdrop-blur-2xl bg-slate-950/92 border border-slate-800/90 text-slate-100 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">
        {contentBody}
      </div>
    </aside>
  );
}
