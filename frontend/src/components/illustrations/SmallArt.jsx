/** Shovel leaning on a burlap soil bag with a seedling: the "add a farm" card. */
export function AddFarmArt({ className = '' }) {
  return (
    <svg viewBox="0 0 200 180" role="img" aria-label="A shovel and a bag of soil with a seedling" className={className}>
      <circle cx="112" cy="84" r="66" fill="#d9ead0" />
      {/* soil mound */}
      <path d="M14 162 C 26 138 60 128 84 132 C 116 128 150 134 176 162Z" fill="#7a4d2b" />
      <path d="M30 162 C 44 144 70 138 90 142 C 116 140 142 146 160 162Z" fill="#94623a" />
      {/* bag */}
      <path d="M102 62 C 92 82 84 104 88 136 C 90 148 138 148 142 136 C 146 104 138 82 128 62Z" fill="#b98a56" />
      <path d="M100 66 C 106 74 124 74 130 66 L128 58 C 120 64 110 64 102 58Z" fill="#9a6d3e" />
      <path d="M98 60 C 104 56 126 56 132 60" stroke="#7a5430" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M100 76 L96 130 M118 72 L118 140 M134 76 L138 130" stroke="#a37641" strokeWidth="1.6" opacity=".7" />
      {/* seedling */}
      <path d="M116 60 V 40" stroke="#5f9440" strokeWidth="3" strokeLinecap="round" />
      <path d="M116 44 C 104 40 96 30 98 20 C 110 20 118 30 116 44Z" fill="#6fa844" />
      <path d="M116 42 C 128 38 138 28 136 16 C 122 16 114 28 116 42Z" fill="#82b83c" />
      {/* plus badge */}
      <circle cx="152" cy="132" r="22" fill="#f6ebd8" stroke="#b9a57f" strokeWidth="3" />
      <path d="M152 122 v20 M142 132 h20" stroke="#8a6f4d" strokeWidth="4" strokeLinecap="round" />
      {/* shovel */}
      <g transform="rotate(-18 44 96)">
        <rect x="40" y="26" width="8" height="70" rx="4" fill="#8a6a42" />
        <path d="M34 26 q10 -14 20 0 v6 h-20z" fill="#5d5049" />
        <path d="M30 96 h28 l-4 34 q-10 10 -20 0z" fill="#8d9aa3" />
        <path d="M34 100 h20" stroke="#c6cfd5" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/** Burlap bag of soil with a sprout and wheat coming up: the recommendation panel picture. */
export function SoilBagArt({ className = '' }) {
  return (
    <svg viewBox="0 0 220 180" role="img" aria-label="A bag of compost with wheat growing beside it" className={className}>
      <circle cx="110" cy="84" r="76" fill="#efe6c4" />
      <path d="M22 158 C 40 134 80 126 110 130 C 148 126 186 134 202 158Z" fill="#6c4224" />
      <path d="M40 158 C 58 142 88 136 112 140 C 140 138 170 144 186 158Z" fill="#8a5a34" />
      {/* bag */}
      <path d="M52 64 C 40 88 34 112 40 140 C 42 150 92 150 96 140 C 100 112 92 88 82 64Z" fill="#b98a56" />
      <path d="M50 68 C 58 76 76 76 84 68 L82 58 C 72 66 62 66 52 58Z" fill="#9a6d3e" />
      <path d="M48 62 C 56 56 78 56 86 62" stroke="#7a5430" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M68 66 V 56" stroke="#5f9440" strokeWidth="3" strokeLinecap="round" />
      <path d="M68 58 C 56 54 50 44 52 34 C 64 34 72 44 68 58Z" fill="#6fa844" />
      <path d="M68 56 C 80 52 88 42 86 30 C 72 30 66 42 68 56Z" fill="#82b83c" />
      <circle cx="68" cy="112" r="14" fill="#d9c08a" opacity=".7" />
      <path d="M64 112 c0 -6 8 -6 8 0 c0 6 -8 6 -8 0" fill="#6fa844" />
      {/* wheat */}
      {[[118, 0.7], [138, 0.9], [160, 1.05]].map(([x, s], i) => (
        <g key={x} transform={`translate(${x} 150) scale(${s})`}>
          <path d="M0 0 C 2 -30 -2 -60 0 -88" fill="none" stroke="#93a94a" strokeWidth="3" strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((j) => (
            <g key={j}>
              <ellipse cx="-4" cy={-92 - j * 8} rx="3.6" ry="6.4" transform={`rotate(-24 -4 ${-92 - j * 8})`} fill={j % 2 ? '#e3a534' : '#c9861f'} />
              <ellipse cx="4" cy={-96 - j * 8} rx="3.6" ry="6.4" transform={`rotate(24 4 ${-96 - j * 8})`} fill={j % 2 ? '#c9861f' : '#e3a534'} />
            </g>
          ))}
          <path d={`M0 -20 C ${i % 2 ? 22 : -22} -30 ${i % 2 ? 30 : -30} -50 ${i % 2 ? 26 : -26} -66`} fill="none" stroke="#6fa844" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  )
}

/** Person with a backpack sprayer, used on the foliar-spray step. */
export function SprayerArt({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="A farmer spraying crops" className={className}>
      <ellipse cx="60" cy="108" rx="52" ry="8" fill="#6c4224" opacity=".25" />
      <path d="M34 104 h6 l2 -22 h-8z M54 104 h6 l0 -22 h-8z" fill="#3f6b8a" />
      <path d="M32 82 C 32 58 50 52 64 54 C 78 54 88 66 86 82Z" fill="#c9a24a" />
      <circle cx="58" cy="40" r="12" fill="#e2b48a" />
      <path d="M44 36 C 46 22 72 22 74 36 C 66 32 52 32 44 36Z" fill="#d9b25a" />
      <path d="M38 34 h40" stroke="#b58c3a" strokeWidth="5" strokeLinecap="round" />
      <rect x="74" y="52" width="18" height="30" rx="5" fill="#3f8a4a" />
      <path d="M84 60 C 100 54 104 46 108 36" fill="none" stroke="#2d2a26" strokeWidth="3" strokeLinecap="round" />
      <path d="M106 36 l8 -4 M108 40 l10 0 M106 44 l8 5" stroke="#8ec3e2" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
