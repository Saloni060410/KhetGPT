const PALETTE = {
  urea: { bag: '#f3efe3', band: '#6b9a3f', ink: '#3f6a22' },
  dap: { bag: '#dfeaf5', band: '#4e9bc9', ink: '#245e83' },
  mop: { bag: '#f7dcd3', band: '#c9683f', ink: '#a23d1d' },
  ssp: { bag: '#f1e6bf', band: '#d9962b', ink: '#8a5a0c' },
  default: { bag: '#efe1c8', band: '#8a5a34', ink: '#5a3a20' },
}

function paletteFor(id) {
  const key = String(id || '').toLowerCase()
  if (key.includes('urea')) return PALETTE.urea
  if (key.includes('dap') || key.includes('np_') || key.includes('npk')) return PALETTE.dap
  if (key.includes('mop') || key.includes('potash')) return PALETTE.mop
  if (key.includes('ssp')) return PALETTE.ssp
  return PALETTE.default
}

const shortName = (id) => {
  const key = String(id || '').toLowerCase()
  if (key.includes('urea')) return 'UREA'
  if (key.startsWith('np')) return 'NPK'
  return key.replace(/_.*/, '').slice(0, 4).toUpperCase()
}

/** A small fertilizer sack, tinted by product family, with its short name on the label. */
export default function ProductIcon({ type, className = '' }) {
  const p = paletteFor(type)
  return (
    <svg viewBox="0 0 64 72" role="img" aria-label={`${shortName(type)} sack`} className={className}>
      <path d="M14 14 C 8 26 6 44 10 62 C 11 67 53 67 54 62 C 58 44 56 26 50 14Z" fill={p.bag} stroke={p.band} strokeWidth="2" />
      <path d="M12 12 C 20 18 44 18 52 12 L50 6 C 42 10 22 10 14 6Z" fill={p.band} />
      <rect x="14" y="34" width="36" height="16" rx="3" fill={p.band} opacity=".92" />
      <text x="32" y="46" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="Poppins, sans-serif">{shortName(type)}</text>
      <path d="M22 24 h20" stroke={p.ink} strokeWidth="2" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}
