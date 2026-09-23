import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Video, TrendingUp, ShoppingBag, Menu } from 'lucide-react'

interface BottomNavProps {
  onOpenMenu: () => void
}

export default function BottomNav({ onOpenMenu }: BottomNavProps) {
  const navItems = [
    { to: '/', label: 'Home', icon: LayoutDashboard, exact: true },
    { to: '/cctv', label: 'CCTV AI', icon: Video, badge: 'Live' },
    { to: '/mandi-live', label: 'Mandi', icon: TrendingUp },
    { to: '/marketplace', label: 'Trade', icon: ShoppingBag, badge: 'New' },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-orange-900/30 px-2 py-1.5 flex items-center justify-around safe-area-bottom"
      style={{ background: 'linear-gradient(to top, #1c0f06, #2d1408)', boxShadow: '0 -4px 20px -4px rgba(234,88,12,0.3)' }}
    >
      {navItems.map(({ to, label, icon: Icon, badge, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            `relative flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-orange-400 scale-105'
                : 'text-stone-400 hover:text-stone-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                {isActive && (
                  <div className="absolute inset-0 -m-1.5 rounded-xl bg-orange-500/20 blur-sm" />
                )}
                <Icon size={20} className={`stroke-[2.2] relative ${isActive ? 'text-orange-400' : ''}`} />
                {badge && (
                  <span className="absolute -top-1 -right-2.5 px-1 text-[9px] font-extrabold uppercase bg-red-500 text-white rounded-full animate-pulse leading-tight">
                    {badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${isActive ? 'text-orange-300' : ''}`}>{label}</span>
            </>
          )}
        </NavLink>
      ))}

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center py-1.5 px-3 rounded-xl text-stone-400 hover:text-stone-200 transition-all active:scale-95"
      >
        <Menu size={20} className="stroke-[2.2]" />
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">More</span>
      </button>
    </nav>
  )
}

