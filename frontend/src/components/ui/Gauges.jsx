import { useId } from 'react'

const RAD = Math.PI / 180

function polar(cx, cy, r, deg) {
  return [cx + r * Math.cos(deg * RAD), cy + r * Math.sin(deg * RAD)]
}

/** SVG arc path between two angles (degrees, 0 = 3 o'clock, clockwise positive). */
function arcPath(cx, cy, r, startDeg, endDeg) {
  const [x1, y1] = polar(cx, cy, r, startDeg)
  const [x2, y2] = polar(cx, cy, r, endDeg)
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

const clamp01 = (v) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0))

/**
 * Half-dial with coloured bands and a needle (soil parameter dials, risk meter, eco-health meter).
 * value is 0..1 across the whole dial. Purely presentational: the caller decides what the
 * value means and passes a text alternative through `label`.
 */
export function DialGauge({
  value = 0.5,
  segments = [
    { to: 0.25, color: '#c9683f' },
    { to: 0.5, color: '#e0902f' },
    { to: 0.75, color: '#a9c36a' },
    { to: 1, color: '#587a34' },
  ],
  size = 120,
  thickness = 14,
  needleColor = '#26291a',
  label,
  children,
  className = '',
}) {
  const w = 120
  const h = 72
  const cx = 60
  const cy = 62
  const r = 46
  const gap = 1.4
  const arcs = segments.map((seg, i) => {
    const start = i === 0 ? 0 : segments[i - 1].to
    const from = 180 + start * 180 + (i === 0 ? 0 : gap)
    const to = 180 + seg.to * 180 - (i === segments.length - 1 ? 0 : gap)
    return { d: arcPath(cx, cy, r, from, to), color: seg.color, key: i }
  })
  const needleDeg = 180 + clamp01(value) * 180
  const [nx, ny] = polar(cx, cy, r - thickness / 2 - 4, needleDeg)

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={size}
        height={(size * h) / w}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className="block overflow-visible"
      >
        {arcs.map((a) => (
          <path
            key={a.key}
            d={a.d}
            stroke={a.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
            fill="none"
          />
        ))}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={needleColor}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5.4" fill={needleColor} />
        <circle cx={cx} cy={cy} r="1.8" fill="#f6ebd8" />
      </svg>
      {children}
    </div>
  )
}

/**
 * Open ring progress gauge (dashboard soil-health dial). Sweeps 240 degrees, gap at the bottom.
 */
export function RingGauge({
  value = 0,
  color = '#3f8f3a',
  track = '#e8e1d0',
  size = 108,
  stroke = 11,
  children,
  label,
  className = '',
}) {
  const id = useId()
  const cx = 60
  const cy = 60
  const r = 48
  const start = 150
  const sweep = 240
  const pct = clamp01(value)
  const trackD = arcPath(cx, cy, r, start, start + sweep)
  const arcLen = (sweep / 360) * 2 * Math.PI * r
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        <path d={trackD} stroke={track} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        <path
          id={id}
          d={trackD}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={arcLen}
          strokeDashoffset={arcLen * (1 - pct)}
          style={{ '--gauge-len': arcLen, animation: 'gaugeSweep 1s var(--ease-out) both' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}
