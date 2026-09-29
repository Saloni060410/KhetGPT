/**
 * Hand-built crop illustrations (portrait, 200 x 240, transparent background) for the crop cards,
 * field cards and coverage list. One per crop the reference data serves; unknown crops get a
 * seedling so a new crop never renders as an empty box.
 */

export const CROP_THEME = {
  wheat: { bg: '#f7e7bd', deep: '#d9962b', name: 'Golden Wheat', sci: 'Triticum aestivum' },
  barley: { bg: '#f1e6bf', deep: '#b48a2a', name: 'Barley', sci: 'Hordeum vulgare' },
  rice: { bg: '#cfe4f2', deep: '#3f7fa8', name: 'Rice', sci: 'Oryza sativa' },
  maize: { bg: '#f6d3a8', deep: '#dd7a2f', name: 'Maize', sci: 'Zea mays' },
  cotton: { bg: '#e6e9d6', deep: '#7c9a52', name: 'Cotton', sci: 'Gossypium hirsutum' },
  sugarcane: { bg: '#d9e8b8', deep: '#5f8f36', name: 'Sugarcane', sci: 'Saccharum officinarum' },
  chickpea: { bg: '#e8dcb4', deep: '#9a7a2c', name: 'Chickpea', sci: 'Cicer arietinum' },
}

export function cropTheme(crop) {
  return CROP_THEME[crop] || { bg: '#e2ebc9', deep: '#587a34', name: crop || 'Crop', sci: '' }
}

const leaf = (d, fill = '#6b9a3f') => <path d={d} fill={fill} />

function WheatEar({ len = 84, awns = true, grain = '#e3a534', grainDark = '#c9861f', awnColor = '#d9a441' }) {
  const count = Math.round(len / 10)
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const y = -i * 9.5
        const w = 1 - i * 0.045
        return (
          <g key={i}>
            <ellipse cx={-4.6 * w} cy={y} rx={4.4 * w} ry={8} transform={`rotate(-24 ${-4.6 * w} ${y})`} fill={i % 2 ? grain : grainDark} />
            <ellipse cx={4.6 * w} cy={y - 4} rx={4.4 * w} ry={8} transform={`rotate(24 ${4.6 * w} ${y - 4})`} fill={i % 2 ? grainDark : grain} />
            {awns && i > 1 && (
              <>
                <line x1={-6 * w} y1={y - 6} x2={-13 * w - i * 0.6} y2={y - 34} stroke={awnColor} strokeWidth="1.1" strokeLinecap="round" />
                <line x1={6 * w} y1={y - 10} x2={13 * w + i * 0.6} y2={y - 38} stroke={awnColor} strokeWidth="1.1" strokeLinecap="round" />
              </>
            )}
          </g>
        )
      })}
      <ellipse cx="0" cy={-count * 9.5 - 2} rx="4" ry="9" fill={grain} />
    </g>
  )
}

function Wheat({ barley = false }) {
  const angles = [-30, -15, 0, 15, 30]
  return (
    <g>
      {leaf('M100 232 C 60 200 30 170 22 132 C 56 150 88 186 100 232Z', '#5f9440')}
      {leaf('M100 232 C 140 204 172 170 180 128 C 146 148 112 186 100 232Z', '#78ab4d')}
      {angles.map((a, i) => (
        <g key={a} transform={`translate(100 234) rotate(${a})`}>
          <line x1="0" y1="0" x2="0" y2={-(128 + (i % 2) * 8)} stroke="#93a94a" strokeWidth="3" strokeLinecap="round" />
          <g transform={`translate(0 ${-(128 + (i % 2) * 8)})`}>
            <WheatEar
              len={barley ? 96 : 80}
              grain={barley ? '#d9c26b' : '#e3a534'}
              grainDark={barley ? '#bda247' : '#c9861f'}
              awnColor={barley ? '#c9b061' : '#d9a441'}
            />
          </g>
        </g>
      ))}
      {leaf('M100 236 C 96 208 84 190 64 176 C 78 204 88 224 100 236Z', '#4d8032')}
    </g>
  )
}

