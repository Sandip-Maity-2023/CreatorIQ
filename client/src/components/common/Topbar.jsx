import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { 
  FileSpreadsheet, 
  FileText, 
  LogOut, 
  ChevronDown, 
  CheckCircle2, 
  Radio, 
  Sun, 
  Moon,
  ShieldAlert,
  RotateCcw,
  UserCheck
} from 'lucide-react';

const Topbar = () => {
  const { user, logout, switchActiveRole, switchRoleDemo } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('creatoriq-theme') === 'light';
  });

  const loginRole = user?.loginRole || user?.role || 'Creator';
  const currentActiveRole = user?.role || loginRole;

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isLightMode]);

  const toggleTheme = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('light');
      localStorage.setItem('creatoriq-theme', 'light');
      showNotification('Switched to Light Mode');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('creatoriq-theme', 'dark');
      showNotification('Switched to Dark Mode');
    }
  };

  const availableRoles = [
    { role: 'Creator', label: 'Content Creator', desc: 'Personal Analytics & Integrations' },
    { role: 'Agency', label: 'Influencer Agency', desc: 'Multi-Creator Client Roster' },
    { role: 'Marketing Team', label: 'Marketing Team', desc: 'Brand ROI & Sponsorships' },
    { role: 'Administrator', label: 'Administrator', desc: 'Platform Governance & Multi-DB' }
  ];

  const handleExport = async (type) => {
    try {
      setExporting(true);
      const url = type === 'pdf' ? '/api/v1/reports/export-pdf' : '/api/v1/reports/export-csv';
      const res = await client.get(url, { responseType: 'blob' });
      
      const blob = new Blob([res.data], { type: type === 'pdf' ? 'application/pdf' : 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileName = type === 'pdf' 
        ? `CreatorIQ_Executive_Report_${new Date().toISOString().slice(0,10)}.pdf`
        : `CreatorIQ_Telemetry_Data_${new Date().toISOString().slice(0,10)}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showNotification(`Exported live data as ${type.toUpperCase()}`);
    } catch (e) {
      console.error("Export error", e);
      showNotification("Export generation failed");
    } finally {
      setExporting(false);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRoleSwitch = async (newRole) => {
    setRoleMenuOpen(false);
    await switchActiveRole(newRole);
    showNotification(`Active RBAC role switched to ${newRole}`);
  };

  const handleResetToLoginRole = async () => {
    setRoleMenuOpen(false);
    await switchActiveRole(loginRole);
    showNotification(`Reset back to your login role (${loginRole})`);
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#0d1322]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-8 ml-64">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-18 right-8 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow-xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          {notification}
        </div>
      )}

      {/* Left side: Persistent Login Role indicator & Live Status */}
      <div className="flex items-center gap-4">
        {/* Permanent "Logged in as" role display - NEVER vanishes */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-indigo-500/25 text-xs shadow-inner">
          <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold text-slate-400">Logged in as:</span>
          <span className="font-extrabold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
            {loginRole}
          </span>
        </div>

        {/* Live System Status indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>APIs Live: YouTube &bull; Instagram &bull; LinkedIn</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {/* Reports Download dropdown */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition-colors"
            title="Download Executive PDF"
          >
            <FileText className="h-3.5 w-3.5 text-rose-400" />
            <span>PDF Export</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition-colors"
            title="Download CSV Metrics"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>CSV Export</span>
          </button>
        </div>

        {/* Theme Switcher Toggle (Dark / Light) */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-all"
          title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {isLightMode ? (
            <>
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span>Light Mode</span>
            </>
          )}
        </button>

        {/* Dynamic RBAC Role Selector Menu */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              currentActiveRole !== loginRole
                ? 'bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-sm shadow-purple-500/20'
                : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Role: {currentActiveRole}</span>
            {currentActiveRole !== loginRole && (
              <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded-md font-bold">
                Active View
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#111827] border border-white/10 shadow-2xl p-2.5 z-50">
              <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active RBAC View
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Login: {loginRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Your login identity is preserved while exploring any role.
                </p>
              </div>

              <div className="space-y-1">
                {availableRoles.map((r) => {
                  const isCurrentActive = currentActiveRole === r.role;
                  const isInitialLoginRole = loginRole === r.role;

                  return (
                    <button
                      key={r.role}
                      onClick={() => handleRoleSwitch(r.role)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                        isCurrentActive 
                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' 
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{r.label}</span>
                          {isInitialLoginRole && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                              Login Role
                            </span>
                          )}
                        </div>
                        <span className={`block text-[10px] ${isCurrentActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {r.desc}
                        </span>
                      </div>
                      {isCurrentActive && <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />}
                    </button>
                  );
                })}
              </div>

              {/* Reset button if currently viewing a different role than login */}
              {currentActiveRole !== loginRole && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <button
                    onClick={handleResetToLoginRole}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors flex items-center gap-2 justify-center"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset View to Login Role ({loginRole})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Pill & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
          <img
            src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`}
            alt="Avatar"
            className="h-8 w-8 rounded-full border border-indigo-500/30 bg-slate-800"
          />
          <div className="hidden md:block text-left">
            <span className="block text-xs font-bold text-white leading-tight">{user?.full_name || 'Creator'}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>{user?.email}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-emerald-400 font-semibold">{loginRole}</span>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
