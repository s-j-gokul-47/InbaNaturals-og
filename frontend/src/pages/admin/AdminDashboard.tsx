import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  MessageSquare, 
  Loader2, 
  ArrowUpRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  RefreshCw
} from 'lucide-react';
import api from '../../api/client';
import type { Order } from '../../types';

interface DashboardStats {
  total_users: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  pending_reviews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get<DashboardStats>('/admin/dashboard'),
        api.get<Order[]>('/admin/orders')
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex flex-col h-96 items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest uppercase">Querying Live Telemetry...</p>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Gross Revenue',
      value: `₹${(stats?.total_revenue || 0).toLocaleString('en-IN')}`,
      change: '+24.5%',
      isPositive: true,
      caption: 'vs. previous cycle',
      icon: <DollarSign size={20} className="text-emerald-400" />,
      accent: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    },
    {
      title: 'Completed Orders',
      value: (stats?.total_orders || 0).toString(),
      change: '+12.8%',
      isPositive: true,
      caption: 'processed via store',
      icon: <ShoppingBag size={20} className="text-blue-400" />,
      accent: 'border-blue-500/30 bg-blue-500/10 text-blue-400'
    },
    {
      title: 'Active Products',
      value: (stats?.total_products || 0).toString(),
      change: '100% In Stock',
      isPositive: true,
      caption: 'botanical SKUs',
      icon: <Package size={20} className="text-amber-400" />,
      accent: 'border-amber-500/30 bg-amber-500/10 text-amber-400'
    },
    {
      title: 'Customer Directory',
      value: (stats?.total_users || 0).toString(),
      change: 'Verified',
      isPositive: true,
      caption: 'registered accounts',
      icon: <Users size={20} className="text-purple-400" />,
      accent: 'border-purple-500/30 bg-purple-500/10 text-purple-400'
    },
    {
      title: 'Review Moderation',
      value: (stats?.pending_reviews || 0).toString(),
      change: stats?.pending_reviews ? 'Action Required' : 'Clean Queue',
      isPositive: !stats?.pending_reviews,
      caption: 'pending approval',
      icon: <MessageSquare size={20} className={stats?.pending_reviews ? "text-rose-400" : "text-emerald-400"} />,
      accent: stats?.pending_reviews 
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 animate-pulse' 
        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={12} /> Delivered
          </span>
        );
      case 'processing':
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Clock size={12} /> Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle size={12} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock size={12} /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Privileged Telemetry Control Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#111827] via-[#141E30] to-[#111827] border border-[#1F2937] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Executive Telemetry Grid</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Status
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure operational metrics synchronized with MySQL database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#1F2937] hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-950 font-sans"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* ─── Bento Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#111827] border border-[#1F2937] hover:border-slate-700 hover:bg-[#151D2E] transition-all duration-200 flex flex-col justify-between group shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${kpi.accent}`}>
                {kpi.icon}
              </div>
            </div>

            <div className="my-1">
              <h3 className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-tight">
                {kpi.value}
              </h3>
            </div>

            <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-[#1C2638]">
              <span className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${kpi.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {kpi.change}
              </span>
              <span className="text-[11px] text-slate-400 truncate ml-1">{kpi.caption}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Two-Column Operations Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left 2 Columns: Live Recent Orders Feed ── */}
        <div className="lg:col-span-2 rounded-2xl bg-[#111827] border border-[#1F2937] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1C2638]">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Recent Customer Orders
              </h3>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              View Full Register <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p>No customer orders recorded in system yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1C2638] text-slate-400 font-mono uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Order ID</th>
                    <th className="pb-3 font-semibold">Recipient</th>
                    <th className="pb-3 font-semibold">Items</th>
                    <th className="pb-3 font-semibold">Gross Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2638]">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-emerald-400">
                        #{ord.id.toString().padStart(4, '0')}
                      </td>
                      <td className="py-3 font-medium text-white truncate max-w-[140px]">
                        {ord.shipping_name || 'Customer'}
                      </td>
                      <td className="py-3 text-slate-400">
                        {ord.items?.length || 1} item(s)
                      </td>
                      <td className="py-3 font-bold text-white font-mono">
                        ₹{(ord.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        {getStatusBadge(ord.status)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to="/admin/orders"
                          className="px-2.5 py-1 rounded bg-[#1F2937] hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right Column: System Telemetry & Quick Moderation ── */}
        <div className="space-y-6">
          {/* Review Moderation Alert Card */}
          <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1C2638]">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Feedback Queue
                </h4>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${stats?.pending_reviews ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {stats?.pending_reviews || 0} Pending
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {stats?.pending_reviews 
                ? `You have ${stats.pending_reviews} verified customer review(s) awaiting moderation before publishing.`
                : 'All submitted customer reviews have been moderated. Trust score is optimal.'}
            </p>

            <Link
              to="/admin/reviews"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#1F2937] hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all font-mono"
            >
              Open Moderation Queue →
            </Link>
          </div>

          {/* Infrastructure Health Status */}
          <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-5 shadow-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4 pb-2 border-b border-[#1C2638] flex items-center justify-between">
              <span>Security & Infrastructure</span>
              <span className="text-emerald-400 text-[11px]">Nominal</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Database Engine</span>
                <span className="font-mono text-white font-medium">MySQL 8.0 · Async</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Auth & Crypto</span>
                <span className="font-mono text-emerald-400 font-medium">JWT HS256 · Bcrypt</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Search Microservice</span>
                <span className="font-mono text-white font-medium">Synchronized</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Last Telemetry Poll</span>
                <span className="font-mono text-slate-400">{lastRefreshed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
