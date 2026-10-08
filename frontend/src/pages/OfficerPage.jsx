import React, { useState, useEffect } from 'react';
import { incidentsAPI, alertsAPI, stationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Compass,
  Bell,
  MapPin,
  Clock,
  Plus,
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function OfficerPage() {
  const { user } = useAuth();
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [stationInfo, setStationInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOfficerDesk = async () => {
      setLoading(true);
      try {
        const [incResp, alertResp, stResp] = await Promise.all([
          incidentsAPI.getAll({ page: 1, page_size: 6, sort_by: 'incident_date', order: 'desc' }),
          alertsAPI.getAll({ status: 'ACTIVE' }),
          stationsAPI.getAll(),
        ]);
        setRecentIncidents(incResp.data.items);
        setActiveAlerts(alertResp.data.slice(0, 4));
        if (stResp.data.length > 0) {
          setStationInfo(stResp.data[0]); // default station
        }
      } catch (err) {
        console.error("Officer desk error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadOfficerDesk();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] bg-[#f8fafc] text-slate-900">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-blue-700" />
            <span>Police Officer Tactical Field Desk</span>
          </h1>
          <p className="text-xs text-slate-500">
            Active Officer: <strong className="text-slate-800">{user?.username}</strong> • Station: {stationInfo?.name || 'Grand Bazaar PS'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/map"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Launch Tactical Map</span>
          </Link>
          <Link
            to="/incidents"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Case</span>
          </Link>
        </div>
      </div>

      {/* Grid: Station Info & High Priority Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Station Card */}
        {stationInfo && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4" />
              <span>Assigned Station Command Post</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{stationInfo.name}</div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>Code: <strong className="text-slate-900 font-mono">{stationInfo.station_code}</strong></div>
              <div>Sector: {stationInfo.jurisdiction_area}</div>
              <div>Tel: <span className="font-mono text-blue-700">{stationInfo.contact_number}</span></div>
              <div>Officer in Charge: {stationInfo.officer_in_charge}</div>
            </div>
          </div>
        )}

        {/* Priority Alerts Feed */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2 text-red-600 font-bold text-xs">
              <Bell className="w-4 h-4" />
              <span>Active Tactical Intelligence Alerts ({activeAlerts.length})</span>
            </div>
            <Link to="/alerts" className="text-xs font-semibold text-blue-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {activeAlerts.length === 0 ? (
              <div className="text-slate-500 text-xs py-4 text-center">
                No critical alerts requiring immediate tactical response.
              </div>
            ) : (
              activeAlerts.map((al) => (
                <div
                  key={al.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                        {al.severity}
                      </span>
                      <strong className="text-slate-900 text-xs">{al.title}</strong>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate max-w-md">{al.description}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(al.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Incidents in Jurisdiction */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <span>Recent Jurisdiction Incident Log</span>
          </h2>
          <Link to="/incidents" className="text-xs text-blue-700 hover:underline font-semibold">
            Full Records Directory
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentIncidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 font-mono text-[11px]">{inc.case_number}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold ${
                    inc.severity === 'Critical'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : inc.severity === 'High'
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : inc.severity === 'Medium'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {inc.severity}
                </span>
              </div>
              <div className="font-bold text-xs text-blue-700">{inc.crime_type?.name}</div>
              <div className="text-[10px] text-slate-600 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate">{inc.address || 'Puducherry'}</span>
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-200">
                <span className="font-mono">{inc.incident_date}</span>
                <span className="text-emerald-700 font-medium">{inc.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
