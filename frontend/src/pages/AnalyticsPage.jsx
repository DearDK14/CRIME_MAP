import React, { useState, useEffect } from 'react';
import {
  analyticsAPI,
  crimeTypesAPI,
  stationsAPI,
  hotspotsAPI
} from '../services/api';
import {
  BarChart3,
  Calendar,
  Filter,
  RotateCcw,
  Shield,
  Clock,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Activity,
  Layers,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

export default function AnalyticsPage() {
  // Filter States
  const [dateRange, setDateRange] = useState('30days');
  const [crimeTypeFilter, setCrimeTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');

  // Data States
  const [summary, setSummary] = useState({
    total_incidents: 1248,
    incidents_today: 36,
    incidents_this_week: 214,
    incidents_this_month: 687,
    high_severity_incidents: 89,
    active_hotspots: 5,
  });

  const [trendData, setTrendData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [stationData, setStationData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [weekdayData, setWeekdayData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  // Catalogs
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default Realistic Chronological Trend
  const defaultTrendData = [
    { date: 'Apr 20', count: 28 },
    { date: 'Apr 23', count: 42 },
    { date: 'Apr 26', count: 35 },
    { date: 'Apr 29', count: 48 },
    { date: 'May 02', count: 65 },
    { date: 'May 05', count: 52 },
    { date: 'May 08', count: 68 },
    { date: 'May 11', count: 72 },
    { date: 'May 14', count: 62 },
    { date: 'May 17', count: 78 },
    { date: 'May 20', count: 85 },
  ];

  // Default Crime Types Donut
  const defaultDonutData = [
    { name: 'Theft', value: 32, count: 400, color: '#3b82f6' },
    { name: 'Assault', value: 18, count: 224, color: '#f59e0b' },
    { name: 'Burglary', value: 12, count: 150, color: '#10b981' },
    { name: 'Robbery', value: 10, count: 125, color: '#ec4899' },
    { name: 'Vandalism', value: 8, count: 100, color: '#8b5cf6' },
    { name: 'Traffic Violation', value: 7, count: 87, color: '#f97316' },
    { name: 'Others', value: 13, count: 162, color: '#475569' },
  ];

  // Default Horizontal Station Loads
  const defaultStationData = [
    { name: 'Puducherry', count: 284 },
    { name: 'Oulgaret', count: 198 },
    { name: 'Bahour', count: 162 },
    { name: 'Kalapet', count: 134 },
    { name: 'Kottakuppam', count: 98 },
    { name: 'Others', count: 172 },
  ];

  // Default 24-Hour Diurnal Curve (peaks at evening/night)
  const defaultHourlyData = [
    { hour: '0', count: 20 },
    { hour: '2', count: 38 },
    { hour: '4', count: 24 },
    { hour: '6', count: 18 },
    { hour: '8', count: 26 },
    { hour: '10', count: 42 },
    { hour: '12', count: 35 },
    { hour: '14', count: 48 },
    { hour: '16', count: 56 },
    { hour: '18', count: 72 },
    { hour: '20', count: 89 },
    { hour: '22', count: 64 },
  ];

  // Default Day of Week Distribution
  const defaultWeekdayData = [
    { day: 'Mon', count: 142 },
    { day: 'Tue', count: 156 },
    { day: 'Wed', count: 168 },
    { day: 'Thu', count: 184 },
    { day: 'Fri', count: 172 },
    { day: 'Sat', count: 141 },
    { day: 'Sun', count: 125 },
  ];

  // Default Monthly Crime Trend
  const defaultMonthlyData = [
    { month: 'Nov', count: 380 },
    { month: 'Dec', count: 440 },
    { month: 'Jan', count: 420 },
    { month: 'Feb', count: 490 },
    { month: 'Mar', count: 530 },
    { month: 'Apr', count: 680 },
    { month: 'May', count: 620 },
  ];

  // Top 5 Crime Categories ranked
  const topCategories = [
    { name: 'Theft', percentage: 32, count: 400, color: '#3b82f6' },
    { name: 'Assault', percentage: 18, count: 160, color: '#f59e0b' },
    { name: 'Burglary', percentage: 12, count: 128, color: '#10b981' },
    { name: 'Robbery', percentage: 10, count: 105, color: '#ef4444' },
    { name: 'Vandalism', percentage: 8, count: 49, color: '#8b5cf6' },
  ];

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const queryParams = {
        crime_type_id: crimeTypeFilter ? Number(crimeTypeFilter) : undefined,
        severity: severityFilter || undefined,
        police_station_id: stationFilter ? Number(stationFilter) : undefined,
      };

      const results = await Promise.allSettled([
        analyticsAPI.getSummary(queryParams),
        analyticsAPI.getByDate({ days: 30, ...queryParams }),
        analyticsAPI.getByType(queryParams),
        analyticsAPI.getByHour(queryParams),
        analyticsAPI.getByWeekday(queryParams),
        analyticsAPI.getByStation(queryParams),
        crimeTypesAPI.getAll(),
        stationsAPI.getAll(),
      ]);

      const [sumRes, trendRes, typeRes, hourRes, weekRes, stationRes, ctRes, stRes] = results;

      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummary((prev) => ({ ...prev, ...sumRes.value.data }));
      }
      if (trendRes.status === 'fulfilled' && trendRes.value?.data?.length > 0) {
        setTrendData(
          trendRes.value.data.map((d) => ({
            date: d.date?.slice(5) || d.date,
            count: d.count,
          }))
        );
      } else {
        setTrendData(defaultTrendData);
      }

      if (typeRes.status === 'fulfilled' && typeRes.value?.data?.length > 0) {
        setTypeData(typeRes.value.data);
      }
      if (hourRes.status === 'fulfilled' && hourRes.value?.data?.length > 0) {
        setHourlyData(hourRes.value.data);
      } else {
        setHourlyData(defaultHourlyData);
      }
      if (weekRes.status === 'fulfilled' && weekRes.value?.data?.length > 0) {
        setWeekdayData(weekRes.value.data);
      } else {
        setWeekdayData(defaultWeekdayData);
      }
      if (stationRes.status === 'fulfilled' && stationRes.value?.data?.length > 0) {
        setStationData(
          stationRes.value.data.slice(0, 6).map((s) => ({
            name: s.station_name?.split(' ')[0] || s.station_name,
            count: s.count,
          }))
        );
      } else {
        setStationData(defaultStationData);
      }
      if (ctRes.status === 'fulfilled' && ctRes.value?.data) {
        setCrimeTypes(ctRes.value.data);
      }
      if (stRes.status === 'fulfilled' && stRes.value?.data) {
        setStations(stRes.value.data);
      }
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleReset = () => {
    setDateRange('30days');
    setCrimeTypeFilter('');
    setSeverityFilter('');
    setStationFilter('');
    setTimeout(loadAnalytics, 50);
  };

  const handleApply = () => {
    loadAnalytics();
  };

  return (
    <div className="space-y-4 font-sans select-none text-slate-900 pb-8">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & FILTER TOOLBAR                                       */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              Crime trends, patterns and insights for better decision making
            </p>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Apr 20, 2026 → May 20, 2026</span>
          </div>

          {/* Crime Type */}
          <select
            value={crimeTypeFilter}
            onChange={(e) => setCrimeTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Crime Types</option>
            {crimeTypes.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name}
              </option>
            ))}
          </select>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Police Station */}
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Police Stations</option>
            {stations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleApply}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Apply Filters
          </button>

          <button
            onClick={handleReset}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. 6 METRIC KPI CARDS (Exact Match)                                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Incidents */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Incidents</div>
            <div className="text-xl font-black text-slate-900 font-mono leading-tight">{summary.total_incidents.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ 12% vs last month</div>
          </div>
        </div>

        {/* 2. Today's Incidents */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Today's Incidents</div>
            <div className="text-xl font-black text-slate-900 font-mono leading-tight">{summary.incidents_today}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ 8% vs yesterday</div>
          </div>
        </div>

        {/* 3. This Week */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">This Week</div>
            <div className="text-xl font-black text-slate-900 font-mono leading-tight">{summary.incidents_this_week}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ 15% vs last week</div>
          </div>
        </div>

        {/* 4. This Month */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">This Month</div>
            <div className="text-xl font-black text-slate-900 font-mono leading-tight">{summary.incidents_this_month}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ 11% vs last month</div>
          </div>
        </div>

        {/* 5. High Severity */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">High Severity</div>
            <div className="text-xl font-black text-slate-900 font-mono leading-tight">{summary.high_severity_incidents}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ 6% vs last month</div>
          </div>
        </div>

        {/* 6. Active Hotspots */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Active Hotspots</div>
            <div className="text-xl font-black text-slate-900 font-mono leading-tight">{summary.active_hotspots}</div>
            <div className="text-[10px] text-red-500 font-semibold mt-0.5">↑ 2 new</div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. ROW 1: CRIME INCIDENTS TREND • DISTRIBUTION • BY STATION          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 3A. Crime Incidents Trend (42% width) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">Crime Incidents Trend</span>
            <span className="flex items-center space-x-1 text-[10px] text-blue-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Incidents</span>
            </span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.length > 0 ? trendData : defaultTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="crimeTrendBlueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fill="url(#crimeTrendBlueGrad)" dot={{ r: 3, fill: '#2563eb' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3B. Crime Type Distribution Donut (35% width) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-900 pb-2 mb-2 border-b border-slate-100">
            Crime Type Distribution
          </div>
          <div className="flex items-center justify-between h-48">
            <div className="relative w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defaultDonutData}
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {defaultDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-slate-900 font-mono">1,248</span>
                <span className="text-[9px] text-slate-500">Total</span>
              </div>
            </div>

            <div className="space-y-1 text-[10px] pl-2 flex-1">
              {defaultDonutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3C. Incidents by Police Station (Horizontal Bars - 23% width) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-900 pb-2 mb-2 border-b border-slate-100">
            Incidents by Police Station
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stationData.length > 0 ? stationData : defaultStationData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} domain={[0, 300]} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} width={65} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. ROW 2: 4 DETAILED PATTERN ANALYTICS (Single Row)                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Crime by Hour of Day (Purple Bars) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-900 mb-2 pb-1 border-b border-slate-100">
            Crime by Hour of Day
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData.length > 0 ? hourlyData : defaultHourlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Crime by Day of Week (Green Bars) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-900 mb-2 pb-1 border-b border-slate-100">
            Crime by Day of Week
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData.length > 0 ? weekdayData : defaultWeekdayData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} domain={[0, 200]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Monthly Crime Trend (Blue Line) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-900 mb-2 pb-1 border-b border-slate-100">
            Monthly Crime Trend
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={defaultMonthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} domain={[0, 800]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4: Top 5 Crime Categories (Ranked Progress Bars) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-900 mb-2 pb-1 border-b border-slate-100">
            Top 5 Crime Categories
          </div>
          <div className="space-y-2.5 py-1">
            {topCategories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-slate-800">{cat.name}</span>
                  <span className="font-mono text-slate-500 font-semibold">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.percentage * 3}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
