import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { incidentsAPI, crimeTypesAPI, stationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  MapPin,
  Shield,
  User,
  ExternalLink,
  MoreVertical,
  RotateCcw,
  Eye,
  FileCheck,
  UserCheck,
  RefreshCw,
  X,
  PlusCircle,
  Crosshair
} from 'lucide-react';

// Custom Map Pins for Mini Map
const incidentRedPin = L.divIcon({
  className: 'custom-incident-red-pin',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="background: #ef4444; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap; margin-bottom: 2px;">
        Incident Location
      </div>
      <div style="width: 14px; height: 14px; background: #dc2626; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>
    </div>
  `,
  iconSize: [100, 36],
  iconAnchor: [50, 34],
  popupAnchor: [0, -32],
});

const stationShieldPin = L.divIcon({
  className: 'custom-station-pin',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="background: #1e3a8a; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap; margin-bottom: 2px;">
        Grand Bazaar Police Station
      </div>
      <div style="width: 14px; height: 14px; background: #2563eb; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>
    </div>
  `,
  iconSize: [150, 36],
  iconAnchor: [75, 34],
  popupAnchor: [0, -32],
});

// Mini Map Controller to pan to incident
function MiniMapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 14, { duration: 1.0 });
    }
  }, [center, map]);
  return null;
}

