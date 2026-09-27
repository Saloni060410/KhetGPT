import React from 'react';

export default function MetricCard({ 
  title, 
  value, 
  unit = '', 
  delta, 
  isPositive = true, 
  icon: Icon, 
  accent = 'emerald', 
  subtitle,
  sparklineData = [35, 42, 40, 55, 62, 58, 74, 82],
  statusTag
}) {
  const accentClasses = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      glow: 'hover:shadow-[0_0_25px_-5px_rgba(0,245,155,0.18)]',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      iconBg: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400',
      line: '#10B981',
      fill: 'rgba(16, 185, 129, 0.12)',
    },
    ochre: {
      border: 'border-amber-500/20 hover:border-amber-500/50',
      glow: 'hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.18)]',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      iconBg: 'bg-amber-950/60 border-amber-500/30 text-amber-400',
      line: '#F59E0B',
      fill: 'rgba(245, 158, 11, 0.12)',
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/50',
      glow: 'hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.18)]',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      iconBg: 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400',
      line: '#06B6D4',
      fill: 'rgba(6, 182, 212, 0.12)',
    }
  }[accent] || {
    border: 'border-emerald-500/20 hover:border-emerald-500/50',
    glow: 'hover:shadow-[0_0_25px_-5px_rgba(0,245,155,0.18)]',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    iconBg: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400',
    line: '#10B981',
    fill: 'rgba(16, 185, 129, 0.12)',
  };

  // Generate SVG path for sparkline
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const height = 36;
  const width = 100;
  const points = sparklineData.map((d, i) => {
    const x = (i / (sparklineData.length - 1)) * width;
    const y = height - ((d - minVal) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <div className={`glass-panel p-4 rounded-2xl transition-all duration-300 relative overflow-hidden group ${accentClasses.border} ${accentClasses.glow}`}>
      {/* Top subtle highlight line */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2.5">
          {Icon && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${accentClasses.iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</h4>
            {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {statusTag && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${accentClasses.badge}`}>
            {statusTag}
          </span>
        )}
      </div>

      {/* Main Metric Value & Sparkline */}
      <div className="flex items-end justify-between mt-3">
        <div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{value}</span>
            <span className="text-xs text-slate-400 font-mono">{unit}</span>
          </div>
          {delta && (
            <div className="flex items-center space-x-1 mt-1">
              <span className={`text-xs font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isPositive ? '↑' : '↓'} {delta}
              </span>
              <span className="text-[10px] text-slate-500">vs historical baseline</span>
            </div>
          )}
        </div>

        {/* Mini Sparkline Chart */}
        <div className="w-24 h-9">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <polygon points={areaPoints} fill={accentClasses.fill} />
            <polyline 
              fill="none" 
              stroke={accentClasses.line} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              points={points} 
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
