import { useState, useEffect } from 'react';
import { Loader2, Search, Shield, ShieldOff, Users, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/ui/Toast';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  wallet_balance: number;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const msg = newRole === 'admin' 
      ? `Promote ${user.username} to privileged Administrator?` 
      : `Revoke administrator privileges for ${user.username}?`;
      
    if (!window.confirm(msg)) return;

    try {
      await api.put(`/admin/users/${user.id}/role`, null, { params: { role: newRole } });
      showToast(`User role updated to ${newRole}`, 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to update role', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest">Querying User Accounts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Customer Directory & Access Control</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect user registrations, email verification status, and elevate administrator privileges.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Filter by name, username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="rounded-2xl bg-[#111827] border border-[#1F2937] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1420] border-b border-[#1C2638] text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="px-5 py-4 font-semibold">Account Identifier</th>
                <th className="px-5 py-4 font-semibold">Full Legal Name</th>
                <th className="px-5 py-4 font-semibold text-center">Email Verification</th>
                <th className="px-5 py-4 font-semibold text-right">Wallet Balance</th>
                <th className="px-5 py-4 font-semibold text-center">Registration Date</th>
                <th className="px-5 py-4 font-semibold text-center">Role / Privilege Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2638]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-mono text-xs">
                    No registered accounts matching: "{search}".
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500/20 to-purple-600/30 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.username}</p>
                          <p className="text-[10px] font-mono text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-medium">
                      {u.full_name || <span className="text-slate-400 italic">Not set</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {u.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <XCircle size={11} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-white text-sm">
                      ₹{(u.wallet_balance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono text-slate-400 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      }) : 'Recent'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {u.role === 'admin' ? '👑 Admin' : 'User'}
                        </span>
                        <button
                          onClick={() => toggleRole(u)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            u.role === 'admin' 
                              ? 'text-rose-400 hover:bg-rose-500/10' 
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={u.role === 'admin' ? "Revoke Admin Role" : "Promote to Admin"}
                        >
                          {u.role === 'admin' ? <ShieldOff size={15} /> : <Shield size={15} />}
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
