import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Radio, 
  ArrowRight, 
  Lock, 
  Mail, 
  User as UserIcon,
  Shield,
  Sparkles
} from 'lucide-react';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Creator');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await register(email, password, fullName, role);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || `${mode === 'signup' ? 'Registration' : 'Authentication'} failed. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoSelect = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setSubmitting(true);
    try {
      await login(demoEmail, 'password123');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed demo authentication');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-center items-center px-4 relative overflow-hidden py-12">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 items-center justify-center shadow-xl shadow-indigo-500/25 mb-3">
            <Radio className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Creator<span className="gradient-text">IQ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Next-Gen Creator Economy Intelligence & Social Orchestration
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/10 mb-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In with JWT
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account (Sign Up)
          </button>
        </div>

        {/* Login/Signup Glass Panel */}
        <div className="glass-panel p-8 shadow-2xl border border-white/10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name / Creator Handle
                </label>
                <div className="relative">
                  <UserIcon className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sandip Maity"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Account Email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@creatoriq.com"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Role (RBAC)
                </label>
                <div className="relative">
                  <Shield className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Creator">Content Creator (Personal Analytics & Integrations)</option>
                    <option value="Agency">Influencer Agency (Multi-Creator Client Roster)</option>
                    <option value="Marketing Team">Marketing Team (Brand ROI & Campaigns)</option>
                    <option value="Administrator">Administrator (Platform & System Governance)</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full mt-2 py-3 rounded-xl font-semibold text-sm shadow-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-pink-600/30'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30'
              }`}
            >
              {submitting ? (
                <span>Generating Secure JWT Token...</span>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Complete Registration & Get JWT' : 'Sign In with Secure JWT'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick RBAC Role Access */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                One-Click RBAC Test Logins
              </span>
              <span className="text-[10px] text-slate-500">Auto-injects JWT</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoSelect('creator@creatoriq.com')}
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors"
              >
                <span className="block text-xs font-bold text-indigo-400">Content Creator</span>
                <span className="block text-[10px] text-slate-500">Alex Rivera (Personal)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect('agency@creatoriq.com')}
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors"
              >
                <span className="block text-xs font-bold text-pink-400">Influencer Agency</span>
                <span className="block text-[10px] text-slate-500">Nexus Talent Roster</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect('marketing@creatoriq.com')}
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors"
              >
                <span className="block text-xs font-bold text-amber-400">Marketing Team</span>
                <span className="block text-[10px] text-slate-500">Apex Brand ROI</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect('admin@creatoriq.com')}
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors"
              >
                <span className="block text-xs font-bold text-emerald-400">Administrator</span>
                <span className="block text-[10px] text-slate-500">Full Governance</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