function Rice() {
  return (
    <g>
      <rect x="0" y="176" width="200" height="64" fill="#5aa0cc" />
      <path d="M0 176 Q50 168 100 176 T200 176 L200 186 Q150 194 100 186 T0 186Z" fill="#7cb9de" />
      <path d="M20 200 h34 M110 214 h44 M60 226 h30" stroke="#a8d3ec" strokeWidth="3" strokeLinecap="round" />
      {[-26, -8, 12, 30].map((a, i) => (
        <g key={a} transform={`translate(${86 + i * 10} 190) rotate(${a})`}>
          <path d="M0 0 C 2 -60 4 -100 30 -122" fill="none" stroke="#7aa347" strokeWidth="3" strokeLinecap="round" />
          {Array.from({ length: 11 }, (_, j) => {
            const t = j / 10
            const x = 30 - t * 6 + Math.sin(t * 3) * 6
            const y = -122 + t * 42
            return <ellipse key={j} cx={x + (j % 2 ? 4 : -4)} cy={y} rx="3.6" ry="6.4" fill={j % 3 ? '#e8b849' : '#d6a02f'} transform={`rotate(${j % 2 ? 20 : -20} ${x} ${y})`} />
          })}
        </g>
      ))}
      {leaf('M96 190 C 60 150 44 110 50 70 C 70 110 90 150 96 190Z', '#5f9440')}
      {leaf('M108 190 C 150 152 168 112 158 72 C 138 112 116 150 108 190Z', '#78ab4d')}
    </g>
  )
}

function Maize() {
  const cob = (x, y, s, rot) => (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M-14 40 C -34 -6 -22 -52 0 -64 C 22 -52 34 -6 14 40Z" fill="#f2b830" />
      {Array.from({ length: 7 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => (
          <circle key={`${r}-${c}`} cx={-11 + c * 7.4} cy={-48 + r * 12} r="2.9" fill={(r + c) % 2 ? '#ffd45a' : '#e6a21f'} />
        )),
      )}
      <path d="M-16 44 C -44 6 -38 -30 -22 -46 C -24 -6 -16 20 0 44Z" fill="#6b9a3f" />
      <path d="M16 44 C 44 6 38 -30 22 -46 C 24 -6 16 20 0 44Z" fill="#82b350" />
      <path d="M-4 46 C -14 22 -12 0 -4 -10 C 4 4 8 26 4 46Z" fill="#5b8c34" />
    </g>
  )
  return (
    <g>
      {leaf('M100 236 C 40 210 18 170 22 120 C 60 150 92 190 100 236Z', '#5f9440')}
      {leaf('M100 236 C 160 210 184 168 178 118 C 140 148 108 190 100 236Z', '#78ab4d')}
      {cob(52, 130, 0.9, -14)}
      {cob(148, 130, 0.9, 14)}
      {cob(100, 112, 1.08, 0)}
      <path d="M94 236 C 92 200 96 170 100 150 C 104 170 108 200 106 236Z" fill="#4d8032" />
    </g>
  )
}

function Cotton() {
  const boll = (x, y, s) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-22 12 L-14 34 L0 24 L14 34 L22 12 L0 18Z" fill="#7b5a34" />
      {[[-13, 2], [13, 2], [0, -8], [-6, -18], [8, -16], [0, 6]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 5 ? 12 : 13} fill="#fffdf6" stroke="#e7e1cd" strokeWidth="1.5" />
      ))}
    </g>
  )
  return (
    <g>
      <path d="M100 236 C 96 190 92 150 76 100 M100 236 C 106 190 112 150 128 96" fill="none" stroke="#6f8f45" strokeWidth="4" strokeLinecap="round" />
      {leaf('M92 190 C 56 188 32 168 30 140 C 62 142 86 160 92 190Z', '#5f9440')}
      {leaf('M108 180 C 148 178 172 156 170 128 C 138 132 114 150 108 180Z', '#78ab4d')}
      {boll(74, 96, 1)}
      {boll(130, 92, 1)}
      {boll(102, 138, 0.9)}
    </g>
  )
}

