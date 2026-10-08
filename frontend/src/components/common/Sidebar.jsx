import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Compass,
  BarChart3,
  Flame,
  Activity,
  FileSpreadsheet,
  Building2,
  Bell,
  FileText,
  UploadCloud,
  Users,
  ShieldCheck,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: Home },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    { name: 'Incidents', to: '/incidents', icon: FileSpreadsheet },
    { name: 'Police Stations', to: '/stations', icon: Building2 },
    { name: 'Hotspots', to: '/hotspots', icon: Flame },
    { name: 'Reports', to: '/reports', icon: FileText },
    { name: 'Data Import', to: '/import', icon: UploadCloud },
    { name: 'Users', to: '/admin', icon: Users },
    { name: 'Audit Logs', to: '/admin', icon: ShieldCheck },
  ];

  return (
    <aside className="w-60 bg-[#070d1a] border-r border-[#1e293b] flex flex-col justify-between select-none shrink-0 h-[calc(100vh-4rem)] text-slate-300">
      <div className="p-3 space-y-1 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={`${item.to}-${idx}`}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#132c54] text-white font-semibold shadow-inner border border-blue-500/20'
                      : 'text-slate-400 hover:bg-[#0f1d38] hover:text-white'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Logout */}
      <div className="p-3 border-t border-[#1e293b] bg-[#050914]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
