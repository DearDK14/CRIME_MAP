import React, { useState, useEffect } from 'react';
import { usersAPI, auditAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Users,
  Shield,
  Activity,
  History,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uResp, aResp] = await Promise.all([
        usersAPI.getAll(),
        auditAPI.getAll({ limit: 40 }),
      ]);
      setUsers(uResp.data);
      setAuditLogs(aResp.data);
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole);
      fetchAdminData();
    } catch (err) {
      console.error("Update role error:", err);
      alert("Failed to update user role.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-rose-400 font-mono text-sm">
        Access Denied: Administrator role required.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-700" />
          <span>Administration & Governance Desk</span>
        </h1>
        <p className="text-xs text-slate-500">
          Role-Based Access Control • Tamper-Evident System Audit Trail • Security Operations
        </p>
      </div>

      {/* Grid: Users RBAC & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User Directory & Role Assignment */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-700" />
              <span>User Directory & Role Provisioning</span>
            </h2>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
              RBAC ACTIVE
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{u.username}</div>
                  <div className="text-[11px] text-slate-500">{u.email}</div>
                  {u.badge_number && (
                    <div className="text-[10px] text-slate-400 font-mono">Badge: {u.badge_number}</div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="police_officer">Police Officer</option>
                    <option value="analyst">Crime Analyst</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <History className="w-4 h-4 text-blue-700" />
              <span>Tamper-Evident Audit Logs</span>
            </h2>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
              COMPLIANCE
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto text-[11px]">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between space-x-3">
                <div>
                  <div className="text-slate-900 font-bold flex items-center space-x-1.5">
                    <span className="text-blue-700">{log.action}</span>
                    <span className="text-slate-500 font-mono text-[10px]">[{log.entity_type}]</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    User ID: {log.user_id || 'System'} • IP: {log.ip_address || '127.0.0.1'}
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
