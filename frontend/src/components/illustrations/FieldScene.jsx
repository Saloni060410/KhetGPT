import { useMemo } from 'react'

// Deterministic pseudo-random so a scene looks identical on every render and on the server.
function rng(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const SCENES = {
  wheat: { sky: ['#bfe0ee', '#f6ecd0'], hill: ['#7fa1b6', '#9db8a6'], ground: '#d8a63a', sun: true },
  barley: { sky: ['#c7e2ec', '#f4ecd2'], hill: ['#86a5b5', '#a3bda6'], ground: '#cdb15a', sun: true },
  rice: { sky: ['#a9d3ea', '#f1f0d8'], hill: ['#5f8fa6', '#7fae94'], ground: '#5fa24a', sun: true },
  maize: { sky: ['#b8dceb', '#f8ecd0'], hill: ['#7d9fb1', '#93b79b'], ground: '#7fb04a', sun: true },
  cotton: { sky: ['#c2dfeb', '#f7efd8'], hill: ['#8aa9b8', '#a6bfa8'], ground: '#8fb05a', sun: true },
  sugarcane: { sky: ['#b4dcea', '#f3f0d2'], hill: ['#6f9bb0', '#88b596'], ground: '#5f9a3c', sun: true },
  chickpea: { sky: ['#c3e0ea', '#f6eed2'], hill: ['#87a6b6', '#a4bea5'], ground: '#a9b356', sun: true },
}

function Ear({ x, y, s = 1, tone = '#e3a534', dark = '#c9861f' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1="0" y1="0" x2="0" y2="34" stroke="#93a94a" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <ellipse cx="-3.2" cy={-i * 6.4} rx="3" ry="5.4" transform={`rotate(-24 -3.2 ${-i * 6.4})`} fill={i % 2 ? tone : dark} />
          <ellipse cx="3.2" cy={-i * 6.4 - 3} rx="3" ry="5.4" transform={`rotate(24 3.2 ${-i * 6.4 - 3})`} fill={i % 2 ? dark : tone} />
        </g>
      ))}
      <line x1="-3" y1="-12" x2="-8" y2="-32" stroke={tone} strokeWidth=".9" />
      <line x1="3" y1="-14" x2="8" y2="-34" stroke={tone} strokeWidth=".9" />
    </g>
  )
}