function Sugarcane() {
  const cane = (x, h, tilt, color) => (
    <g transform={`translate(${x} 236) rotate(${tilt})`}>
      <rect x="-8" y={-h} width="16" height={h} rx="5" fill={color} />
      {Array.from({ length: Math.floor(h / 34) }, (_, i) => (
        <g key={i}>
          <rect x="-9" y={-(i + 1) * 34} width="18" height="5" rx="2" fill="#4d6f28" />
          <path d={`M-8 ${-(i + 1) * 34 + 14} h16`} stroke="#ffffff" strokeWidth="1.2" opacity=".25" />
        </g>
      ))}
    </g>
  )
  return (
    <g>
      {cane(66, 150, -6, '#8bb84a')}
      {cane(134, 158, 6, '#7aa93f')}
      {cane(100, 176, 0, '#9cc656')}
      {leaf('M100 60 C 56 40 26 44 8 70 C 44 62 78 62 100 60Z', '#4d8032')}
      {leaf('M100 60 C 144 38 176 42 194 70 C 156 62 122 62 100 60Z', '#5f9440')}
      {leaf('M100 62 C 82 30 84 10 100 -2 C 116 12 118 32 100 62Z', '#78ab4d')}
      {leaf('M66 92 C 34 82 18 90 6 110 C 32 106 50 100 66 92Z', '#5f9440')}
      {leaf('M134 88 C 166 78 184 86 196 106 C 170 102 150 96 134 88Z', '#78ab4d')}
    </g>
  )
}

function Chickpea() {
  const pod = (x, y, rot) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M0 -14 C 16 -14 20 6 6 18 C -2 22 -14 12 -12 0 C -10 -8 -6 -14 0 -14Z" fill="#a5c452" stroke="#7fa03a" strokeWidth="1.5" />
      <circle cx="-1" cy="2" r="4" fill="#bfd875" />
    </g>
  )
  const stem = (d) => <path d={d} fill="none" stroke="#6f8f45" strokeWidth="3.2" strokeLinecap="round" />
  const leaflets = (x, y, rot) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[-30, -14, 2, 18, 34].map((dy, i) => (
        <g key={dy}>
          <ellipse cx={-9} cy={dy} rx="8" ry="4.6" fill={i % 2 ? '#5f9440' : '#78ab4d'} />
          <ellipse cx={9} cy={dy + 4} rx="8" ry="4.6" fill={i % 2 ? '#78ab4d' : '#5f9440'} />
        </g>
      ))}
    </g>
  )
  return (
    <g>
      {stem('M100 236 C 96 190 92 140 70 92')}
      {stem('M100 236 C 104 186 112 140 134 88')}
      {stem('M100 236 C 100 190 100 150 100 112')}
      {leaflets(74, 150, -8)}
      {leaflets(128, 146, 8)}
      {leaflets(100, 190, 0)}
      {pod(66, 88, -20)}
      {pod(140, 84, 20)}
      {pod(100, 104, 0)}
      {pod(84, 122, -12)}
    </g>
  )
}

function Seedling() {
  return (
    <g>
      <path d="M40 236 C 50 208 76 196 100 196 C 124 196 150 208 160 236Z" fill="#8a5a34" />
      <path d="M100 200 V 130" stroke="#6f8f45" strokeWidth="5" strokeLinecap="round" />
      {leaf('M100 140 C 90 100 56 84 24 92 C 30 128 62 148 100 140Z', '#5f9440')}
      {leaf('M100 124 C 108 84 140 66 176 74 C 172 112 140 132 100 124Z', '#78ab4d')}
    </g>
  )
}

const ART = {
  wheat: () => <Wheat />,
  barley: () => <Wheat barley />,
  rice: Rice,
  maize: Maize,
  cotton: Cotton,
  sugarcane: Sugarcane,
  chickpea: Chickpea,
}

export default function CropArt({ crop, className = '', title }) {
  const Art = ART[crop] || Seedling
  const label = title || `${cropTheme(crop).name} illustration`
  return (
    <svg viewBox="0 0 200 240" role="img" aria-label={label} className={className} preserveAspectRatio="xMidYMax meet">
      <Art />
    </svg>
  )
}
