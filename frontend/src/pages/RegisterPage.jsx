import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('police_officer');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        username,
        email,
        password,
        role,
        badge_number: badgeNumber || null,
      });
      navigate('/login');
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 relative select-none">
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-700 text-white mb-2 shadow-md">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Officer Account</h1>
          <p className="text-xs text-slate-500 mt-1">CRIMEMAP Access Provisioning</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Badge Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="officer_id"
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Official Police Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@police.py.gov.in"
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Badge Number (Optional)</label>
              <input
                type="text"
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                placeholder="PY-HQ-XXX"
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
              >
                <option value="police_officer">Police Officer (Field Command)</option>
                <option value="analyst">Crime Analyst (GIS & ML)</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-md text-xs transition-colors flex items-center justify-center space-x-2 mt-4 shadow-sm"
            >
              <span>{loading ? 'Creating Account...' : 'Register User'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs text-blue-700 hover:underline font-semibold">
              Already have credentials? Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
