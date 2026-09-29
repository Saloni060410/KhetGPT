const FURROW_OFFSETS = [-40, 0, 40, 80, 120, 160, 200, 240, 280]

function Wheel({ cx, cy, r, rim, spokes = 8 }) {
  const bolts = Array.from({ length: spokes }, (_, i) => {
    const a = (i / spokes) * Math.PI * 2
    return [Math.cos(a) * rim * 0.62, Math.sin(a) * rim * 0.62]
  })
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={r} fill="#2b2522" />
      <circle r={r - 4} fill="none" stroke="#1b1715" strokeWidth="7" strokeDasharray="7 6" />
      <circle r={rim + 6} fill="#3a322d" />
      <circle r={rim} fill="#c8462a" />
      <circle r={rim - 7} fill="#dd5d3a" />
      <g className="animate-spin-slow">
        <circle r={rim * 0.3} fill="#7a2e1b" />
        {bolts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={rim * 0.09} fill="#f0c8b4" />
        ))}
        <circle r={rim * 0.12} fill="#f0c8b4" />
      </g>
    </g>
  )
}

function Cloud({ x, y, scale = 1, opacity = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <path
        d="M10 46 Q-6 46 2 32 Q8 20 26 24 Q32 4 56 10 Q72 -2 90 12 Q114 10 114 30 Q128 34 118 46 Z"
        fill="#fffaf0"
      />
      <path d="M14 46 Q4 42 10 34 Q14 30 22 32" fill="none" stroke="#efe3cb" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

function Bush({ x, y, s = 1, dark = false }) {
  const a = dark ? '#3f6b2c' : '#5f9440'
  const b = dark ? '#4d7d34' : '#78ab4d'
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="0" r="30" fill={a} />
      <circle cx="34" cy="8" r="24" fill={b} />
      <circle cx="-32" cy="10" r="22" fill={b} />
      <circle cx="12" cy="-18" r="20" fill={b} opacity=".8" />
    </g>
  )
}

/**
 * Landing hero: a red tractor working a furrowed hillside under a big sun.
 * Pure SVG so it stays crisp at every size and costs no image request.
 */
export default function TractorScene({ className = '' }) {
  return (
    <svg
      viewBox="-160 0 880 540"
      role="img"
      aria-label="A red tractor ploughing a green hillside under a warm sun"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="tractor-fade-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.2" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id="tractor-fade" maskUnits="userSpaceOnUse" x="-160" y="0" width="880" height="540">
          <rect x="-160" y="0" width="880" height="540" fill="url(#tractor-fade-grad)" />
        </mask>
        <clipPath id="tractor-slope">
          <path d="M-160 456 C 20 448 200 424 390 346 C 520 292 620 240 720 196 L720 540 L-160 540 Z" />
        </clipPath>
        <linearGradient id="tractor-sky-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbe6a4" />
          <stop offset="1" stopColor="#fbe6a4" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g mask="url(#tractor-fade)">
      {/* sun */}
      <circle cx="340" cy="230" r="196" fill="url(#tractor-sky-glow)" opacity=".85" />
      <circle cx="340" cy="230" r="196" fill="#f9e2a0" opacity=".55" />
      <g className="animate-sun">
        <circle cx="352" cy="124" r="52" fill="#ffd45a" />
        <circle cx="352" cy="124" r="52" fill="none" stroke="#ffe08a" strokeWidth="6" opacity=".8" />
      </g>

      {/* clouds */}
      <g className="animate-drift">
        <Cloud x={70} y={130} scale={1.15} opacity={0.95} />
        <Cloud x={520} y={70} scale={1.3} />
      </g>
      <Cloud x={600} y={150} scale={0.8} opacity={0.9} />

      {/* far tree line */}
      <path d="M-160 410 C -40 400 20 390 80 372 C 150 380 150 380 220 360 C 300 338 330 352 400 330 L400 470 L-160 470Z" fill="#a5c26a" opacity=".65" />
      <Bush x={40} y={392} s={0.9} dark />
      <Bush x={112} y={376} s={0.7} />
      <Bush x={672} y={190} s={0.8} dark />

      {/* main hillside */}
      <path d="M-160 456 C 20 448 200 424 390 346 C 520 292 620 240 720 196 L720 540 L-160 540 Z" fill="#7ea94a" />
      <g clipPath="url(#tractor-slope)">
        {FURROW_OFFSETS.map((dy, i) => (
          <g key={dy} transform={`translate(0 ${dy})`}>
            <path
              d="M-40 470 C 190 450 400 372 760 214"
              fill="none"
              stroke={i % 2 ? '#6b9d3e' : '#8dba52'}
              strokeWidth="26"
              strokeLinecap="round"
            />
            <path
              d="M-40 486 C 190 466 400 388 760 230"
              fill="none"
              stroke="#8a4e2c"
              strokeWidth="7"
              strokeLinecap="round"
              opacity=".85"
            />
          </g>
        ))}
        {/* grass tufts */}
        {[
          [90, 500],
          [250, 470],
          [560, 470],
          [640, 380],
        ].map(([x, y]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y} l-5 -16 M${x} ${y} l0 -20 M${x} ${y} l5 -16`}
            stroke="#3f6b2c"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </g>

      {/* tractor */}
      <g transform="translate(400 312) rotate(-13) scale(1.12)">
        <ellipse cx="10" cy="106" rx="200" ry="14" fill="#2f5420" opacity=".35" />
        <g className="animate-rumble">
          {/* rear wheel sits behind the cab */}
          <Wheel cx={118} cy={38} r={72} rim={44} />
          {/* front axle + chassis */}
          <rect x="-118" y="16" width="240" height="26" rx="7" fill="#3a322d" />
          <rect x="-112" y="34" width="10" height="34" fill="#3a322d" />
          <Wheel cx={-96} cy={66} r={44} rim={27} spokes={6} />
          {/* hood */}
          <path
            d="M-138 -2 L-138 30 L14 30 L14 -20 Q14 -30 4 -30 L-110 -30 Q-138 -30 -138 -2 Z"
            fill="#d9532f"
          />
          <path d="M-138 -2 Q-138 -30 -110 -30 L4 -30 Q14 -30 14 -20 L14 -12 L-138 -12 Z" fill="#e9744a" />
          <path d="M-138 20 L14 20" stroke="#a83b1f" strokeWidth="3" />
          {/* grille */}
          <rect x="-142" y="-14" width="12" height="42" rx="3" fill="#efe2c8" />
          {[-8, -1, 6, 13, 20].map((y) => (
            <line key={y} x1="-142" y1={y} x2="-130" y2={y} stroke="#b8a680" strokeWidth="2" />
          ))}
          <circle cx="-138" cy="-22" r="7" fill="#ffd75e" stroke="#d99a22" strokeWidth="2" />
          {/* exhaust */}
          <rect x="-96" y="-78" width="9" height="50" fill="#3a322d" />
          <rect x="-100" y="-83" width="17" height="7" rx="3" fill="#26211e" />
          {/* cab */}
          <path d="M6 -108 L6 30 L112 30 L112 -108 Z" fill="#cfe7ea" opacity=".92" />
          <path d="M14 -100 L14 -8 L104 -8 L104 -100 Z" fill="#bfe1e6" />
          <path d="M22 -100 L52 -100 L22 -50 Z" fill="#ffffff" opacity=".35" />
          <path d="M62 -100 L104 -100 L104 -70 Z" fill="#ffffff" opacity=".22" />
          <line x1="59" y1="-100" x2="59" y2="-8" stroke="#d9532f" strokeWidth="5" />
          {/* steering wheel + seat */}
          <ellipse cx="40" cy="-34" rx="14" ry="5.5" fill="none" stroke="#3a322d" strokeWidth="3" transform="rotate(-24 40 -34)" />
          <line x1="40" y1="-32" x2="34" y2="-10" stroke="#3a322d" strokeWidth="3" />
          <rect x="72" y="-40" width="20" height="30" rx="5" fill="#5b4a3e" />
          {/* cab frame */}
          <path d="M6 -108 L6 30 M112 -108 L112 30" stroke="#d9532f" strokeWidth="8" strokeLinecap="round" />
          <rect x="-2" y="-122" width="122" height="16" rx="6" fill="#d9532f" />
          <rect x="-2" y="-122" width="122" height="6" rx="3" fill="#ee7a50" />
          <rect x="6" y="14" width="106" height="16" fill="#d9532f" />
          {/* fender */}
          <path
            d="M62 30 C 68 -30 172 -30 178 30 L164 30 C 158 -12 84 -12 78 30 Z"
            fill="#d9532f"
          />
          <path d="M62 30 C 68 -30 172 -30 178 30 L172 30 C 166 -20 74 -20 68 30 Z" fill="#ee7a50" opacity=".7" />
          {/* step */}
          <rect x="-8" y="44" width="30" height="7" rx="3" fill="#3a322d" />
        </g>
      </g>

      {/* foreground bushes */}
      <path
        d="M0 540 L0 470 Q30 440 66 458 Q92 432 128 452 Q168 446 186 486 L200 540Z"
        fill="#5f9440"
      />
      <path d="M0 540 L0 500 Q26 484 52 498 Q86 486 108 514 L120 540Z" fill="#3f6b2c" />
      <path
        d="M720 540 L720 396 Q690 380 664 402 Q640 388 616 412 Q590 410 578 444 Q560 460 566 490 L580 540Z"
        fill="#3f6b2c"
      />
      <path d="M720 540 L720 448 Q698 438 682 456 Q660 452 650 480 L648 540Z" fill="#2f5420" />
      </g>
    </svg>
  )
}
