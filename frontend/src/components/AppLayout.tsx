import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Sprout,
  Store,
  LineChart,
  IndianRupee,
  Lightbulb,
  Scale,
  CalendarRange,
  AlertTriangle,
  MapPinned,
  FlaskConical,
  Camera,
  Warehouse,
  Shield,
  LogOut,
  Menu,
  X,
  Video,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import BottomNav from './BottomNav'
import InstallPrompt from './InstallPrompt'
import LanguageSelector from './LanguageSelector'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/plant-health', label: 'Plant Health AI', icon: Camera },
  { to: '/cctv', label: 'CCTV Plant Monitor', icon: Video },
  { to: '/mandi-live', label: 'Live Mandi Rates', icon: TrendingUp },
  { to: '/marketplace', label: 'Direct Marketplace', icon: ShoppingBag },
  { to: '/farm', label: 'Farm Profile', icon: Warehouse },
  { to: '/crops', label: 'Crop Intelligence', icon: Sprout },
  { to: '/markets', label: 'Market Intelligence', icon: Store },
  { to: '/demand', label: 'Demand Forecast', icon: LineChart },
  { to: '/prices', label: 'Price Forecast', icon: IndianRupee },
  { to: '/recommendations', label: 'Crop Recommendation', icon: Lightbulb },
  { to: '/production', label: 'Production Estimation', icon: Sprout },
  { to: '/supply-demand', label: 'Supply-Demand', icon: Scale },
  { to: '/scheduler', label: 'Cultivation Scheduler', icon: CalendarRange },
  { to: '/risk', label: 'Risk Analysis', icon: AlertTriangle },
  { to: '/allocation', label: 'Market Allocation', icon: MapPinned },
  { to: '/what-if', label: 'What-If Simulation', icon: FlaskConical },
  { to: '/vision', label: 'Strawberry Detection', icon: Camera },
]


export default function AppLayout() {
  const { fullName, role, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 text-white transform transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} md:static md:flex md:flex-col shadow-sidebar`}
        style={{ background: 'linear-gradient(160deg, #ea580c 0%, #c2410c 55%, #9a3412 100%)' }}
      >
        {/* Brand */}
        <div className="p-5 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner">🌾</div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-orange-200 font-bold">Production Farm OS</div>
              <h1 className="text-base font-bold leading-tight">AgriSmart Enterprise</h1>
            </div>
          </div>
          <p className="text-xs text-orange-100/70 mt-3 leading-relaxed">Crop Planning · Market Arbitrage · CCTV Defense</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-orange-700 shadow-md shadow-black/10'
                    : 'text-orange-50/80 hover:bg-white/15 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
          {role === 'admin' && (
            <NavLink to="/admin" onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-white text-orange-700 shadow-md shadow-black/10' : 'text-orange-50/80 hover:bg-white/15 hover:text-white'}`}>
              <Shield size={17} /> Admin Panel
            </NavLink>
          )}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/15 bg-black/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-sm font-bold">
              {fullName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{fullName}</div>
              <div className="text-xs text-orange-200/80 capitalize">{role}</div>
            </div>
          </div>
          <button
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm py-1.5 transition-all"
            onClick={() => { logout(); navigate('/login') }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-stone-950/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-30 backdrop-blur-md border-b border-orange-100 px-4 py-2.5 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(255,248,242,0.96)', boxShadow: '0 1px 8px -2px rgba(234,88,12,0.10)' }}
        >
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-2 rounded-xl border border-orange-200 text-orange-700 hover:bg-orange-50 transition"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-black text-sm md:hidden shadow">
                🌾
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-stone-800 leading-tight">AgriSmart Mobile</div>
                <div className="text-[10px] text-orange-600 font-medium hidden sm:block">Crop Intelligence & Plant Defense</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <NavLink
              to="/cctv"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              CCTV Online
            </NavLink>
            <span className="text-[10px] text-orange-700 font-bold bg-orange-100 px-2.5 py-1 rounded-full border border-orange-200 hidden lg:inline">
              🟠 Live OS v2.0
            </span>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          <Outlet />
        </main>

        <BottomNav onOpenMenu={() => setOpen(true)} />
        <InstallPrompt />
      </div>
    </div>
  )
}
