import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Trash2, MessageSquare, Star, Clock } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/ui/Toast';

interface AdminReview {
  id: number;
  product_id: number;
  user_id: number;
  username: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const { showToast } = useToast();

  const fetchReviews = async () => {
    try {
      const params: Record<string, boolean> = {};
      if (filter === 'pending') params.approved = false;
      if (filter === 'approved') params.approved = true;
      
      const res = await api.get('/admin/reviews', { params });
      setReviews(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchReviews();
  }, [filter]);

  const toggleApproval = async (id: number, currentStatus: boolean) => {
    try {
      await api.put(`/admin/reviews/${id}/approve`, null, { 
        params: { is_approved: !currentStatus } 
      });
      showToast(`Review ${!currentStatus ? 'approved & published' : 'unapproved'}`, 'success');
      fetchReviews();
    } catch (err) {
      console.error(err);
      showToast('Failed to update review status', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      showToast('Review permanently deleted', 'success');
      fetchReviews();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete review', 'error');
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex flex-col h-64 items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest">Querying Feedback Register...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <MessageSquare size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Customer Review Moderation</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review, approve, or reject customer feedback before it appears publicly on product pages.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium uppercase tracking-wider transition-all cursor-pointer ${
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
                <th className="px-5 py-4 font-semibold">Reviewer</th>
                <th className="px-5 py-4 font-semibold">Product SKU</th>
                <th className="px-5 py-4 font-semibold text-center">Score</th>
                <th className="px-5 py-4 font-semibold w-2/5">Testimonial Content</th>
                <th className="px-5 py-4 font-semibold text-center">Moderation State</th>
                <th className="px-5 py-4 font-semibold text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2638]">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-mono text-xs">
                    No customer reviews matching filter: <span className="text-emerald-400 uppercase font-bold">{filter}</span>.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-white">{review.username}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        }) : 'Recent'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      SKU #{review.product_id}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold text-xs">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {review.rating}.0
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-slate-200 leading-relaxed line-clamp-2" title={review.comment}>
                        "{review.comment}"
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {review.is_approved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={11} /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => toggleApproval(review.id, review.is_approved)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            review.is_approved 
                              ? 'text-amber-400 hover:bg-amber-500/10' 
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={review.is_approved ? "Unpublish Review" : "Approve & Publish"}
                        >
                          {review.is_approved ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Permanently Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
