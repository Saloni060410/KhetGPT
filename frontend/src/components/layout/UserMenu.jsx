import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore.js'

export function Avatar({ name, size = 40, className = '' }) {
  const initials = String(name || 'F')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-full bg-primary-600 text-white font-semibold shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}

/** Signed-in user chip with a log out button. */
export default function UserMenu({ dark = false, compact = false }) {
  const { user, logout } = useUserStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar name={user?.name} size={compact ? 34 : 40} />
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className={`text-sm font-semibold truncate ${dark ? 'text-white' : 'text-ink-primary'}`}>{user?.name || 'Farmer'}</div>
          <div className={`text-xs ${dark ? 'text-ink-sidebar/70' : 'text-ink-muted'}`}>
            {user?.role === 'AGRONOMIST' ? 'Agronomist' : 'Farmer'}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Log out"
        title="Log out"
        className={`ml-auto min-h-touch min-w-touch inline-flex items-center justify-center rounded-full cursor-pointer transition-colors ${
          dark ? 'text-ink-sidebar hover:bg-white/10' : 'text-ink-muted hover:bg-black/5 hover:text-ink-primary'
        }`}
      >
        <LogOut className="w-[18px] h-[18px]" aria-hidden="true" />
      </button>
    </div>
  )
}
