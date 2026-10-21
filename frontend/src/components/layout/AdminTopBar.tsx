import { useLocation, Link } from 'react-router-dom';
import { Menu, ExternalLink, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminTopBarProps {
  onOpenMobileMenu: () => void;
}

const routeTitles: Record<string, { category: string; title: string }> = {
  '/admin': { category: 'Telemetry & Insights', title: 'Executive Overview' },
  '/admin/products': { category: 'Store Operations', title: 'Product Catalog & Inventory' },
  '/admin/orders': { category: 'Store Operations', title: 'Orders & Fulfillment' },
  '/admin/users': { category: 'Governance & Access', title: 'User Management & Roles' },
  '/admin/reviews': { category: 'Governance & Trust', title: 'Customer Review Moderation' },
};

export default function AdminTopBar({ onOpenMobileMenu }: AdminTopBarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const currentMeta = routeTitles[location.pathname] || {
    category: 'Admin Console',
    title: 'Management View'
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#0E1420]/95 backdrop-blur-md border-b border-[#1C2638] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* ── Left: Hamburger & Dynamic Breadcrumbs ── */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span>Console</span>
            <span>/</span>
            <span className="text-slate-400 hidden sm:inline">{currentMeta.category}</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-emerald-400 font-medium">{currentMeta.title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-semibold text-white font-sans tracking-tight">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* ── Right: Telemetry Status, Store Link & User Actions ── */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live System Telemetry Chip */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111827] border border-[#1F2937] text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium">Backend v1.0: <span className="text-emerald-400">Online</span></span>
        </div>

        {/* View Storefront Shortcut */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all"
        >
          <ExternalLink size={13} />
          <span>Storefront</span>
        </Link>

        {/* Admin Profile Chip */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#1C2638]">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-white leading-tight">
                {user.full_name || user.username}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wide">
                👑 Super Admin
              </span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-emerald-950">
              {user.username.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
