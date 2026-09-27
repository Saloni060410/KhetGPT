import React from 'react';
import { X, CheckCircle, Sparkles, TrendingDown, DollarSign, Leaf, Zap, Send, CloudRain, Tractor } from 'lucide-react';

export default function OptimizationModal({ isOpen, onClose, recoveryProgress }) {
  if (!isOpen) return null;

  const costSavingsPerAcre = (32 + recoveryProgress * 24).toFixed(2);
  const totalParcelSavings = (parseFloat(costSavingsPerAcre) * 240).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border-emerald-500/30 p-6 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-bright/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-forest-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-bright shadow-[0_0_15px_rgba(0,245,155,0.25)]">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Tailored Variable-Rate Fertilizer Prescription
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Field 14-B (240 Tillable Acres) • Calibrated for Next 7-Day Weather & Soil Temp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-forest-800/80 hover:bg-forest-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prescription Matrix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="p-3.5 rounded-xl bg-forest-900/80 border border-forest-700/60">
            <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
              <DollarSign className="w-4 h-4 text-emerald-bright" />
              <span>Input Cost Savings</span>
            </div>
            <div className="text-xl font-mono font-bold text-white">${costSavingsPerAcre} <span className="text-xs text-slate-400 font-normal">/ acre</span></div>
            <div className="text-[11px] font-mono text-emerald-400 mt-1">Total: ${totalParcelSavings} saved this season</div>
          </div>

          <div className="p-3.5 rounded-xl bg-forest-900/80 border border-forest-700/60">
            <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <span>Synthetic Over-Fertilization Cut</span>
            </div>
            <div className="text-xl font-mono font-bold text-white">-36.4% <span className="text-xs text-slate-400 font-normal">bulk urea</span></div>
            <div className="text-[11px] font-mono text-amber-400 mt-1">Eliminates salt burn & leaching</div>
          </div>

          <div className="p-3.5 rounded-xl bg-forest-900/80 border border-forest-700/60">
            <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
              <Leaf className="w-4 h-4 text-cyan-400" />
              <span>Soil Health Biostimulant</span>
            </div>
            <div className="text-xl font-mono font-bold text-white">+18.5% <span className="text-xs text-slate-400 font-normal">humic blend</span></div>
            <div className="text-[11px] font-mono text-cyan-400 mt-1">Unlocks bound soil phosphorus</div>
          </div>
        </div>

        {/* Weather Window Verification Banner */}
        <div className="p-3 rounded-xl bg-forest-900/90 border border-cyan-500/30 flex items-center justify-between text-xs mb-4">
          <div className="flex items-center space-x-2.5">
            <CloudRain className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">Weather-Integrated Application Window: </span>
              <span className="text-slate-300">0.0" rainfall forecast next 48h. Soil temp 14°C. Perfect incorporation conditions.</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 whitespace-nowrap ml-2">
            Low Runoff Risk
          </span>
        </div>

        {/* Detailed Application Steps */}
        <div className="space-y-2 mb-6">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Prescription Rate Breakdown by Zone
          </h4>
          
          <div className="p-3 rounded-xl bg-forest-900/60 border border-forest-700/40 flex items-center justify-between text-xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-bright" />
                <span className="text-slate-200 font-medium">Zone A (High Biomass Ridge)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Reduce nitrogen to 58 kg/ha; plant roots already tapped deep nitrogen reserve</p>
            </div>
            <span className="font-mono text-emerald-400 font-bold">-$14.20/ac</span>
          </div>

          <div className="p-3 rounded-xl bg-forest-900/60 border border-forest-700/40 flex items-center justify-between text-xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-200 font-medium">Zone B (Slope / Erosion Risk)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Switch to slow-release polymer coating + humic chelator to stop downhill runoff</p>
            </div>
            <span className="font-mono text-slate-200 font-bold">Optimal Buffer</span>
          </div>

          <div className="p-3 rounded-xl bg-forest-900/60 border border-forest-700/40 flex items-center justify-between text-xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-slate-200 font-medium">Zone C (Depleted Sandy Loam)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Targeted potassium-potash band directly in seed furrow for drought resilience</p>
            </div>
            <span className="font-mono text-cyan-400 font-bold">+2.8 bu/ac</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-forest-700/60">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <Zap className="w-4 h-4 text-emerald-bright" />
            <span>Exports as ISO-XML / Shapefile for John Deere, Raven & Trimble displays</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-700 text-xs font-medium text-slate-300 transition-all"
            >
              Close
            </button>
            <button
              onClick={() => {
                alert('Prescription map exported! Compatible file (.SHP & ISO-XML) sent to connected machine monitor.');
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-bright hover:from-emerald-400 hover:to-emerald-bright text-forest-950 font-bold text-xs flex items-center space-x-1.5 shadow-[0_0_20px_rgba(0,245,155,0.3)] transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Tractor Spreader</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