function Foreground({ crop, seed }) {
  const r = rng(seed)
  if (crop === 'wheat' || crop === 'barley') {
    const tone = crop === 'barley' ? '#d9c26b' : '#e3a534'
    const dark = crop === 'barley' ? '#bda247' : '#c9861f'
    const items = Array.from({ length: 46 }, () => ({
      x: 6 + r() * 388,
      y: 124 + r() * 86,
      s: 0.55 + r() * 0.5,
    })).sort((a, b) => a.y - b.y)
    return (
      <g>
        {items.map((it, i) => (
          <Ear key={i} x={it.x} y={it.y} s={it.s * (0.6 + (it.y - 124) / 120)} tone={tone} dark={dark} />
        ))}
      </g>
    )
  }
  if (crop === 'rice') {
    return (
      <g>
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M0 ${132 + i * 20} Q100 ${120 + i * 20} 200 ${134 + i * 20} T400 ${128 + i * 20} L400 ${150 + i * 20} Q300 ${158 + i * 20} 200 ${148 + i * 20} T0 ${154 + i * 20}Z`}
            fill={i % 2 ? '#4f9640' : '#6fb04e'}
          />
        ))}
        <path d="M-10 214 C 90 168 150 176 210 154 C 270 132 320 150 410 116 L410 134 C 320 170 270 152 214 178 C 156 200 100 196 -10 230Z" fill="#7cbcdf" />
        <path d="M60 206 C 120 182 170 184 214 168" fill="none" stroke="#c4e4f4" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        {Array.from({ length: 34 }, (_, i) => {
          const x = 8 + r() * 384
          const y = 134 + r() * 76
          return <path key={i} d={`M${x} ${y} q-3 -14 -9 -20 M${x} ${y} q2 -16 8 -24 M${x} ${y} q5 -10 12 -14`} stroke="#3f7f34" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        })}
      </g>
    )
  }
  if (crop === 'maize' || crop === 'sugarcane') {
    const n = crop === 'sugarcane' ? 44 : 30
    const h = crop === 'sugarcane' ? 78 : 62
    return (
      <g>
        {Array.from({ length: n }, () => ({ x: r() * 400, y: 140 + r() * 70, k: 0.7 + r() * 0.5 }))
          .sort((a, b) => a.y - b.y)
          .map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.k})`}>
              <line x1="0" y1="0" x2="0" y2={-h} stroke={crop === 'sugarcane' ? '#8bb84a' : '#5f9a3c'} strokeWidth={crop === 'sugarcane' ? 5 : 3.5} strokeLinecap="round" />
              <path d={`M0 ${-h * 0.5} q-18 -4 -24 -22 q16 4 24 22z`} fill="#4d8032" />
              <path d={`M0 ${-h * 0.62} q18 -4 24 -22 q-16 4 -24 22z`} fill="#6fa844" />
              {crop === 'maize' && <ellipse cx="0" cy={-h - 4} rx="4" ry="9" fill="#f2b830" />}
            </g>
          ))}
      </g>
    )
  }
  if (crop === 'cotton') {
    return (
      <g>
        {Array.from({ length: 22 }, () => ({ x: r() * 400, y: 140 + r() * 66, k: 0.7 + r() * 0.6 }))
          .sort((a, b) => a.y - b.y)
          .map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.k})`}>
              <ellipse cx="0" cy="-10" rx="22" ry="16" fill="#5f9a3c" />
              {[[-10, -14], [8, -16], [0, -6], [-2, -22], [14, -6]].map(([cx, cy], j) => (
                <circle key={j} cx={cx} cy={cy} r="5.2" fill="#fffdf6" stroke="#e7e1cd" strokeWidth="1" />
              ))}
            </g>
          ))}
      </g>
    )
  }
  return (
    <g>
      {Array.from({ length: 26 }, () => ({ x: r() * 400, y: 140 + r() * 66, k: 0.7 + r() * 0.6 }))
        .sort((a, b) => a.y - b.y)
        .map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.k})`}>
            <ellipse cx="0" cy="-10" rx="18" ry="13" fill="#7a9a3c" />
            <ellipse cx="-6" cy="-14" rx="6" ry="4" fill="#98b64e" />
            <circle cx="8" cy="-8" r="3.4" fill="#c9d58a" />
          </g>
        ))}
    </g>
  )
}

/** Wide landscape used as the photo on each farmland card. */
export default function FieldScene({ crop = 'wheat', className = '', seed = 7 }) {
  const scene = SCENES[crop] || SCENES.wheat
  const id = useMemo(() => `fs-${crop}-${seed}`, [crop, seed])
  return (
    <svg
      viewBox="0 0 400 220"
      role="img"
      aria-label={`${crop} field under a clear sky`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={scene.sky[0]} />
          <stop offset="1" stopColor={scene.sky[1]} />
        </linearGradient>
        <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={scene.ground} />
          <stop offset="1" stopColor={scene.ground} stopOpacity=".78" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${id}-sky)`} />
      {scene.sun && <circle cx="322" cy="46" r="20" fill="#ffe08a" opacity=".85" />}
      <g fill="#ffffff" opacity=".9">
        <path d="M40 52 q-12 0 -10 -10 q6 -10 18 -6 q6 -12 22 -6 q16 -6 24 8 q12 2 8 14z" />
        <path d="M210 34 q-9 0 -7 -8 q5 -8 14 -4 q5 -9 17 -4 q12 -4 18 6 q9 1 6 10z" opacity=".8" />
      </g>
      <path d="M0 126 L54 92 L98 116 L150 78 L206 118 L258 96 L316 122 L360 100 L400 118 L400 150 L0 150Z" fill={scene.hill[0]} opacity=".75" />
      <path d="M0 138 Q70 108 140 130 T290 126 T400 132 L400 160 L0 160Z" fill={scene.hill[1]} />
      <path d="M0 132 Q100 118 200 130 T400 126 L400 220 L0 220Z" fill={`url(#${id}-ground)`} />
      <Foreground crop={crop} seed={seed} />
    </svg>
  )
}
