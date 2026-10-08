import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { alertsAPI } from '../../services/api';
import { Shield, Bell, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeAlertCount, setActiveAlertCount] = useState(3);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const resp = await alertsAPI.getAll({ status: 'ACTIVE' });
        setActiveAlertCount(resp.data?.length || 3);
      } catch (err) {
        console.error("Alert count fetch error:", err);
      }
    };
    fetchAlerts();
    const alertInterval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(alertInterval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'System Administrator';
      case 'police_officer':
        return 'Police Officer';
      case 'analyst':
        return 'Intelligence Analyst';
      default:
        return 'Police Officer';
    }
  };

  return (
    <header className="bg-[#0b1329] border-b border-[#1e293b] text-white h-16 flex items-center justify-between px-4 sm:px-6 z-30 select-none shrink-0">
      {/* Left: Branding */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Shield className="w-6 h-6 fill-white/20" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5 leading-none">
            <span className="font-black tracking-wider text-xl text-white font-sans">
              CRIME
            </span>
            <span className="font-black tracking-wider text-xl text-[#38bdf8] font-sans">
              MAP
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
            Map • Analyse • Predict • Prevent
          </p>
        </div>
      </div>

      {/* Center: Official Puducherry Police Emblem & Title */}
      <div className="hidden md:flex items-center space-x-3">
        {/* Gold Emblem Crest */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-400/40 flex items-center justify-center shadow-inner">
          <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#fbbf24" opacity="0.9" />
          </svg>
        </div>
        <div className="text-left">
          <h1 className="text-sm font-bold tracking-normal text-white font-sans">
            Puducherry Police
          </h1>
          <p className="text-[11px] text-slate-400 font-normal">
            Geospatial Crime Intelligence &amp; Decision Support System
          </p>
        </div>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center space-x-4">
        {/* Alerts Bell with Red Badge */}
        <Link
          to="/alerts"
          className="relative p-2 rounded-full hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
          title="Active Intelligence Alerts"
        >
          <Bell className="w-5 h-5 text-slate-300" />
          {activeAlertCount > 0 && (
            <span className="absolute 0 top-0.5 right-0.5 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#0b1329] shadow-sm">
              {activeAlertCount}
            </span>
          )}
        </Link>

        {/* Authenticated User Profile */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <div className="w-9 h-9 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-slate-200 shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-white leading-tight">
              {user?.username === 'admin' ? 'Inspector Kumar' : (user?.username || 'Inspector Kumar')}
            </div>
            <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
              {getRoleDisplayName(user?.role)}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-colors ml-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
