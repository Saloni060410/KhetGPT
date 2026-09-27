import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function TemporalScrubber({ recoveryProgress, onProgressChange }) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        onProgressChange(prev => {
          if (prev >= 1.0) {
            setIsPlaying(false);
            return 1.0;
          }
          const next = prev + 0.015;
          if (next >= 1.0) {
            setIsPlaying(false);
            return 1.0;
          }
          return next;
        });
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isPlaying, onProgressChange]);

  const stages = [
    { value: 0.1, label: 'Current Problem', desc: 'Over-Fertilization Burn', icon: AlertTriangle, color: 'text-amber-400' },
    { value: 0.45, label: 'Precision Split', desc: 'Variable-Rate Dosing', icon: TrendingUp, color: 'text-cyan-400' },
    { value: 0.75, label: 'Root Expansion', desc: 'Rhizosphere Aeration', icon: Sparkles, color: 'text-emerald-400' },
    { value: 1.0, label: 'Optimal Harvest', desc: 'Peak Bushels & Low Input Cost', icon: CheckCircle2, color: 'text-emerald-bright' },
  ];

  return (
    <div className="glass-panel p-4 rounded-2xl border-forest-700/70 shadow-2xl relative">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border ${
              isPlaying 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-bright border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(0,245,155,0.25)]'
            }`}
            title={isPlaying ? 'Pause 90-Day Simulation' : 'Play 90-Day Root Recovery Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          
          <button
            onClick={() => {
              setIsPlaying(false);
              onProgressChange(0.1);
            }}
            className="w-9 h-9 rounded-xl bg-forest-800/80 hover:bg-forest-700/80 border border-forest-700 text-slate-300 flex items-center justify-center transition-all duration-200"
            title="Reset to Day 0 (Current Baseline)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                90-Day Soil Recovery Timeline
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-forest-800 border border-forest-700 text-slate-300">
                Day {Math.round(recoveryProgress * 90)} of Season
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Drag slider to preview how tailored N-P-K schedules transform root depth, moisture holding capacity, and input spend.
            </p>
          </div>
        </div>

        {/* Milestone Quick Jump Buttons */}
        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
          {stages.map((stage, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsPlaying(false);
                onProgressChange(stage.value);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all duration-200 border ${
                Math.abs(recoveryProgress - stage.value) < 0.15
                  ? 'bg-forest-800 border-emerald-500/50 text-emerald-bright shadow-[0_0_12px_rgba(0,245,155,0.2)]'
                  : 'bg-forest-950/60 border-forest-800 text-slate-400 hover:text-slate-200 hover:border-forest-700'
              }`}
            >
              {stage.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrub Slider Bar */}
      <div className="relative pt-1 pb-2">
        <input
          type="range"
          min="0.05"
          max="1.0"
          step="0.005"
          value={recoveryProgress}
          onChange={(e) => {
            setIsPlaying(false);
            onProgressChange(parseFloat(e.target.value));
          }}
          className="w-full h-2 bg-forest-950 rounded-lg appearance-none cursor-pointer accent-emerald-bright border border-forest-700/60 focus:outline-none"
        />
        
        {/* Track Milestones indicator markers */}
        <div className="flex justify-between items-center mt-2 px-1 text-[11px] font-mono text-slate-500">
          <span>Day 0 (High Chemical Waste)</span>
          <span className="text-slate-400">Day 30 (Root Zone Activation)</span>
          <span className="text-slate-400">Day 60 (NPK Uptake Peak)</span>
          <span className="text-emerald-bright font-semibold">Day 90 (Max Yield & Soil Health)</span>
        </div>
      </div>
    </div>
  );
}
