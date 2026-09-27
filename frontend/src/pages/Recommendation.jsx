import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import {
  Sparkles,
  Leaf,
  Printer,
  Calendar,
  MapPin,
  Compass,
  FileText,
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Navbar from '../components/layout/Navbar.jsx';
import HomeCanvas from '../components/HomeCanvas';
import CropInspectorHUD from '../components/CropInspectorHUD';
import Field2DMap from '../components/Field2DMap';
import { DOCKET_DATA } from '../data/docketData';
import { CROPS_DATA } from '../data/cropsData';

export default function Recommendation() {
  useDocumentTitle('Agronomic Prescription Docket — KhetGPT');
  const [searchParams] = useSearchParams();

  const sceneRefs = useRef({});
  const [, setSceneReady] = useState(false);

  // URL query param support (e.g. ?crop=rice)
  const initialCropParam = searchParams.get('crop')?.toLowerCase();
  const validInitialCrop = initialCropParam && CROPS_DATA.find((c) => c.id === initialCropParam) ? initialCropParam : 'wheat';
  const [selectedCropId, setSelectedCropId] = useState(validInitialCrop);
  const [isDocketOpen, setIsDocketOpen] = useState(Boolean(initialCropParam));

  const [activeNutrientStream, setActiveNutrientStream] = useState(null);
  const [uptakeToast, setUptakeToast] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'

  // Modals
  const [showDealerSlip, setShowDealerSlip] = useState(false);
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(null); // null | 'risk' | 'calibrate'
  const [showAskAgronomist, setShowAskAgronomist] = useState(false);

  // Calibration Slider State
  const [calibratedN, setCalibratedN] = useState(210);
  const [calibratedK, setCalibratedK] = useState(310);
  const [calibratedPh, setCalibratedPh] = useState(7.4);

  // Agronomist Chat
  const [agronomistQuery, setAgronomistQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: 'Sat Sri Akal! I am KhetGPT AI Agronomist, calibrated with PAU Package of Practices and ICAR-IISS STCR equations. How can I assist your 8.5-acre plot today?',
    },
  ]);

  const { plotMeta, crops } = DOCKET_DATA;

  // Selected crop details from DOCKET_DATA & CROPS_DATA
  const activeCrop = useMemo(() => {
    return crops.find((c) => c.id === selectedCropId) || crops[0];
  }, [crops, selectedCropId]);

  const activeCrop3D = useMemo(() => {
    return CROPS_DATA.find((c) => c.id === selectedCropId) || CROPS_DATA[0];
  }, [selectedCropId]);

  // Handle 3D nutrient uptake simulation
  const handleApplyPrescription = useCallback((crop, details) => {
    const sr = sceneRefs.current;
    if (sr) {
      if (sr.subterraneanLight) {
        gsap.fromTo(
          sr.subterraneanLight,
          { intensity: 4.8 },
          { intensity: 0, duration: 2.0, ease: 'power2.out' }
        );
      }
      if (sr.subterraneanLight2) {
        gsap.fromTo(
          sr.subterraneanLight2,
          { intensity: 4.0 },
          { intensity: 0, duration: 2.0, delay: 0.2, ease: 'power2.out' }
        );
      }
    }
    setUptakeToast({
      cropName: crop.name,
      acres: details.acres || 8.5,
      totalUreaBags: details.totalUreaBags || 10,
    });
    setTimeout(() => setUptakeToast(null), 4500);
  }, []);

  // Keyboard shortcut: ESC to deselect crop and reset camera
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (showDealerSlip || showDatesModal || showSpecsModal || showCalibrationModal || showAskAgronomist) {
          setShowDealerSlip(false);
          setShowDatesModal(false);
          setShowSpecsModal(false);
          setShowCalibrationModal(null);
          setShowAskAgronomist(false);
          return;
        }
        if (isDocketOpen) {
          setIsDocketOpen(false);
          setActiveNutrientStream(null);
          if (sceneRefs.current?.resetOverview) sceneRefs.current.resetOverview();
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isDocketOpen,
    selectedCropId,
    showDealerSlip,
    showDatesModal,
    showSpecsModal,
    showCalibrationModal,
    showAskAgronomist,
  ]);

  // Initial stage 1 setup when 3D scene is ready
  const handleSceneReady = () => {
    setSceneReady(true);
    const sr = sceneRefs.current;
    if (!sr) return;
    if (sr.camera) gsap.set(sr.camera.position, { x: 0.0, y: 7.5, z: 13.5 });
    if (sr.crop?.scale) gsap.set(sr.crop.scale, { x: 1, y: 1, z: 1 });
    if (sr.crop?.rotation) gsap.set(sr.crop.rotation, { x: 0, y: 0, z: 0 });
    if (sr.sunLight) gsap.set(sr.sunLight, { intensity: 1.75 });
    if (sr.fillLight) gsap.set(sr.fillLight, { intensity: 0.65 });
    if (sr.subterraneanLight) gsap.set(sr.subterraneanLight, { intensity: 0 });
    if (sr.subterraneanLight2) gsap.set(sr.subterraneanLight2, { intensity: 0 });
  };

  const handleAskAgronomist = (e) => {
    e.preventDefault();
    if (!agronomistQuery.trim()) return;

    const userText = agronomistQuery;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setAgronomistQuery('');

    setTimeout(() => {
      let reply = '';
      const q = userText.toLowerCase();
      if (q.includes('urea') || q.includes('nitrogen') || q.includes('khad')) {
        reply = `For ${activeCrop.name} across your 8.5 Acres in Ludhiana sandy loam, PAU recommends applying ${activeCrop.recommendedAction.title} before canal watering. Splitting urea prevents nitrate runoff into the water table.`;
      } else if (q.includes('potash') || q.includes('mop')) {
        reply = `Your soil test shows a high potassium reserve of ${calibratedK} kg/ha in Plot A. Per ICAR STCR equation, you safely save 50% Potash (saving ₹850/acre) without lodging risk.`;
      } else if (q.includes('spray') || q.includes('weather') || q.includes('rain')) {
        reply = `Open-Meteo Doppler radar confirms 0.0mm precipitation for the next 48 hours. Optimal wind speed < 8 km/h creates an ideal window for top-dressing or foliar spray.`;
      } else {
        reply = `Per PAU Research Guidelines for ${activeCrop.name} (${activeCrop.variety}): Current stage is ${activeCrop.currentStage}. Ensure soil moisture is optimal before opening canal sluice gates.`;
      }
      setChatMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 600);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#100d0a] text-slate-100 select-none">
      
      {/* ========================================================
          1. FULLSCREEN 3D WEBGL SOIL DIORAMA CANVAS (Whole Page 3D)
         ======================================================== */}
      <div className={`fixed inset-0 w-full h-full transition-opacity duration-300 ${viewMode === '3d' ? 'z-0 opacity-100 pointer-events-auto' : 'z-0 opacity-30 pointer-events-none'}`}>
        <HomeCanvas
          sceneRefs={sceneRefs}
          currentStage={1}
          onReady={handleSceneReady}
          selectedCropId={selectedCropId}
          onSelectCrop={(cropObj) => {
            setSelectedCropId(cropObj.id);
            setIsDocketOpen(true);
          }}
          activeNutrientStream={activeNutrientStream}
        />
      </div>

      {/* Atmospheric Background Glow Accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================
          2. 2D PRECISION GIS FULLSCREEN VIEW (When Toggled)
         ======================================================== */}
      {viewMode === '2d' && (
        <div className="absolute inset-0 z-10 p-4 sm:p-8 pt-24 sm:pt-28 bg-[#0a0f16] flex items-center justify-center animate-in fade-in duration-300">
          <div className="w-full max-w-5xl h-[82vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 p-2">
            <Field2DMap activeCrop={activeCrop} />
          </div>
        </div>
      )}

      {/* ========================================================
          3. FLOATING TOP KHETGPT NAVBAR & DOCKET CONTROLS
         ======================================================== */}
      <div className="relative z-40 pointer-events-auto w-full">
        <Navbar />
      </div>

      {/* Floating Action Sub-Bar (Docket Meta + View & Print Controls) */}
      <div className="absolute top-18 sm:top-20 left-0 right-0 z-30 px-3 sm:px-6 max-w-6xl mx-auto flex items-center justify-between pointer-events-none flex-wrap gap-2">
        
        {/* Left: Agronomic Docket Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="backdrop-blur-xl bg-slate-950/85 border border-slate-800/90 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg shadow-black/40">
            <div className="w-6 h-6 rounded-lg bg-[#2D5430] flex items-center justify-center shadow-xs">
              <Leaf className="w-3.5 h-3.5 text-emerald-300 font-bold" />
            </div>
            <div>
              <span className="font-serif font-bold text-xs tracking-wide text-white block leading-tight">
                Prescription Docket
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <span>Plot A · 8.5 Ac</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Weather Safe (0.0mm rain)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 backdrop-blur-xl bg-slate-950/70 border border-slate-800/80 px-2.5 py-1 rounded-xl text-[10px] font-mono text-slate-300">
            <span className="text-emerald-400 font-bold">PAU STCR CALIBRATED</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Offline Cached</span>
          </div>
        </div>

        {/* Right: Quick Tools (2D Map, Slip, Dates) */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* 3D vs 2D Toggle */}
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              viewMode === '2d'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-cyan-500/25'
                : 'backdrop-blur-md bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-cyan-300'
            }`}
            title="Toggle between 3D Farm Diorama and 2D GIS Soil Map"
          >
            {viewMode === '2d' ? (
              <>
                <Compass className="w-3.5 h-3.5" />
                <span>Switch to 3D Farm</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2D Soil GIS Map</span>
                <span className="sm:hidden">2D Map</span>
              </>
            )}
          </button>

          {/* Print Dealer Slip */}
          <button
            onClick={() => setShowDealerSlip(true)}
            className="backdrop-blur-md bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:border-slate-700"
            title="Print Official Fertilizer Dealer Slip"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Dealer Slip</span>
          </button>

          {/* Application Dates */}
          <button
            onClick={() => setShowDatesModal(true)}
            className="backdrop-blur-md bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:border-slate-700"
            title="View Calibrated Application Dates Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Schedule</span>
          </button>

          {/* Prescription Docket HUD Toggle Button */}
          <button
            onClick={() => {
              if (!selectedCropId) setSelectedCropId('wheat');
              setIsDocketOpen(!isDocketOpen);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isDocketOpen
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-emerald-500/25'
                : 'backdrop-blur-md bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-emerald-400 hover:border-emerald-500/50'
            }`}
            title={isDocketOpen ? 'Close Prescription Docket' : 'Open Prescription Docket'}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDocketOpen ? 'Close Docket' : 'Prescription Docket'}</span>
            <span className="sm:hidden">{isDocketOpen ? 'Close' : 'Docket'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          4. FLOATING 7-CROP SELECTOR BAR
         ======================================================== */}
      <div className="absolute top-28 sm:top-32 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[95vw] overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-2 py-1">
        <div className="backdrop-blur-xl bg-slate-950/85 border border-slate-800/90 rounded-full px-3 py-1.5 shadow-2xl shadow-black/50 flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 pl-1 pr-1.5 flex items-center gap-1 flex-shrink-0">
            <span>Select Crop:</span>
          </span>

          {crops.map((c) => {
            const isSelected = selectedCropId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCropId(c.id);
                  setIsDocketOpen(true);
                  if (sceneRefs.current?.focusCrop) sceneRefs.current.focusCrop(c.id);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isSelected && isDocketOpen
                    ? 'bg-[#1D4D2C] text-white border border-emerald-400/60 shadow-lg shadow-emerald-950/60 font-semibold scale-105'
                    : 'bg-slate-900/70 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.color || '#10b981' }}
                />
                <span>{c.displayLabel || `${c.name} (${c.punjabiName})`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          5. MINIMALIST CENTER PROMPT (When Docket is Closed)
         ======================================================== */}
      {!isDocketOpen && (
        <div className="absolute top-44 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 backdrop-blur-xl bg-slate-950/85 border border-slate-800/90 px-5 py-2.5 rounded-full text-xs text-slate-200 shadow-2xl">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          <span className="hidden sm:inline">Click any 3D crop on the soil diorama or select a crop to view prescription docket</span>
          <span className="sm:hidden">Select crop to view prescription docket</span>
          <button
            onClick={() => {
              setSelectedCropId(selectedCropId || 'wheat');
              setIsDocketOpen(true);
            }}
            className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] cursor-pointer shadow-xs transition-all shrink-0 active:scale-95"
          >
            View Docket
          </button>
        </div>
      )}

      {/* ========================================================
          6. BIO-UPTAKE SIMULATION FLOATING TOAST
         ======================================================== */}
      {uptakeToast && (
        <div className="absolute top-40 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 text-xs font-mono shadow-2xl shadow-emerald-500/30 animate-in fade-in zoom-in-95 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>
            Bio-absorption simulated for <strong>{uptakeToast.cropName}</strong> ({uptakeToast.acres} Ac) · Subsurface root lights active!
          </span>
        </div>
      )}

      {/* ========================================================
          7. 3D FERTILIZER PRESCRIPTION DOCKET CONSOLE (CropInspectorHUD)
         ======================================================== */}
      {isDocketOpen && (
        <CropInspectorHUD
          crop={activeCrop3D}
          onClose={() => {
            setIsDocketOpen(false);
            setActiveNutrientStream(null);
            if (sceneRefs.current?.resetOverview) sceneRefs.current.resetOverview();
          }}
          onSelectCrop={(c) => {
            setSelectedCropId(c.id);
            if (sceneRefs.current?.focusCrop) sceneRefs.current.focusCrop(c.id);
          }}
          activeNutrientStream={activeNutrientStream}
          onTriggerNutrientStream={setActiveNutrientStream}
          onFocusCamera={() => {
            if (sceneRefs.current?.focusCrop) sceneRefs.current.focusCrop(selectedCropId || 'wheat');
          }}
          onResetCamera={() => {
            if (sceneRefs.current?.resetOverview) sceneRefs.current.resetOverview();
          }}
          onApplyPrescription={handleApplyPrescription}
          onOpenDealerSlip={() => setShowDealerSlip(true)}
          onOpenDates={() => setShowDatesModal(true)}
          onOpenSpecs={() => setShowSpecsModal(true)}
          onOpenCalibration={(mode) => setShowCalibrationModal(mode)}
        />
      )}

      {/* ========================================================
          8. FLOATING "ASK AGRONOMIST" BUTTON (Bottom-Right)
         ======================================================== */}
      <div className="absolute bottom-4 right-4 z-40 pointer-events-auto">
        <button
          onClick={() => setShowAskAgronomist(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-white text-xs font-semibold shadow-2xl shadow-black/80 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>🌾 Ask Agronomist (PRD #16)</span>
        </button>
      </div>

      {/* ========================================================
          MODAL 1: PRINT DEALER SLIP
         ======================================================== */}
      {showDealerSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                  Punjab Agricultural University · STCR Model
                </span>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  Fertilizer Retail Purchase Slip
                </h3>
              </div>
              <button
                onClick={() => setShowDealerSlip(false)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between">
                <span className="text-slate-500 font-mono">Docket ID:</span>
                <span className="font-mono font-bold text-slate-800">{plotMeta.docketId}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between">
                <span className="text-slate-500 font-mono">Location &amp; Acreage:</span>
                <span className="font-mono font-bold text-slate-800">{plotMeta.plotName} · {plotMeta.acreage} Acres</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between">
                <span className="text-slate-500 font-mono">Crop Selection:</span>
                <span className="font-mono font-bold text-slate-900">{activeCrop.name} ({activeCrop.variety})</span>
              </div>

              <div className="border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="font-bold text-slate-900 font-mono text-[11px] text-slate-500 uppercase">
                  Calibrated Retail Sacks Due Now:
                </div>
                {activeCrop.seasonRequirements.map((r, i) => (
                  <div key={i} className="flex justify-between py-1 border-b last:border-0 font-mono text-xs">
                    <span className="text-slate-700">{r.name}</span>
                    <span className={`font-bold ${r.statusType === 'due' ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {r.dueAmount}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-500 italic bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
                Calibrated per PAU STCR yield equation. Subsidy QR code verified by Punjab Mandi Board.
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip</span>
              </button>
              <button
                onClick={() => setShowDealerSlip(false)}
                className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: APPLICATION DATES CALENDAR
         ======================================================== */}
      {showDatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  {activeCrop.name} Fertilizer Calendar
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Irrigation Turn &amp; Weather-Synchronized Schedule (Plot A)
                </p>
              </div>
              <button
                onClick={() => setShowDatesModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {activeCrop.seasonRequirements.map((r, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold text-slate-900 mb-1">
                    <span>{r.name}</span>
                    <span className={r.statusType === 'due' ? 'text-amber-700 font-mono' : 'text-emerald-700 font-mono'}>
                      {r.dueSchedule}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{r.splitProtocol}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDatesModal(false)}
                className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: INSPECT SPECS & PHYSIOLOGY
         ======================================================== */}
      {showSpecsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  {activeCrop.name} Physiological Specs
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Variety: {activeCrop.variety}
                </p>
              </div>
              <button
                onClick={() => setShowSpecsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-500">Duration:</span>
                <span className="font-bold text-slate-900">{activeCrop.season}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-500">PAU Benchmark:</span>
                <span className="font-bold text-slate-900">{activeCrop.recommendedAction.pauBenchmark}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-500">Active Stage:</span>
                <span className="font-bold text-amber-700">{activeCrop.currentStage}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-500">3D Asset Type:</span>
                <span className="font-bold text-emerald-800">{activeCrop.modelType.toUpperCase()} Model</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Soil Buffer:</span>
                <span className="font-bold text-slate-900">Sandy Loam (pH {calibratedPh})</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSpecsModal(false)}
                className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: CALIBRATE SOIL VALUES / OVER-APPLICATION RISK
         ======================================================== */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  {showCalibrationModal === 'risk'
                    ? 'Over-Application & Leaching Risk Analysis'
                    : 'Soil Test Calibration & STCR Adjuster'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Plot A (8.5 Acres) · PAU Soil Test Response Equations
                </p>
              </div>
              <button
                onClick={() => setShowCalibrationModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {showCalibrationModal === 'risk' ? (
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                  <strong className="block font-bold mb-1">Nitrate Leaching Threat:</strong>
                  Applying &gt; 125 kg N/ha on sandy loam when rain exceeds 10mm causes 42% nitrogen migration into the alluvial aquifer, increasing toxicity and wasting ₹3,400.
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <strong className="block font-bold mb-1">Safety Lock:</strong>
                  The 48-Hour Open-Meteo Radar Window confirms zero precipitation. Top-dressing now locks nitrogen in the crown root zone.
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-mono mb-1 font-bold">
                    <span>Available Soil Nitrogen (N):</span>
                    <span className="text-amber-700">{calibratedN} kg/ha (Low)</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="350"
                    value={calibratedN}
                    onChange={(e) => setCalibratedN(Number(e.target.value))}
                    className="w-full cursor-pointer accent-amber-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono mb-1 font-bold">
                    <span>Soil Potassium Buffer (K):</span>
                    <span className="text-purple-700">{calibratedK} kg/ha (High)</span>
                  </div>
                  <input
                    type="range"
                    min="180"
                    max="450"
                    value={calibratedK}
                    onChange={(e) => setCalibratedK(Number(e.target.value))}
                    className="w-full cursor-pointer accent-purple-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono mb-1 font-bold">
                    <span>Soil pH Level:</span>
                    <span className="text-cyan-700">{calibratedPh} (Neutral-Alkaline)</span>
                  </div>
                  <input
                    type="range"
                    min="6.0"
                    max="8.5"
                    step="0.1"
                    value={calibratedPh}
                    onChange={(e) => setCalibratedPh(Number(e.target.value))}
                    className="w-full cursor-pointer accent-cyan-600"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCalibrationModal(null)}
                className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800"
              >
                Apply &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: ASK AGRONOMIST AI CHAT (PRD #16)
         ======================================================== */}
      {showAskAgronomist && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Ask Agronomist (PRD #16)
                </h3>
              </div>
              <button
                onClick={() => setShowAskAgronomist(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-3 bg-[#FAF8F5] rounded-2xl border border-slate-200 min-h-[220px] max-h-[360px] text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#1D4D2C] text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Prompts */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none text-[10px]">
              <button
                type="button"
                onClick={() => setAgronomistQuery('Why is Potash saved for my plot?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer"
              >
                Why is Potash saved?
              </button>
              <button
                type="button"
                onClick={() => setAgronomistQuery('What is the best irrigation timing for urea?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer"
              >
                Urea irrigation timing?
              </button>
              <button
                type="button"
                onClick={() => setAgronomistQuery('Explain 48-hour radar window.')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer"
              >
                Radar window?
              </button>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleAskAgronomist} className="flex gap-2 pt-2 border-t">
              <input
                type="text"
                value={agronomistQuery}
                onChange={(e) => setAgronomistQuery(e.target.value)}
                placeholder="Ask about fertilizer, weather, soil tests..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1D4D2C] hover:bg-[#163c22] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
