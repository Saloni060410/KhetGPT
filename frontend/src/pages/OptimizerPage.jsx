import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderNav from '../components/HeaderNav';
import SoilCanvas from '../components/SoilCanvas';
import SoilSequenceCanvas from '../components/SoilSequenceCanvas';
import MetricCard from '../components/MetricCard';
import NPKBar from '../components/NPKBar';
import TemporalScrubber from '../components/TemporalScrubber';
import OptimizationModal from '../components/OptimizationModal';
import { 
  Droplet, 
  DollarSign, 
  ShieldAlert, 
  Activity, 
  Sparkles, 
  ArrowUpRight, 
  Tractor, 
  CloudSun,
  ArrowLeft
} from 'lucide-react';

export default function OptimizerPage({ onNavigate }) {
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

  const [recoveryProgress, setRecoveryProgress] = useState(0.72);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('sequence'); // 'sequence' | '3d'

  // Dynamic calculated metrics based on recoveryProgress
  const soilHealthScore = Math.round(35 + recoveryProgress * 58); // 35 to 93
  const moisturePercentage = (22 + recoveryProgress * 36).toFixed(1); // 22% to 58%
  const costSavingsPerAcre = (18 + recoveryProgress * 38).toFixed(2); // $18 to $56
  const totalParcelSavings = (parseFloat(costSavingsPerAcre) * 240).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
  const carbonOffsetTons = (1.2 + recoveryProgress * 3.4).toFixed(1);

  // Dynamic NPK values
  const nitrogenPpm = Math.round(18 + recoveryProgress * 32); // Target: 42 ppm
  const phosphorusPpm = Math.round(14 + recoveryProgress * 22); // Target: 30 ppm
  const potassiumPpm = Math.round(110 + recoveryProgress * 85); // Target: 175 ppm

  const getNPKStatus = (current, target) => {
    const ratio = current / target;
    if (ratio < 0.7) return 'Deficient';
    if (ratio > 1.25) return 'Surplus / Washout Risk';
    return 'Optimal Uptake';
  };

  return (
    <div className="min-h-screen bg-forest-900 text-slate-100 flex flex-col agri-grid-bg relative selection:bg-emerald-500/30 selection:text-emerald-bright">
      {/* Top Global Navigation Bar */}
      <HeaderNav onOpenOptimizer={() => setIsModalOpen(true)} />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        
        {/* Breadcrumb Back Link */}
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <a
            href="/"
            onClick={(e) => handleNav(e, '/')}
            className="inline-flex items-center space-x-1 hover:text-[#00f59b] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scrollytelling Trench</span>
          </a>
          <span>/</span>
          <span className="text-white">Field Optimizer Dashboard</span>
        </div>

        {/* Value Proposition Hero Banner */}
        <section className="glass-panel p-5 sm:p-6 rounded-2xl border-forest-700/60 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-bright text-[11px] font-mono mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-bright animate-beacon" />
                <span>Variable-Rate Precision Engine • Live Machine Export</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight">
                Parcel 14-B Variable-Rate Fertilizer Calibration
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Connect in-field soil probes with 7-day predictive rain forecasts to deliver precision variable-rate N-P-K recipes that feed your crop—not your drainage ditches.
              </p>
            </div>

            {/* Quick Scenario State Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start lg:self-center bg-forest-950/80 p-2 rounded-xl border border-forest-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 pl-1 sm:pl-2">
                Simulate Field State:
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setRecoveryProgress(0.12)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    recoveryProgress < 0.35 
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Over-Fertilized
                </button>
                <button
                  onClick={() => setRecoveryProgress(0.55)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    recoveryProgress >= 0.35 && recoveryProgress < 0.8
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Variable-Rate Split
                </button>
                <button
                  onClick={() => setRecoveryProgress(0.92)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    recoveryProgress >= 0.8 
                      ? 'bg-emerald-500/25 text-emerald-bright border border-emerald-500/50 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Regenerative Peak
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Column Spatial Layout: Left Telemetry | Center 3D Soil Core | Right Financial ROI */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT DOCK: Soil Ingestion & Chemistry (Cols 1–3) ================= */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Primary Soil Health Gauge Card */}
            <div className="glass-panel p-4 rounded-2xl border-forest-700/60 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Soil Biological Health
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  soilHealthScore > 75 
                    ? 'text-emerald-bright bg-emerald-950/60 border-emerald-500/40' 
                    : soilHealthScore > 50 
                      ? 'text-amber-400 bg-amber-950/60 border-amber-500/40' 
                      : 'text-rose-400 bg-rose-950/60 border-rose-500/40'
                }`}>
                  {soilHealthScore > 75 ? 'Active Biological Loam' : soilHealthScore > 50 ? 'Moderate Buffer' : 'Compacted / Acidic'}
                </span>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold font-mono text-white tracking-tight">
                  {soilHealthScore}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ 100 Health Index</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-forest-950 rounded-full mt-3 overflow-hidden border border-forest-800">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-bright transition-all duration-500" 
                  style={{ width: `${soilHealthScore}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-2.5 text-[10px] font-mono text-slate-400">
                <span>Soil Organic Matter: <strong className="text-slate-200">{(1.8 + recoveryProgress * 3.1).toFixed(1)}%</strong></span>
                <span className="text-emerald-bright">↑ +1.4% this cycle</span>
              </div>
            </div>

            {/* Live N-P-K Ion Balance Panel */}
            <div className="glass-panel p-4 rounded-2xl border-forest-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-bright" />
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                    Root-Zone N-P-K Chemistry
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Target Range</span>
              </div>

              <div className="space-y-2.5">
                <NPKBar
                  label="Nitrogen (Plant-Available NO₃⁻)"
                  symbol="N"
                  current={nitrogenPpm}
                  target={42}
                  color="nitrogen"
                  status={getNPKStatus(nitrogenPpm, 42)}
                />
                <NPKBar
                  label="Phosphorus (Active P₂O₅)"
                  symbol="P"
                  current={phosphorusPpm}
                  target={30}
                  color="phosphorus"
                  status={getNPKStatus(phosphorusPpm, 30)}
                />
                <NPKBar
                  label="Potassium (Potash K₂O)"
                  symbol="K"
                  current={potassiumPpm}
                  target={175}
                  color="potassium"
                  status={getNPKStatus(potassiumPpm, 175)}
                />
              </div>
            </div>

            {/* Soil Moisture & Water Retention */}
            <MetricCard
              title="Root-Zone Water Retention"
              value={moisturePercentage}
              unit="%"
              delta="+12.4% water holding capacity"
              isPositive={true}
              icon={Droplet}
              accent="cyan"
              subtitle="0–45 cm Depth Profile"
              sparklineData={[24, 28, 32, 38, 42, 45, 52, Math.round(parseFloat(moisturePercentage))]}
              statusTag="Drought Buffer"
            />
          </div>

          {/* ================= CENTER STICKY CANVAS: 3D / Sequence Core (Cols 4–9) ================= */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            
            <div className="glass-panel rounded-3xl border-forest-700/60 overflow-hidden relative shadow-2xl h-[460px] sm:h-[520px] flex flex-col">
              
              {/* View Mode Switcher Header Pill */}
              <div className="absolute top-4 right-4 z-20 flex items-center space-x-1 bg-forest-950/80 backdrop-blur-md p-1 rounded-xl border border-forest-800 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setViewMode('sequence')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    viewMode === 'sequence'
                      ? 'bg-emerald-500/20 text-emerald-bright border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  240-Frame Sequence
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    viewMode === '3d'
                      ? 'bg-emerald-500/20 text-emerald-bright border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3D Orbit Core
                </button>
              </div>

              {/* Central Canvas Viewport */}
              <div className="w-full flex-1 relative">
                {viewMode === 'sequence' ? (
                  <SoilSequenceCanvas recoveryProgress={recoveryProgress} />
                ) : (
                  <SoilCanvas recoveryProgress={recoveryProgress} />
                )}
              </div>

              {/* Viewport Floating Status Ribbon */}
              <div className="px-5 py-2.5 bg-forest-950/85 backdrop-blur-md border-t border-forest-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-bright" />
                  <span className="font-mono text-slate-300">
                    Field Condition: <strong className="text-white">
                      {recoveryProgress < 0.35 
                        ? 'Excess Chemical Salt & Compaction' 
                        : recoveryProgress < 0.75 
                          ? 'Active Bio-Stimulant Colonization' 
                          : 'Optimal Microbial Equilibrium'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                  <span>Root Spread: <strong className="text-emerald-bright">{(24 + recoveryProgress * 48).toFixed(0)} cm</strong></span>
                  <span>•</span>
                  <span>Nutrient Absorption: <strong className="text-white">{(40 + recoveryProgress * 55).toFixed(0)}%</strong></span>
                </div>
              </div>
            </div>

            {/* Floating Temporal Recovery Scrubber */}
            <TemporalScrubber
              recoveryProgress={recoveryProgress}
              onProgressChange={setRecoveryProgress}
            />
          </div>

          {/* ================= RIGHT DOCK: Financial ROI & Prescriptions (Cols 10–12) ================= */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Real-Time Cost Savings & ROI Card */}
            <MetricCard
              title="Fertilizer Input Savings"
              value={`$${costSavingsPerAcre}`}
              unit="/ acre"
              delta={`$${totalParcelSavings} total farm savings`}
              isPositive={true}
              icon={DollarSign}
              accent="emerald"
              subtitle="North Field 14 (240 Acres)"
              sparklineData={[18, 22, 26, 31, 35, 42, 48, Math.round(parseFloat(costSavingsPerAcre))]}
              statusTag="Direct ROI"
            />

            {/* Runoff & Leaching Risk Reduction Card */}
            <MetricCard
              title="Nitrate Runoff Risk"
              value={`${Math.max(12, Math.round(82 - recoveryProgress * 65))}`}
              unit="%"
              delta="-48% wasted nitrogen leaching"
              isPositive={true}
              icon={ShieldAlert}
              accent="ochre"
              subtitle="Watershed & EPA Compliance"
              sparklineData={[85, 80, 72, 65, 55, 42, 28, Math.max(12, Math.round(82 - recoveryProgress * 65))]}
              statusTag={recoveryProgress > 0.6 ? 'Safe Margin' : 'High Runoff Risk'}
            />

            {/* AI Prescription Action Card */}
            <div className="glass-panel p-5 rounded-2xl border-emerald-500/30 shadow-[0_0_30px_-5px_rgba(0,245,155,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-bright/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center space-x-2 text-emerald-bright mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  Variable-Rate Prescription
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                Optimized Fertilizer Recipe Ready
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Reduces synthetic urea by <strong className="text-amber-400">36%</strong> and blends humic biostimulants to unlock phosphorus trapped in soil.
              </p>

              <div className="space-y-2 mb-4 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Carbon Credit Offset:</span>
                  <span className="text-emerald-bright font-semibold">+{carbonOffsetTons} Tons CO₂e</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Projected Yield Impact:</span>
                  <span className="text-white font-semibold">+14.2 bu/acre</span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-bright hover:from-emerald-400 hover:to-emerald-bright text-forest-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(0,245,155,0.3)] transition-all active:scale-95 cursor-pointer"
              >
                <span>Review & Export Prescription</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weather & Machine Compatibility Card */}
            <div className="glass-panel p-3.5 rounded-2xl border-forest-700/50 space-y-2 text-xs font-mono text-slate-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CloudSun className="w-4 h-4 text-cyan-400" />
                  <span>Rain Window:</span>
                </div>
                <span className="text-emerald-bright font-semibold">48h Dry Window</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-forest-800 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <Tractor className="w-3.5 h-3.5 text-slate-400" />
                  <span>Machinery:</span>
                </div>
                <span className="text-slate-300">John Deere, Raven, Trimble</span>
              </div>
            </div>

          </div>

        </section>

      </main>

      {/* AI Variable Rate Recipe Modal */}
      <OptimizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recoveryProgress={recoveryProgress}
      />
    </div>
  );
}
