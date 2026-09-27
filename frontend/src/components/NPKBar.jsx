export default function NPKBar({ label, symbol, current, target, unit = 'ppm', color, status }) {
  const percentage = Math.min(Math.max((current / (target * 1.5)) * 100, 5), 100);
  const targetPercentage = (target / (target * 1.5)) * 100;

  const colorStyles = {
    nitrogen: {
      bar: 'bg-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
      badge: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    phosphorus: {
      bar: 'bg-amber-400',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]',
      badge: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    potassium: {
      bar: 'bg-cyan-400',
      glow: 'shadow-[0_0_12px_rgba(6,182,212,0.5)]',
      badge: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30',
      dot: 'bg-cyan-400',
    }
  }[color] || {
    bar: 'bg-emerald-400',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    badge: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
    dot: 'bg-emerald-400',
  };

  return (
    <div className="group p-3 rounded-xl bg-forest-900/60 border border-forest-700/50 hover:border-forest-600 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-md bg-forest-800 border border-forest-700 flex items-center justify-center font-mono font-bold text-xs text-slate-200">
            {symbol}
          </span>
          <span className="text-xs font-semibold text-slate-300 tracking-wide">{label}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm font-bold text-white tracking-tight">
            {current} <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${colorStyles.badge}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Progress Track with Target Bracket */}
      <div className="relative w-full h-2 bg-forest-950 rounded-full overflow-hidden border border-forest-700/40">
        {/* Target Zone Guide Marker */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white/40 z-10"
          style={{ left: `${targetPercentage}%` }}
          title={`Optimal target: ${target} ${unit}`}
        />
        {/* Current Bar */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorStyles.bar} ${colorStyles.glow}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-1.5 text-[10px] font-mono text-slate-500">
        <span>0</span>
        <span className="text-slate-400">Target: {target} {unit}</span>
        <span>{Math.round(target * 1.5)}</span>
      </div>
    </div>
  );
}
