function Sprout({ x, y, s = 1, tone = '#5f9a3c' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V -14" stroke="#4d8032" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M0 -10 C -14 -12 -20 -22 -18 -30 C -6 -28 2 -20 0 -10Z" fill={tone} />
      <path d="M0 -12 C 12 -14 20 -24 18 -34 C 4 -32 -2 -22 0 -12Z" fill="#78ab4d" />
    </g>
  )
}

function BigLeaf({ d, vein, fill = '#4d8032', shade = '#3f6b2c' }) {
  return (
    <g>
      <path d={d} fill={fill} />
      <path d={vein} fill="none" stroke={shade} strokeWidth="3" strokeLinecap="round" opacity=".55" />
    </g>
  )
}

/** Login page art: glass greenhouse, barn, tractor, river, and a seed mascot waving. */
export default function GreenhouseScene({ className = '' }) {
  const rows = [0, 1, 2, 3, 4]
  return (
    <svg
      viewBox="0 0 620 660"
      role="img"
      aria-label="A greenhouse on a sunny farm with a friendly seedling character waving"
      className={className}
      preserveAspectRatio="xMidYMax meet"
    >
      <rect width="620" height="660" fill="#fbf1cc" />

      {/* sun with rays */}
      <g transform="translate(470 250)"><g className="animate-sun">
        <circle r="34" fill="#ffd45a" />
        {Array.from({ length: 16 }, (_, i) => (
          <line
            key={i}
            x1="0"
            y1="-46"
            x2="0"
            y2={i % 2 ? -58 : -64}
            stroke="#f2b830"
            strokeWidth="4"
            strokeLinecap="round"
            transform={`rotate(${i * 22.5})`}
          />
        ))}
      </g></g>

      {/* clouds */}
      <g fill="#ffffff" opacity=".95" className="animate-drift">
        <path d="M0 190 q-18 0 -14 -16 q10 -16 30 -8 q10 -20 36 -10 q26 -8 40 12 q22 4 16 22z" />
      </g>
      <path d="M520 226 q-14 0 -10 -12 q8 -12 22 -6 q8 -14 26 -8 q20 -4 28 12 q12 2 10 14z" fill="#ffffff" opacity=".9" />

      {/* hills */}
      <path d="M250 372 C 330 318 410 322 470 348 C 540 318 600 330 620 350 L620 470 L250 470Z" fill="#b9d288" />
      <path d="M300 390 C 380 350 440 360 500 384 C 560 360 600 372 620 384 L620 480 L300 480Z" fill="#9cc36a" />
      {/* trees */}
      <g>
        <rect x="422" y="352" width="6" height="26" fill="#7a5430" />
        <circle cx="425" cy="340" r="20" fill="#5f9a3c" />
        <circle cx="414" cy="348" r="14" fill="#78ab4d" />
        <rect x="538" y="356" width="6" height="24" fill="#7a5430" />
        <circle cx="541" cy="344" r="18" fill="#4d8032" />
      </g>

      {/* barn */}
      <g transform="translate(560 388)">
        <rect x="-40" y="-8" width="80" height="54" fill="#c8402c" />
        <path d="M-44 -6 L0 -40 L44 -6Z" fill="#a83323" />
        <rect x="-16" y="12" width="32" height="34" fill="#f6efe0" stroke="#7a2a1c" strokeWidth="2" />
        <path d="M-16 12 L16 46 M16 12 L-16 46" stroke="#c8402c" strokeWidth="3" />
      </g>

      {/* river */}
      <path d="M620 470 C 560 458 520 484 470 494 C 430 502 400 520 420 542 C 470 566 560 552 620 570Z" fill="#8cc6e8" />
      <path d="M470 510 C 520 498 570 506 610 520" fill="none" stroke="#d6ecf8" strokeWidth="3" strokeLinecap="round" opacity=".9" />
      <path d="M606 470 C 566 466 540 484 508 490" fill="none" stroke="#e8c88a" strokeWidth="6" strokeLinecap="round" opacity=".7" />

      {/* tractor, small */}
      <g transform="translate(496 458)"><g className="animate-rumble">
        <circle cx="26" cy="20" r="17" fill="#2b2522" />
        <circle cx="26" cy="20" r="9" fill="#c8462a" />
        <circle cx="-16" cy="26" r="11" fill="#2b2522" />
        <circle cx="-16" cy="26" r="5.4" fill="#c8462a" />
        <rect x="-26" y="2" width="42" height="16" rx="4" fill="#d9532f" />
        <rect x="8" y="-16" width="26" height="30" rx="3" fill="#d9532f" />
        <rect x="12" y="-12" width="18" height="16" fill="#bfe1e6" />
        <rect x="-20" y="-14" width="4" height="16" fill="#3a322d" />
      </g></g>

      {/* greenhouse */}
      <g>
        <path d="M40 412 L200 316 L360 404 L360 540 L40 540Z" fill="#e9f3ee" opacity=".92" />
        <path d="M40 412 L200 316 L360 404" fill="none" stroke="#7fa08a" strokeWidth="6" strokeLinejoin="round" />
        <path d="M40 412 L200 316 L360 404 L200 388Z" fill="#d6e8e1" opacity=".8" />
        {/* glass mullions */}
        {[80, 120, 160, 200, 240, 280, 320].map((x) => (
          <line key={x} x1={x} y1={x < 200 ? 412 - (x - 40) * 0.6 : 316 + (x - 200) * 0.55} x2={x} y2="540" stroke="#8fb09a" strokeWidth="2.4" opacity=".75" />
        ))}
        {[440, 470, 500].map((y) => (
          <line key={y} x1="40" y1={y} x2="360" y2={y} stroke="#8fb09a" strokeWidth="2" opacity=".55" />
        ))}
        <line x1="120" y1="364" x2="280" y2="364" stroke="#8fb09a" strokeWidth="2" opacity=".5" />
        <rect x="40" y="536" width="320" height="10" rx="3" fill="#8a6a42" />
        {/* plants inside */}
        {[70, 112, 154, 246, 288, 330].map((x, i) => (
          <g key={x}>
            <rect x={x - 14} y="496" width="28" height="32" rx="3" fill="#a87b48" />
            <path d="M0 0 V -22" transform={`translate(${x} 496)`} stroke="#4d8032" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx={x - 7} cy={478 - (i % 2) * 6} rx="9" ry="5" fill="#5f9a3c" transform={`rotate(-28 ${x - 7} ${478 - (i % 2) * 6})`} />
            <ellipse cx={x + 7} cy={470 - (i % 2) * 6} rx="9" ry="5" fill="#78ab4d" transform={`rotate(28 ${x + 7} ${470 - (i % 2) * 6})`} />
          </g>
        ))}
        {/* door */}
        <rect x="172" y="440" width="56" height="100" fill="#dcefe6" stroke="#7fa08a" strokeWidth="4" />
        <line x1="200" y1="440" x2="200" y2="540" stroke="#7fa08a" strokeWidth="3" />
        {/* hanging vine sprout at roof */}
        <Sprout x={200} y={352} s={1.3} />
      </g>

      {/* crop field */}
      <path d="M0 520 C 120 500 300 496 620 512 L620 660 L0 660Z" fill="#8a5a34" />
      {rows.map((i) => (
        <g key={i}>
          <path
            d={`M0 ${548 + i * 26} C 160 ${536 + i * 26} 420 ${534 + i * 26} 620 ${546 + i * 26}`}
            fill="none"
            stroke="#6c4224"
            strokeWidth="9"
            strokeLinecap="round"
            opacity=".55"
          />
          {Array.from({ length: 11 }, (_, j) => (
            <Sprout key={j} x={20 + j * 58 + (i % 2) * 24} y={556 + i * 26 - (j % 3)} s={0.8 + i * 0.09} />
          ))}
        </g>
      ))}
      <ellipse cx="120" cy="592" rx="24" ry="8" fill="#6c4224" opacity=".4" />

      {/* crates by the door */}
      <g>
        <rect x="120" y="536" width="52" height="34" rx="3" fill="#b9853f" />
        <path d="M120 548 h52 M120 560 h52" stroke="#8a6228" strokeWidth="2" />
        <Sprout x={134} y={536} />
        <Sprout x={158} y={536} s={1.1} />
      </g>

      {/* mascot */}
      <g transform="translate(316 512)"><g className="animate-bob">
        <ellipse cx="0" cy="112" rx="56" ry="10" fill="#5a3a20" opacity=".35" />
        {/* sprout */}
        <path d="M0 -70 V -98" stroke="#4d8032" strokeWidth="5" strokeLinecap="round" />
        <path d="M0 -92 C -24 -100 -46 -92 -60 -72 C -34 -62 -10 -72 0 -92Z" fill="#5f9a3c" />
        <path d="M0 -92 C 20 -108 46 -110 66 -94 C 46 -76 18 -78 0 -92Z" fill="#78ab4d" />
        <path d="M-2 -90 C -22 -86 -38 -78 -52 -72 M2 -92 C 22 -96 40 -98 58 -94" stroke="#3f6b2c" strokeWidth="2" fill="none" opacity=".5" />
        {/* body */}
        <path
          d="M0 -72 C 50 -72 62 -22 60 22 C 58 76 34 108 0 108 C -34 108 -58 76 -60 22 C -62 -22 -50 -72 0 -72Z"
          fill="#ecc57c"
          stroke="#c99a4b"
          strokeWidth="3"
        />
        <ellipse cx="-16" cy="-40" rx="14" ry="20" fill="#f6dc9f" opacity=".7" />
        <circle cx="-14" cy="16" r="2.4" fill="#c99a4b" opacity=".8" />
        <circle cx="26" cy="46" r="2.2" fill="#c99a4b" opacity=".8" />
        <circle cx="-30" cy="60" r="2.6" fill="#c99a4b" opacity=".8" />
        {/* face */}
        <ellipse cx="-20" cy="6" rx="6" ry="9" fill="#2b2522" />
        <ellipse cx="20" cy="6" rx="6" ry="9" fill="#2b2522" />
        <circle cx="-18" cy="2" r="2.4" fill="#fff" />
        <circle cx="22" cy="2" r="2.4" fill="#fff" />
        <circle cx="-36" cy="26" r="9" fill="#f29a8a" opacity=".75" />
        <circle cx="36" cy="26" r="9" fill="#f29a8a" opacity=".75" />
        <path d="M-12 28 Q0 42 12 28" fill="none" stroke="#2b2522" strokeWidth="3.4" strokeLinecap="round" />
        {/* arms */}
        <path d="M-58 30 C -78 26 -84 44 -72 54" fill="none" stroke="#c99a4b" strokeWidth="9" strokeLinecap="round" />
        <path d="M58 22 C 82 8 88 -12 80 -30" fill="none" stroke="#c99a4b" strokeWidth="9" strokeLinecap="round" />
        <path d="M58 22 C 82 8 88 -12 80 -30" fill="none" stroke="#ecc57c" strokeWidth="5" strokeLinecap="round" />
        {/* feet */}
        <ellipse cx="-24" cy="108" rx="18" ry="8" fill="#a8763a" />
        <ellipse cx="24" cy="108" rx="18" ry="8" fill="#a8763a" />
      </g></g>

      {/* foreground leaves */}
      <BigLeaf d="M0 660 L0 580 C 40 560 96 590 116 660Z" vein="M6 650 C 40 612 76 610 100 646" />
      <BigLeaf d="M-4 660 C 10 610 34 566 76 546 C 90 590 80 640 40 660Z" vein="M16 660 C 32 612 50 580 70 556" fill="#5f9a3c" shade="#3f6b2c" />
      <BigLeaf d="M620 660 L620 590 C 580 566 520 600 500 660Z" vein="M616 650 C 580 612 540 616 512 650" />
      <BigLeaf d="M624 660 C 610 612 586 574 548 556 C 532 600 544 644 584 660Z" vein="M604 660 C 588 616 572 590 552 566" fill="#5f9a3c" shade="#3f6b2c" />
    </svg>
  )
}
