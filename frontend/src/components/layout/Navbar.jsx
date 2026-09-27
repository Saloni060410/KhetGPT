import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Sprout,
  LayoutDashboard,
  FlaskConical,
  Sparkles,
  Calendar,
  History as HistoryIcon,
  LogOut,
  LogIn,
  Layers,
} from 'lucide-react'
import { useUserStore } from '../../store/useUserStore.js'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, protected: true },
  { to: '/fields/1', label: 'Field Profile', icon: Sprout, protected: true },
  { to: '/fields/1/soil', label: 'Soil Test', icon: FlaskConical, protected: true },
  { to: '/fields/1/recommendation', label: 'Recommendation', icon: Sparkles, protected: true },
  { to: '/fields/1/schedule', label: 'Schedule', icon: Calendar, protected: true },
  { to: '/fields/1/history', label: 'History', icon: HistoryIcon, protected: true },
  { to: '/kit', label: 'Component Kit', icon: Layers, protected: false },
]

export default function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const drawerRef = useRef(null)
  const menuButtonRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const { user, isAuthenticated, logout } = useUserStore()

  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    setIsDrawerOpen(false)
  }

  // Scroll lock and Escape listener when drawer is open
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)

      // Focus trap within drawer
      const focusableElements = drawerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDrawerOpen])

  // Focus trap Tab handling
  const handleDrawerKeyDown = (e) => {
    if (e.key !== 'Tab') return
    const focusable = drawerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable || focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-bg-surface/95 backdrop-blur-md border-b border-border-default shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Logo */}
            <Link
              to={isAuthenticated ? '/dashboard' : '/'}
              className="flex items-center gap-2 min-h-touch rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary-600 text-ink-inverse flex items-center justify-center shadow-xs shrink-0">
                <Sprout className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-ink-primary leading-none">
                  Khet<span className="text-primary-600">GPT</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold text-ink-muted uppercase tracking-wider mt-0.5 hidden xs:inline-block">
                  Fertilizer Optimizer
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-fast flex items-center gap-2
                    min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600
                    ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-ink-secondary hover:text-ink-primary hover:bg-bg-subtle'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Desktop Auth / User Controls */}
            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-bold text-ink-primary leading-none">
                      {user?.name || 'Farmer'}
                    </span>
                    <span className="text-xs text-primary-600 font-medium">
                      {user?.role || 'FARMER'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={LogOut}
                    onClick={handleLogout}
                    aria-label="Log out"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" leftIcon={LogIn}>
                      Log In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center lg:hidden shrink-0 ml-auto">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                aria-expanded={isDrawerOpen}
                aria-controls="mobile-navigation-drawer"
                aria-label={isDrawerOpen ? 'Close main menu' : 'Open main menu'}
                className="min-h-touch min-w-touch p-2 inline-flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"
              >
                {isDrawerOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Off-Canvas Drawer */}
      {isDrawerOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="fixed inset-0 z-50 lg:hidden flex justify-end"
          onKeyDown={handleDrawerKeyDown}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink-primary/50 backdrop-blur-xs transition-opacity duration-normal"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            ref={drawerRef}
            className="relative w-full max-w-xs bg-bg-surface h-full shadow-2xl flex flex-col justify-between p-5 border-l border-border-default animate-in slide-in-from-right duration-fast"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-600 text-ink-inverse flex items-center justify-center">
                    <Sprout className="w-4 h-4 stroke-[2.4]" />
                  </div>
                  <span className="font-bold text-lg text-ink-primary">KhetGPT</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close menu"
                  className="min-h-touch min-w-touch -mr-2 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink-primary hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card if Logged In */}
              {isAuthenticated && (
                <div className="p-3 bg-bg-subtle border border-border-subtle rounded-xl mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-ink-primary leading-tight">
                        {user?.name || 'Farmer'}
                      </p>
                      <p className="text-xs text-ink-secondary">{user?.email}</p>
                    </div>
                    <Badge variant="primary" size="sm">{user?.role || 'FARMER'}</Badge>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `
                      px-3.5 py-3 rounded-xl text-base font-medium transition-colors flex items-center gap-3
                      min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600
                      ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-bold'
                          : 'text-ink-secondary hover:text-ink-primary hover:bg-bg-subtle'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-border-subtle space-y-2">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  leftIcon={LogOut}
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" className="block w-full">
                    <Button variant="outline" className="w-full justify-center" leftIcon={LogIn}>
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" className="block w-full">
                    <Button variant="primary" className="w-full justify-center">
                      Create Account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
