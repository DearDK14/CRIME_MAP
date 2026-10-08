import React, { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Shield,
  MapPin,
  Check,
  Filter
} from 'lucide-react';

export default function AlertsPage() {
  const { user, isAdmin, isOfficer } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const resp = await alertsAPI.getAll({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      });
      setAlerts(resp.data);
    } catch (err) {
      console.error("Alerts fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleAcknowledge = async (id, newStatus = 'ACKNOWLEDGED') => {
    try {
      await alertsAPI.acknowledge(id, { status: newStatus });
      fetchAlerts();
    } catch (err) {
      console.error("Acknowledge alert error:", err);
      alert("Failed to acknowledge alert.");
    }
  };

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-4rem)] bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-700" />
            <span>Intelligence Notification Engine</span>
          </h1>
          <p className="text-xs text-slate-500">
            Automated Tactical Alerts • Human Verification & Officer Acknowledgment
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE Alerts</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-sm"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
        </div>
      </div>

      {/* Alert Feed Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mr-2" />
            Polling Active Tactical Notifications...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
            No intelligence notifications currently matching the selected criteria.
          </div>
        ) : (
          alerts.map((al) => (
            <div
              key={al.id}
              className={`p-4 rounded-xl border transition-all ${
                al.status === 'ACTIVE'
                  ? 'bg-white border-l-4 border-l-red-600 border-slate-200 shadow-sm'
                  : al.status === 'ACKNOWLEDGED'
                  ? 'bg-white border-l-4 border-l-amber-500 border-slate-200 shadow-sm'
                  : 'bg-slate-50 border-l-4 border-l-emerald-600 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getSeverityStyle(al.severity)}`}>
                      {al.severity}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                      TYPE: {al.alert_type}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      • {new Date(al.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{al.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{al.description}</p>

                  {al.location_name && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{al.location_name}</span>
                    </div>
                  )}
                </div>

                {/* Actions & Status Pill */}
                <div className="flex flex-col sm:items-end justify-between space-y-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase self-start sm:self-auto ${
                      al.status === 'ACTIVE'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : al.status === 'ACKNOWLEDGED'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {al.status}
                  </span>

                  {(isAdmin || isOfficer) && al.status === 'ACTIVE' && (
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => handleAcknowledge(al.id, 'ACKNOWLEDGED')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md text-xs transition-colors shadow-sm"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleAcknowledge(al.id, 'RESOLVED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-xs transition-colors shadow-sm"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
