import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/map');
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
    setLoading(true);
    login(u, p)
      .then(() => navigate('/map'))
      .catch((err) => {
        setError(err.response?.data?.detail || 'Quick login failed.');
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-60" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-700 text-white mb-3 shadow-md">
            <Shield className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-wider">CRIMEMAP</h1>
          <p className="text-xs text-blue-700 font-semibold uppercase tracking-widest mt-0.5">
            Puducherry Police Department
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Geospatial Crime Intelligence, Analytics & Decision-Support System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Badge / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. officer_sharma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-md text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Secure Command Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins for Hackathon Judges */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] uppercase text-slate-500 font-semibold mb-2.5 text-center">
              One-Click Demonstration Logins
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'Admin@123')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-left transition-all"
              >
                <div className="text-[11px] font-bold text-purple-700">ADMIN</div>
                <div className="text-[10px] text-slate-500 truncate">Governance</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('officer_sharma', 'Officer@123')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-left transition-all"
              >
                <div className="text-[11px] font-bold text-blue-700">OFFICER</div>
                <div className="text-[10px] text-slate-500 truncate">Field Ops</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('analyst_priya', 'Analyst@123')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-left transition-all"
              >
                <div className="text-[11px] font-bold text-emerald-700">ANALYST</div>
                <div className="text-[10px] text-slate-500 truncate">ML & GIS</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="text-center mt-6 text-xs text-slate-500 font-medium">
          Puducherry Police Hackathon 2026 • Problem Statement 2
        </div>
      </div>
    </div>
  );
}
