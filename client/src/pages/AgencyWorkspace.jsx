import React, { useState, useEffect } from 'react';
import client from '../api/client';
import MetricCard from '../components/common/MetricCard';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  Award, 
  CheckCircle2,
  Plus,
  Trash2,
  X
} from 'lucide-react';

const AgencyWorkspace = () => {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [newClient, setNewClient] = useState({
    client_name: '',
    channel_handle: '',
    tier: 'Tier 1 - VIP',
    monthly_views: 1200000,
    monthly_revenue: 25000,
    commission_pct: 15,
    status: 'Active'
  });

  const fetchRoster = (showLoading = false) => {
    if (showLoading) setLoading(true);
    client.get('/api/v1/revenue/agency/roster')
      .then((res) => setRoster(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      await client.post('/api/v1/revenue/agency/roster', {
        ...newClient,
        monthly_views: parseInt(newClient.monthly_views) || 0,
        monthly_revenue: parseFloat(newClient.monthly_revenue) || 0,
        commission_pct: parseFloat(newClient.commission_pct) || 0
      });
      setModalOpen(false);
      setNewClient({
        client_name: '',
        channel_handle: '',
        tier: 'Tier 1 - VIP',
        monthly_views: 1200000,
        monthly_revenue: 25000,
        commission_pct: 15,
        status: 'Active'
      });
      setStatusMsg(`Added ${newClient.client_name} to agency roster!`);
      setTimeout(() => setStatusMsg(''), 4000);
      fetchRoster();
    } catch (err) {
      alert("Failed to add creator: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteClient = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from roster?`)) return;
    try {
      await client.delete(`/api/v1/revenue/agency/roster/${id}`);
      setStatusMsg(`Removed ${name} from roster.`);
      setTimeout(() => setStatusMsg(''), 4000);
      fetchRoster();
    } catch (err) {
      alert("Failed to remove creator: " + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const totalRosterRevenue = roster.reduce((acc, c) => acc + (c.monthly_revenue || 0), 0);
  const totalCommission = roster.reduce((acc, c) => acc + ((c.monthly_revenue || 0) * ((c.commission_pct || 0) / 100)), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {statusMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {statusMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-semibold mb-2 border border-pink-500/20">
            <Briefcase className="h-3.5 w-3.5" />
            Agency RBAC Workspace
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Influencer Agency Roster & Commissions</h1>
          <p className="text-xs text-slate-400 mt-1">Multi-creator client roster management, contract fees, and commission attribution</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-pink-500/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Creator to Roster
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          title="Total Managed Creator Roster"
          value={roster.length.toString()}
          change={`${roster.length} Signed Talent`}
          isPositive={true}
          icon={Users}
          color="indigo"
          subtitle="Signed exclusive talent"
        />
        <MetricCard
          title="Roster Gross Monthly Volume"
          value={`$${totalRosterRevenue.toLocaleString()}`}
          change="Real DB Sum"
          isPositive={true}
          icon={DollarSign}
          color="emerald"
          subtitle="Total brand spend & earnings"
        />
        <MetricCard
          title="Agency Monthly Commission"
          value={`$${Math.round(totalCommission).toLocaleString()}`}
          change="Calculated from cuts"
          isPositive={true}
          icon={Award}
          color="amber"
          subtitle="Net Agency Revenue"
        />
      </div>

      {/* Roster Table */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-base font-bold text-white tracking-tight">Managed Talent Roster</h3>
          <span className="text-xs text-slate-500">{roster.length} Signed Creators</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-4">Creator / Client</th>
                <th className="px-6 py-4">Primary Handle</th>
                <th className="px-6 py-4">Talent Tier</th>
                <th className="px-6 py-4 text-right">Monthly Reach (Views)</th>
                <th className="px-6 py-4 text-right">Monthly Billings</th>
                <th className="px-6 py-4 text-right">Agency Fee (%)</th>
                <th className="px-6 py-4 text-right">Agency Net</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {roster.map((c) => {
                const commissionVal = (c.monthly_revenue || 0) * ((c.commission_pct || 0) / 100);
                return (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.channel_handle}`}
                        alt="Avatar"
                        className="h-8 w-8 rounded-full bg-slate-800 border border-white/10"
                      />
                      <span>{c.client_name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-400">{c.channel_handle}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                        {c.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-white">
                      {(c.monthly_views || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${(c.monthly_revenue || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-400">
                      {c.commission_pct}%
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      ${Math.round(commissionVal).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteClient(c.id, c.client_name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove Creator"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Creator Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Creator to Roster</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Creator / Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={newClient.client_name}
                  onChange={(e) => setNewClient({ ...newClient, client_name: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Social Handle</label>
                <input
                  type="text"
                  required
                  placeholder="@alexrivera_tech"
                  value={newClient.channel_handle}
                  onChange={(e) => setNewClient({ ...newClient, channel_handle: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Talent Tier</label>
                  <select
                    value={newClient.tier}
                    onChange={(e) => setNewClient({ ...newClient, tier: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Tier 1 - VIP">Tier 1 - VIP</option>
                    <option value="Tier 2 - Growth">Tier 2 - Growth</option>
                    <option value="Emerging Talent">Emerging Talent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Agency Cut (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={newClient.commission_pct}
                    onChange={(e) => setNewClient({ ...newClient, commission_pct: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Est. Monthly Views</label>
                  <input
                    type="number"
                    required
                    value={newClient.monthly_views}
                    onChange={(e) => setNewClient({ ...newClient, monthly_views: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Billings ($)</label>
                  <input
                    type="number"
                    required
                    value={newClient.monthly_revenue}
                    onChange={(e) => setNewClient({ ...newClient, monthly_revenue: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30"
                >
                  Add Creator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyWorkspace;
