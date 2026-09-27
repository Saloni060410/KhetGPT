import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Satellite, Activity, CloudSun, Download, Sparkles, ChevronDown, ShieldCheck } from 'lucide-react';

export default function HeaderNav({ onOpenOptimizer }) {
  return (
    <header className="glass-panel border-b border-forest-700/60 sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Parcel Selector */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-bright/30 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,245,155,0.25)] group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-emerald-bright" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white tracking-wider font-mono">
                  KHET<span className="text-emerald-bright">GPT</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-bright font-semibold">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Precision Fertilizer & Soil Optimizer</p>
            </div>
          </Link>

          <div className="h-6 w-[1px] bg-forest-700/60 hidden sm:block" />

          {/* Parcel Switcher */}
          <div className="relative hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-forest-900/80 border border-forest-700/60 hover:border-forest-600 cursor-pointer transition-all">
            <div className="w-2 h-2 rounded-full bg-emerald-bright animate-beacon" />
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-200 block leading-tight">
                North Field 14 • Corn / Soybean Rotation
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                240 Tillable Acres • Silt Loam Horizon
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>
        </div>

        {/* Live Weather & Telemetry Ingestion */}
        <div className="flex items-center justify-between md:justify-end space-x-3">
          <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-forest-950/60 border border-forest-800 text-[11px] font-mono text-slate-400">
            <div className="flex items-center space-x-1.5" title="Crop Vigor (Sentinel-2 Imagery)">
              <Satellite className="w-3.5 h-3.5 text-cyan-400" />
              <span>Crop Canopy Vigor: <strong className="text-slate-200">0.78 NDVI</strong></span>
            </div>
            <span className="text-forest-700">•</span>
            <div className="flex items-center space-x-1.5" title="Soil Sensor Mesh Real-time Connectivity">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>In-Field Probes: <strong className="text-emerald-400">Active</strong></span>
            </div>
            <span className="text-forest-700">•</span>
            <div className="flex items-center space-x-1.5" title="Local Weather & Rain Window">
              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
              <span>Clear Next 48h (Safe Spray Window)</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-xl bg-forest-800/80 hover:bg-forest-700/80 border border-forest-700 text-slate-200 font-medium text-xs transition-all"
            >
              Dashboard
            </Link>

            <button 
              onClick={onOpenOptimizer}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-forest-950 font-bold text-xs flex items-center space-x-1.5 shadow-[0_0_20px_rgba(0,245,155,0.3)] transition-all duration-200 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Calculate Fertilizer Plan</span>
            </button>

            <button 
              className="p-1.5 rounded-xl bg-forest-800/60 hover:bg-forest-700/60 border border-forest-700 text-slate-300 transition-all"
              title="Download Farm Report (PDF/CSV)"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
