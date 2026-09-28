import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { useUserStore } from '../../store/useUserStore.js'
import { useT } from '../../i18n/useT.js'
import LanguageToggle from '../ui/LanguageToggle.jsx'
import { WheatIcon } from '../icons/CropIcons.jsx'
import {
  HomeIcon,
  DashboardIcon,
  FieldProfileIcon,
  SoilTestIcon,
  PrescriptionIcon,
  ScheduleIcon,
  HistoryIcon,
} from '../icons/NavIcons.jsx'

export default function Navbar() {
  const { isHindi } = useT()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useUserStore()

  // Field id "1" never exists in the real database (real ids are UUIDs) -- every field-scoped
  // nav item used to hardcode it, so following them 404'd fetchField/fetchRecommendations
  // silently (Recommendation.jsx's catch swallows the error) and the page fell back to fully
  // static demo content with no visible error, looking like "the model isn't wired up" when the
  // actual bug was here: the link never pointed at a real field. Use the CURRENT route's own
  // :fieldId when we're already on a field-scoped page (so sibling tabs stay on that same real
  // field); otherwise there's no field to link to yet, so send these to /dashboard, where a
  // real one can be picked or registered, rather than guessing an id that's guaranteed to be
  // wrong.
  const { fieldId } = useParams()
  const fieldPath = (suffix) => (fieldId ? `/fields/${fieldId}${suffix}` : '/dashboard')

  // `id` is the React key -- NOT `to`, since without a real fieldId every field-scoped item
  // below now resolves to the same '/dashboard' path (see fieldPath above). Keying on `to`
  // gave five nav items the identical key whenever there was no fieldId (e.g. on the public
  // HomePage), which made React's reconciliation drop/misattribute their click handlers --
  // the whole navbar looked broken there, not just mis-routed. A real bug, caught by actually
  // loading the homepage after the fieldPath fix, not assumed safe.
  const navItems = [
    { id: 'home', to: '/', label: isHindi ? 'होम' : 'Home', icon: HomeIcon, exact: true },
    { id: 'ledger', to: '/dashboard', label: isHindi ? 'लेजर' : 'Ledger', icon: DashboardIcon },
    { id: 'fields', to: fieldPath(''), label: isHindi ? 'खेत' : 'Fields', icon: FieldProfileIcon },
    { id: 'soil', to: fieldPath('/soil'), label: isHindi ? 'मृदा परीक्षण' : 'Soil Test', icon: SoilTestIcon },
    { id: 'recommendation', to: fieldPath('/recommendation'), label: isHindi ? 'सिफारिश' : 'Prescription', icon: PrescriptionIcon },
    { id: 'schedule', to: fieldPath('/schedule'), label: isHindi ? 'अनुसूची' : 'Schedule', icon: ScheduleIcon },
    { id: 'history', to: fieldPath('/history'), label: isHindi ? 'इतिहास' : 'History', icon: HistoryIcon },
  ]

  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    setIsDrawerOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="sticky top-4 z-40 px-3 sm:px-6 max-w-6xl mx-auto w-full">
      <header className="bg-[#1C1B18]/95 backdrop-blur-md text-[#FAF8F5] rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-lg border border-[#3E382E]">
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          
          {/* Brand Mark with DM Serif Display */}
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5430] shrink-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2D5430] text-[#FAF8F5] flex items-center justify-center shadow-xs">
              <WheatIcon size={22} accentColor="#FAF8F5" inkColor="#1C1B18" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-xl sm:text-2xl tracking-tight text-[#FAF8F5]">
                Khet<span className="text-[#B8791E]">GPT</span>
              </span>
              <span className="text-[10px] font-sans text-[#A89F91] hidden 2xl:inline uppercase tracking-wider">
                {isHindi ? 'उर्वरक अनुकूलक' : 'ਪੰਜਾਬ ਖੇਤੀ'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Bespoke Agricultural Icons */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-xs font-sans font-medium min-w-0">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `
                  px-2 py-1.5 xl:px-2.5 xl:py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer text-[11px] xl:text-xs
                  ${
                    isActive
                      ? 'bg-[#2D5430] text-[#FAF8F5] font-semibold shadow-xs'
                      : 'text-[#C5BBAA] hover:text-[#FAF8F5] hover:bg-white/10'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={14}
                      className={isActive ? 'text-[#FAF8F5]' : 'text-[#8C8474] group-hover:text-white'}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right Controls (Language + User Profile + Logout) */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageToggle dark={true} />

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#3E382E] shrink-0">
                <div className="text-right leading-tight max-w-[85px] sm:max-w-[100px] xl:max-w-[120px]">
                  <div 
                    className="text-xs font-semibold text-[#FAF8F5] truncate"
                    title={user?.name || 'Ramesh Patel'}
                  >
                    {user?.name || 'Ramesh Patel'}
                  </div>
                  <div className="text-[10px] text-[#B8791E] font-medium uppercase tracking-wider">
                    {isHindi ? 'किसान' : 'Farmer'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 sm:p-1.5 rounded-lg text-[#C5BBAA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  title={isHindi ? 'लॉग आउट' : 'Log out'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#3E382E] shrink-0">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#2D5430] hover:bg-[#234226] rounded-lg transition-all shadow-xs"
                >
                  {isHindi ? 'लॉग इन' : 'Sign in'}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Controls (Language + Hamburger) */}
          <div className="flex items-center lg:hidden gap-2 shrink-0">
            <LanguageToggle dark={true} />
            <button
              type="button"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-2 rounded-lg text-[#C5BBAA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown */}
        {isDrawerOpen && (
          <div className="lg:hidden border-t border-[#3E382E] mt-3 pt-3 space-y-1 font-sans animate-in fade-in duration-150">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `
                  flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg whitespace-nowrap transition-colors
                  ${
                    isActive
                      ? 'bg-[#2D5430] text-[#FAF8F5] font-semibold shadow-xs'
                      : 'text-[#C5BBAA] hover:text-white hover:bg-white/10'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={16}
                      className={isActive ? 'text-[#FAF8F5]' : 'text-[#8C8474]'}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Mobile Auth Bar */}
            <div className="pt-2 mt-2 border-t border-[#3E382E] flex items-center justify-between px-3">
              {isAuthenticated ? (
                <>
                  <div>
                    <div className="text-xs font-semibold text-[#FAF8F5]">{user?.name || 'Ramesh Patel'}</div>
                    <div className="text-[10px] text-[#B8791E] font-medium uppercase tracking-wider">
                      {isHindi ? 'किसान' : 'Farmer'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-[#FAF8F5] hover:bg-white/20 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'लॉग आउट' : 'Log out'}</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="w-full text-center py-2 rounded-lg bg-[#2D5430] text-xs font-medium text-white"
                >
                  {isHindi ? 'लॉग इन' : 'Sign in'}
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  )
}
