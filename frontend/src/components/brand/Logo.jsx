import { BRAND } from './brand.js'

/** Two green leaves cradling a golden ear of wheat. */
export function LogoMark({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={`${BRAND.name} logo`}
      className={className}
    >
      {/* wheat ear */}
      <path d="M24 6c1.6 2 1.6 4.2 0 6.2-1.6-2-1.6-4.2 0-6.2z" fill="#d9822b" />
      <path d="M24 12.5c1.6 2 1.6 4.2 0 6.2-1.6-2-1.6-4.2 0-6.2z" fill="#e0902f" />
      <path d="M24 19c1.6 2 1.6 4.2 0 6.2-1.6-2-1.6-4.2 0-6.2z" fill="#d9822b" />
      <path d="M20.6 10.4c2.4.3 3.6 1.9 3.4 4-2.4-.3-3.6-1.9-3.4-4zM27.4 10.4c-2.4.3-3.6 1.9-3.4 4 2.4-.3 3.6-1.9 3.4-4z" fill="#e0902f" />
      <path d="M20.6 17c2.4.3 3.6 1.9 3.4 4-2.4-.3-3.6-1.9-3.4-4zM27.4 17c-2.4.3-3.6 1.9-3.4 4 2.4-.3 3.6-1.9 3.4-4z" fill="#d9822b" />
      <path d="M24 24v9" stroke="#587a34" strokeWidth="2" strokeLinecap="round" />
      {/* leaves */}
      <path d="M24 40c-8.5.4-15.2-4.6-16-13.4 8.2-.6 15 3.6 16 13.4z" fill="#6b8e3f" />
      <path d="M24 40c8.5.4 15.2-4.6 16-13.4-8.2-.6-15 3.6-16 13.4z" fill="#587a34" />
      <path d="M24 40c-2.2-4.2-5.6-7.6-10.4-9.6M24 40c2.2-4.2 5.6-7.6 10.4-9.6" stroke="#dfeacb" strokeWidth="1.1" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}

/** Seedling on a soil mound, used on the dark sidebar. */
export function SproutMark({ size = 44, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={`${BRAND.name} logo`}
      className={className}
    >
      <path d="M8 40c2-7 9-10 16-10s14 3 16 10z" fill="#8a5a34" />
      <path d="M12 40c1.6-4 6-6.2 12-6.2S34.4 36 36 40z" fill="#a06b3d" />
      <path d="M24 30V20" stroke="#8fb45a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 21c-1-7-7-10-14-9.4.4 6.8 6 10.4 14 9.4z" fill="#7fa64a" />
      <path d="M24 19c1-6.4 6.6-9.6 13.6-9-.4 6.4-6 10-13.6 9z" fill="#a3c86a" />
    </svg>
  )
}

export default function Logo({ size = 36, variant = 'dark', className = '' }) {
  const text = variant === 'light' ? 'text-white' : 'text-ink-primary'
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className={`font-semibold tracking-tight leading-none ${text}`} style={{ fontSize: size * 0.62 }}>
        {BRAND.name}
      </span>
    </span>
  )
}
