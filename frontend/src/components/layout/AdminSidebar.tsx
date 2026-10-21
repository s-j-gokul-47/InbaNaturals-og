import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  MessageSquare, 
  LogOut, 
  ExternalLink,
  ShieldCheck,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navSections = [
  {
    heading: 'TELEMETRY & INSIGHTS',
    items: [
      { name: 'Executive Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    ]
  },
  {
    heading: 'STORE OPERATIONS',
    items: [
      { name: 'Products & Inventory', path: '/admin/products', icon: <Package size={18} /> },
      { name: 'Orders & Fulfillment', path: '/admin/orders', icon: <ShoppingBag size={18} /> },
    ]
  },
  {
    heading: 'GOVERNANCE & TRUST',
    items: [
      { name: 'User Management', path: '/admin/users', icon: <Users size={18} /> },
      { name: 'Customer Reviews', path: '/admin/reviews', icon: <MessageSquare size={18} /> },
    ]
  }
];

export default function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const { user, logout } = useAuth();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B0F17] text-slate-300 border-r border-[#1C2638] select-none">
      {/* ── Header Branding ── */}
      <div className="p-5 border-b border-[#1C2638] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-white tracking-tight">
                Inba<span className="text-emerald-400">Naturals</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400/90 font-semibold">
                Control Center
              </span>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {onMobileClose && (
          <button 
            onClick={onMobileClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ── Status Banner ── */}
      <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Session Privileges:</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <Sparkles size={10} /> Super Admin
        </span>
      </div>

      {/* ── Navigation Items ── */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <p className="px-3 text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase mb-2">
              {sec.heading}
            </p>
            <div className="space-y-1">
              {sec.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-300 border-l-3 border-emerald-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User & Exit Bar ── */}
      <div className="p-4 border-t border-[#1C2638] bg-[#0E1420]/80 space-y-3">
        <Link 
          to="/" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-emerald-300 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all"
        >
          <span className="flex items-center gap-2">
            <ExternalLink size={14} /> View Live Storefront
          </span>
          <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">↗</span>
        </Link>

        {user && (
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-white truncate">{user.full_name || user.username}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 z-30 hidden lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-[slideIn_0.2s_ease-out]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