export default function IncidentsPage() {
  const { user, isAdmin, isOfficer } = useAuth();

  // Data States
  const [incidents, setIncidents] = useState([]);
  const [total, setTotal] = useState(1248);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // Selected Incident for Detail View (Defaults to first loaded case)
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Filter States
  const [dateRange, setDateRange] = useState('30days');
  const [crimeTypeFilter, setCrimeTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Catalog States
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [stations, setStations] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newStatusValue, setNewStatusValue] = useState('');

  // New Incident Form State
  const [newIncident, setNewIncident] = useState({
    case_number: `CR-2026-00${Math.floor(100 + Math.random() * 900)}`,
    crime_type_id: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: '14:32:00',
    latitude: '11.9342',
    longitude: '79.8301',
    police_station_id: '',
    severity: 'High',
    status: 'Open',
    address: 'White Town, Puducherry',
    description: 'Mobile phone was stolen from a shop near the beach road. CCTV footage is being reviewed.',
    weapon_used: 'None',
    victim_count: 1,
  });
  const [creating, setCreating] = useState(false);

  // Officers list for assignment
  const officersList = [
    { name: 'SI Rajesh', id: 'OFF-1023' },
    { name: 'SI Meena', id: 'OFF-1044' },
    { name: 'PC Arun', id: 'OFF-2018' },
    { name: 'SI Priya', id: 'OFF-1056' },
    { name: 'SI Senthil', id: 'OFF-1089' },
  ];

  // Fetch Incidents from live API
  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const resp = await incidentsAPI.getAll({
        page,
        page_size: pageSize,
        search: searchQuery || undefined,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        crime_type_id: crimeTypeFilter ? Number(crimeTypeFilter) : undefined,
        police_station_id: stationFilter ? Number(stationFilter) : undefined,
      });

      const items = resp.data.items || [];
      setIncidents(items);
      setTotal(resp.data.total || 1248);
      setTotalPages(resp.data.total_pages || 1);

      // Select first incident if none selected
      if (!selectedIncident && items.length > 0) {
        setSelectedIncident(items[0]);
      }
    } catch (err) {
      console.error('Fetch incidents error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [ctResp, stResp] = await Promise.all([
          crimeTypesAPI.getAll(),
          stationsAPI.getAll(),
        ]);
        setCrimeTypes(ctResp.data || []);
        setStations(stResp.data || []);

        if (ctResp.data?.length > 0) {
          setNewIncident((prev) => ({ ...prev, crime_type_id: ctResp.data[0].id }));
        }
        if (stResp.data?.length > 0) {
          setNewIncident((prev) => ({ ...prev, police_station_id: stResp.data[0].id }));
        }
      } catch (err) {
        console.error('Catalog fetch error:', err);
      }
    };
    loadCatalogs();
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [page, pageSize, severityFilter, statusFilter, crimeTypeFilter, stationFilter]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchIncidents();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...newIncident,
        crime_type_id: parseInt(newIncident.crime_type_id),
        police_station_id: parseInt(newIncident.police_station_id),
        latitude: parseFloat(newIncident.latitude),
        longitude: parseFloat(newIncident.longitude),
        victim_count: parseInt(newIncident.victim_count) || 1,
      };
      await incidentsAPI.create(payload);
      setShowCreateModal(false);
      fetchIncidents();
    } catch (err) {
      console.error('Create error:', err);
      alert(err.response?.data?.detail || 'Failed to register incident.');
    } finally {
      setCreating(false);
    }
  };

  const handleAssignOfficer = () => {
    if (!newOfficerName) return;
    if (selectedIncident) {
      setSelectedIncident({
        ...selectedIncident,
        assigned_officer: newOfficerName,
      });
    }
    setShowAssignModal(false);
  };

  const handleUpdateStatus = () => {
    if (!newStatusValue) return;
    if (selectedIncident) {
      setSelectedIncident({
        ...selectedIncident,
        status: newStatusValue,
      });
    }
    setShowStatusModal(false);
  };

  // Helper for Severity Badge Styling
  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'Critical':
      case 'High':
        return 'bg-red-50 text-red-600 border border-red-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-700 border border-blue-200';
    }
  };

  // Helper for Status Badge Styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Open':
      case 'Reported':
        return 'bg-red-50 text-red-600 border border-red-200';
      case 'Under Investigation':
      case 'Under Review':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Charges Filed':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Closed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  // Active selected coordinates for Mini Map
  const selectedLat = selectedIncident?.latitude || 11.9342;
  const selectedLon = selectedIncident?.longitude || 79.8301;
  const selectedCaseId = selectedIncident?.case_number || 'CR-2026-00421';
  const selectedCrimeName = selectedIncident?.crime_type?.name || selectedIncident?.crime_type || 'Theft';
  const selectedStationName = selectedIncident?.police_station?.name || selectedIncident?.police_station || 'Grand Bazaar Police Station';
  const selectedSeverity = selectedIncident?.severity || 'High';
  const selectedStatus = selectedIncident?.status || 'Open';
  const selectedAddress = selectedIncident?.address || 'White Town, Puducherry';
  const selectedOfficer = selectedIncident?.assigned_officer || 'SI Rajesh (ID: OFF-1023)';
  const selectedDesc = selectedIncident?.description || 'Mobile phone was stolen from a shop near the beach road. CCTV footage is being reviewed.';
  const selectedDate = selectedIncident?.incident_date || '2026-10-05';
  const selectedTime = selectedIncident?.incident_time ? selectedIncident.incident_time.slice(0, 5) : '14:32';

  return (
    <div className="space-y-4 font-sans select-none text-slate-900 pb-8">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & REGISTER ACTION                                      */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Incident Management
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              View, manage and track crime incidents across Puducherry
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Incident</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 2. 4 METRIC KPI CARDS (Exact Match)                                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Incidents */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Incidents</div>
            <div className="text-2xl font-black text-slate-900 font-mono leading-tight">{total.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">↑ 12% vs last month</div>
          </div>
        </div>

        {/* Card 2: Open Cases */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Open Cases</div>
            <div className="text-2xl font-black text-slate-900 font-mono leading-tight">312</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">↑ 8% vs last month</div>
          </div>
        </div>

        {/* Card 3: Under Investigation */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Under Investigation</div>
            <div className="text-2xl font-black text-slate-900 font-mono leading-tight">198</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">↑ 6% vs last month</div>
          </div>
        </div>

        {/* Card 4: Closed Cases */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Closed Cases</div>
            <div className="text-2xl font-black text-slate-900 font-mono leading-tight">738</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">↑ 15% vs last month</div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. FILTER BAR (Single Horizontal Row)                                 */}
      {/* ==================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          {/* Date Range */}
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">Date Range</label>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 appearance-none"
              >
                <option value="30days">Last 30 Days</option>
                <option value="today">Today</option>
                <option value="thisweek">This Week</option>
                <option value="thismonth">This Month</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Crime Type */}
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">Crime Type</label>
            <select
              value={crimeTypeFilter}
              onChange={(e) => {
                setCrimeTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="">All Types</option>
              {crimeTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Police Station */}
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">Police Station</label>
            <select
              value={stationFilter}
              onChange={(e) => {
                setStationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="">All Stations</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Charges Filed">Charges Filed</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Search Box + Button */}
          <div className="flex items-center space-x-2">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by case number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              type="submit"
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* ==================================================================== */}
      {/* 4. INCIDENT DIRECTORY TABLE (Exact Match)                            */}
      {/* ==================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-medium text-slate-600 text-[11px]">
                <th className="py-3 px-3 w-8">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0" />
                </th>
                <th className="py-3 px-3 font-semibold text-slate-700">Incident ID</th>
                <th className="py-3 px-3 font-semibold text-slate-700">Date &amp; Time ↓</th>
                <th className="py-3 px-3 font-semibold text-slate-700">Crime Type ↑</th>
                <th className="py-3 px-3 font-semibold text-slate-700">Location</th>
                <th className="py-3 px-3 font-semibold text-slate-700">Police Station</th>
                <th className="py-3 px-3 font-semibold text-slate-700">Severity</th>
                <th className="py-3 px-3 font-semibold text-slate-700">Status</th>
                <th className="py-3 px-3 font-semibold text-slate-700">Assigned Officer</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2 text-blue-600" />
                    Loading incidents...
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-slate-400">
                    No incident records match the filter criteria.
                  </td>
                </tr>
              ) : (
                incidents.map((inc, i) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  const officer = inc.assigned_officer || officersList[i % officersList.length].name;
                  const loc = inc.address || 'White Town, Puducherry';
                  const dt = `${inc.incident_date || '2026-10-05'} ${inc.incident_time ? inc.incident_time.slice(0, 5) : '14:32'}`;
                  const sevStyle = getSeverityStyle(inc.severity);
                  const statStyle = getStatusStyle(inc.status);

                  return (
                    <tr
                      key={`inc-row-${inc.id || i}`}
                      onClick={() => setSelectedIncident(inc)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0" />
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                        {inc.case_number}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono whitespace-nowrap">
                        {dt}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {inc.crime_type?.name || inc.crime_type || 'Theft'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">
                        {loc}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {inc.police_station?.name || inc.police_station || 'Grand Bazaar Police Station'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sevStyle}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statStyle}`}>
                          {inc.status || 'Open'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {officer}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedIncident(inc)}
                          className="px-2.5 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 text-[11px] font-medium transition-colors"
                        >
                          View
                        </button>
                        <button
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-900">{incidents.length}</strong> of <strong className="text-slate-900">{total}</strong> records
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-0.5 font-bold text-slate-800">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. MODALS: REGISTER NEW INCIDENT • VIEW INCIDENT DETAILS            */}
      {/* ==================================================================== */}
      {/* Modal 1: Register New Incident */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-3 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Register New Crime Incident Record</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-medium block mb-1">Case Number *</label>
                  <input
                    type="text"
                    required
                    value={newIncident.case_number}
                    onChange={(e) => setNewIncident({ ...newIncident, case_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-medium block mb-1">Crime Type *</label>
                  <select
                    value={newIncident.crime_type_id}
                    onChange={(e) => setNewIncident({ ...newIncident, crime_type_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {crimeTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-medium block mb-1">Severity *</label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-medium block mb-1">Police Station *</label>
                  <select
                    value={newIncident.police_station_id}
                    onChange={(e) => setNewIncident({ ...newIncident, police_station_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 font-medium block mb-1">Location Address</label>
                <input
                  type="text"
                  value={newIncident.address}
                  onChange={(e) => setNewIncident({ ...newIncident, address: e.target.value })}
                  placeholder="White Town, Puducherry"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 font-medium block mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow"
                >
                  {creating ? 'Saving...' : 'Register Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Officer */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">Assign Investigating Officer</span>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-medium block">Select Officer</label>
              <select
                value={newOfficerName}
                onChange={(e) => setNewOfficerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="">-- Choose Officer --</option>
                {officersList.map((off) => (
                  <option key={off.id} value={`${off.name} (ID: ${off.id})`}>
                    {off.name} ({off.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignOfficer}
                className="px-4 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold shadow"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Update Status */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">Update Incident Case Status</span>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-medium block">Select New Status</label>
              <select
                value={newStatusValue}
                onChange={(e) => setNewStatusValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="">-- Choose Status --</option>
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Charges Filed">Charges Filed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold shadow"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
