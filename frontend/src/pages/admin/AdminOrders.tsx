import { useState, useEffect, Fragment } from 'react';
import { Loader2, ChevronDown, ChevronUp, ShoppingBag, Clock, CheckCircle2, AlertCircle, Truck, PackageCheck } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/ui/Toast';
import type { Order } from '../../types';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders', {
        params: filter !== 'all' ? { status: filter } : {}
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [filter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/orders/${id}/status`, null, { params: { status } });
      showToast('Order status updated successfully', 'success');
      fetchOrders();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={11} /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Truck size={11} /> Shipped
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <PackageCheck size={11} /> Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle size={11} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock size={11} /> {status}
          </span>
        );
    }
  };

  const parseItems = (items: any) => {
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
      try {
        return JSON.parse(items);
      } catch {
        return [];
      }
    }
    return [];
  };

  const filters = ['all', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col h-64 items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest">Querying Orders Register...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShoppingBag size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Orders & Fulfillment Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review customer checkout history, shipping addresses, and update fulfillment states.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium uppercase tracking-wider transition-all cursor-pointer ${
                filter === f
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950'
                  : 'bg-[#1F2937] border border-[#243046] text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="rounded-2xl bg-[#111827] border border-[#1F2937] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1420] border-b border-[#1C2638] text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="px-5 py-4 font-semibold">Order ID</th>
                <th className="px-5 py-4 font-semibold">Created Date</th>
                <th className="px-5 py-4 font-semibold">Customer / Recipient</th>
                <th className="px-5 py-4 font-semibold text-right">Gross Total</th>
                <th className="px-5 py-4 font-semibold text-center">Fulfillment State</th>
                <th className="px-5 py-4 font-semibold text-center">Update State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2638]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-mono text-xs">
                    No orders matching status filter: <span className="text-emerald-400 uppercase font-bold">{filter}</span>.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <Fragment key={order.id}>
                    <tr 
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer" 
                      onClick={() => toggleExpand(order.id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 hover:text-white">
                            {expandedId === order.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {order.order_number || `#${order.id.toString().padStart(4, '0')}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-mono">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        }) : 'Recent'}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-white">{order.shipping_name || 'Customer'}</p>
                        <p className="text-[10px] font-mono text-slate-400">Account ID: {order.user_id}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-white text-sm">
                        ₹{(order.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          className="px-2.5 py-1.5 rounded-lg border border-[#1F2937] bg-[#0B0F17] text-xs font-mono font-semibold text-slate-200 outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                          value={order.status.toLowerCase()}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                    
                    {expandedId === order.id && (
                      <tr className="bg-[#0E1420]/80 border-b border-[#1C2638]">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#111827] border border-[#1F2937] shadow-inner text-xs">
                            <div>
                              <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <ShoppingBag size={13} className="text-emerald-400" /> Items in Package
                              </h4>
                              <div className="space-y-1.5">
                                {parseItems(order.items).map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between items-center py-1 border-b border-slate-800/80">
                                    <span className="text-slate-200">
                                      <span className="font-mono text-emerald-400 font-bold">{item.quantity}x</span> {item.name || item.product_name} 
                                      <span className="text-slate-400 text-[11px] ml-1">({item.size_label || 'Standard'})</span>
                                    </span>
                                    <span className="text-white font-mono font-semibold">
                                      ₹{((item.price || item.product_price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <Truck size={13} className="text-blue-400" /> Delivery Details
                              </h4>
                              <div className="space-y-1 text-slate-300">
                                <p><span className="text-slate-400 font-mono">Recipient Phone:</span> {order.shipping_phone || 'Not provided'}</p>
                                <p><span className="text-slate-400 font-mono">Destination:</span> {order.shipping_address || 'Standard Address'}</p>
                                {order.notes && (
                                  <div className="mt-2 p-2.5 rounded-lg bg-[#0B0F17] border border-[#1F2937] text-slate-300 italic">
                                    <span className="text-[10px] font-mono uppercase text-slate-400 not-italic block">Customer Instructions:</span>
                                    "{order.notes}"
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
