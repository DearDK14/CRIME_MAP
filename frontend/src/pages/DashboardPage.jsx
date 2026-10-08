import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import {
  mapAPI,
  stationsAPI,
  hotspotsAPI,
  predictionAPI,
  analyticsAPI,
  incidentsAPI,
  crimeTypesAPI
} from '../services/api';
import IncidentMarkerCluster from '../components/map/IncidentMarkerCluster';

import {
  Filter,
  RotateCcw,
  Calendar,
  Layers,
  Flame,
  Shield,
  Bell,
  Activity,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Crosshair,
  Search,
  ArrowUpRight,
  TrendingUp,
  Radio,
  MapPin,
  ChevronRight,
  X
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

// Center on Puducherry
const DEFAULT_CENTER = [11.9139, 79.8145];
const DEFAULT_ZOOM = 13;

// Police Station Icon for Map
const stationShieldIcon = L.divIcon({
  className: 'custom-station-shield',
  html: `
    <div style="background: #1e3a8a; border: 2px solid #60a5fa; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.6);">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#60a5fa" stroke="#ffffff" stroke-width="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// Map Controller for zooming and center actions
function MapActions({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || DEFAULT_ZOOM, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function DashboardPage() {
  // Map Layer Data
  const [incidents, setIncidents] = useState([]);
  const [stations, setStations] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [crimeTypes, setCrimeTypes] = useState([]);

  // Filter States
  const [selectedCrimeType, setSelectedCrimeType] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('30days');
  const [searchQuery, setSearchQuery] = useState('');

  // Layer Toggles
  const [showLayersBox, setShowLayersBox] = useState(true);
  const [layerIncidents, setLayerIncidents] = useState(true);
  const [layerHeatmap, setLayerHeatmap] = useState(true);
  const [layerHotspots, setLayerHotspots] = useState(true);
  const [layerStations, setLayerStations] = useState(true);
  const [layerGeoJson, setLayerGeoJson] = useState(false);
  const [baseMapStyle, setBaseMapStyle] = useState('osm'); // 'osm' | 'satellite' | 'dark'

  // Map Navigation
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [mapInstance, setMapInstance] = useState(null);

  // Loading
  const [loading, setLoading] = useState(true);

  // Load All Telemetry Data
  const loadData = async () => {
    setLoading(true);
    try {
      const queryParams = {
        crime_type_id: selectedCrimeType ? Number(selectedCrimeType) : undefined,
        severity: selectedSeverity || undefined,
        police_station_id: selectedStation ? Number(selectedStation) : undefined,
        limit: 1000,
      };

      const results = await Promise.allSettled([
        mapAPI.getIncidents(queryParams),
        stationsAPI.getAll(),
        hotspotsAPI.getAll(),
        predictionAPI.getResults(36),
        crimeTypesAPI.getAll(),
      ]);

      const [incRes, stRes, hsRes, predRes, ctRes] = results;

      if (incRes.status === 'fulfilled' && incRes.value?.data) {
        setIncidents(incRes.value.data);
      }
      if (stRes.status === 'fulfilled' && stRes.value?.data) {
        setStations(stRes.value.data);
      }
      if (hsRes.status === 'fulfilled' && hsRes.value?.data) {
        setHotspots(hsRes.value.data);
      }
      if (predRes.status === 'fulfilled' && predRes.value?.data) {
        setPredictions(predRes.value.data?.predictions || predRes.value.data || []);
      }
      if (ctRes.status === 'fulfilled' && ctRes.value?.data) {
        setCrimeTypes(ctRes.value.data);
      }
    } catch (e) {
      console.error('Error loading dashboard telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetFilters = () => {
    setSelectedCrimeType('');
    setSelectedSeverity('');
    setSelectedStation('');
    setSelectedDateRange('30days');
    setSearchQuery('');
    setTimeout(loadData, 50);
  };

  const handleApplyFilters = () => {
    loadData();
  };

  // Zoom Helpers
  const zoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };
  const zoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };
  const resetCenter = () => {
    if (mapInstance) mapInstance.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  };

  // Recent Incidents list (top 5 sorted)
  const recentIncidentsList = incidents.slice(0, 5);

  // 1. Chart 1: Crime Trend (Last 7 Days)
  const trendChartData = [
    { day: 'Apr 20', count: 62 },
    { day: 'Apr 21', count: 98 },
    { day: 'Apr 22', count: 115 },
    { day: 'Apr 23', count: 142 },
    { day: 'Apr 24', count: 128 },
    { day: 'Apr 25', count: 154 },
    { day: 'Apr 26', count: 178 },
  ];

  // 2. Chart 2: Crime Types Donut
  const crimeTypeDonutData = [
    { name: 'Theft', value: 32, color: '#3b82f6' },
    { name: 'Assault', value: 18, color: '#10b981' },
    { name: 'Burglary', value: 12, color: '#06b6d4' },
    { name: 'Robbery', value: 10, color: '#8b5cf6' },
    { name: 'Vandalism', value: 8, color: '#f43f5e' },
    { name: 'Others', value: 20, color: '#f59e0b' },
  ];

  // 3. Chart 3: Incidents by Police Station
  const stationBarData = [
    { name: 'Puducherry', count: 284 },
    { name: 'Oulgaret', count: 198 },
    { name: 'Bahour', count: 162 },
    { name: 'Kalapet', count: 134 },
    { name: 'Kottakuppam', count: 98 },
  ];

  // Severity pill styling helper
  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
      case 'High':
        return { label: 'High', bg: 'bg-red-500/20 text-red-400 border border-red-500/40', dot: 'bg-red-500' };
      case 'Medium':
        return { label: 'Medium', bg: 'bg-amber-500/20 text-amber-400 border border-amber-500/40', dot: 'bg-amber-500' };
      case 'Low':
        return { label: 'Low', bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40', dot: 'bg-emerald-500' };
      default:
        return { label: sev || 'Medium', bg: 'bg-blue-500/20 text-blue-400 border border-blue-500/40', dot: 'bg-blue-500' };
    }
  };

  return (
    <div className="space-y-4 font-sans select-none pb-4">
      {/* ==================================================================== */}
      {/* SECTION 1: TOP SECTION (Hero Map 68% + Filter/Recent Incidents 32%)   */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: HERO INTERACTIVE GIS MAP */}
        <div className="lg:col-span-8 bg-[#0b1329] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl relative h-[520px]">
          {/* Top Search Overlay */}
          <div className="absolute top-3 left-3 z-[400] w-72 sm:w-80">
            <div className="relative flex items-center bg-[#0d1833]/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 shadow-2xl">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search location, area or police station..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none w-full font-sans"
              />
            </div>
          </div>

          {/* Left Zoom & Crosshair Controls */}
          <div className="absolute top-16 left-3 z-[400] flex flex-col space-y-1.5">
            <button
              onClick={zoomIn}
              className="w-8 h-8 rounded-lg bg-[#0d1833]/90 backdrop-blur-md border border-slate-700 hover:bg-[#15254f] text-slate-200 flex items-center justify-center shadow-lg transition-colors"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={zoomOut}
              className="w-8 h-8 rounded-lg bg-[#0d1833]/90 backdrop-blur-md border border-slate-700 hover:bg-[#15254f] text-slate-200 flex items-center justify-center shadow-lg transition-colors"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={resetCenter}
              className="w-8 h-8 rounded-lg bg-[#0d1833]/90 backdrop-blur-md border border-slate-700 hover:bg-[#15254f] text-slate-200 flex items-center justify-center shadow-lg transition-colors"
              title="Center on Puducherry"
            >
              <Crosshair className="w-4 h-4 text-sky-400" />
            </button>
          </div>

          {/* Top-Right Floating Layers Card */}
          {showLayersBox ? (
            <div className="absolute top-3 right-3 z-[400] bg-[#091124]/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs text-slate-200 w-52 animate-in fade-in-0 duration-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="font-bold text-white text-xs font-sans">Layers</span>
                <button
                  onClick={() => setShowLayersBox(false)}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={layerIncidents}
                    onChange={(e) => setLayerIncidents(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="text-red-400">📍</span>
                  <span className="text-[11px]">Crime Incidents</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={layerHeatmap}
                    onChange={(e) => setLayerHeatmap(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>🔥</span>
                  <span className="text-[11px]">Heatmap</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={layerHotspots}
                    onChange={(e) => setLayerHotspots(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
                  <span className="text-[11px]">Hotspot Areas</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={layerStations}
                    onChange={(e) => setLayerStations(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="text-blue-400">🛡️</span>
                  <span className="text-[11px]">Police Stations</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={layerGeoJson}
                    onChange={(e) => setLayerGeoJson(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="text-purple-400">📐</span>
                  <span className="text-[11px]">GeoJSON Layer</span>
                </label>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Base Map</span>
                <select
                  value={baseMapStyle}
                  onChange={(e) => setBaseMapStyle(e.target.value)}
                  className="w-full bg-[#050914] border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-[11px] focus:outline-none"
                >
                  <option value="osm">OpenStreetMap</option>
                  <option value="satellite">Satellite (Esri)</option>
                  <option value="dark">Dark Canvas</option>
                </select>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLayersBox(true)}
              className="absolute top-3 right-3 z-[400] bg-[#091124]/90 backdrop-blur-md border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white flex items-center space-x-1.5 shadow-xl hover:bg-[#13203f]"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Layers</span>
            </button>
          )}

          {/* Bottom-Right Floating Severity Legend */}
          <div className="absolute bottom-4 right-3 z-[400] bg-[#091124]/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 shadow-2xl text-[11px] text-slate-200 space-y-1">
            <span className="font-bold text-white text-[10px] block mb-1">Crime Severity</span>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-300">Low</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[10px] text-slate-300">Moderate</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-[10px] text-slate-300">High</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span className="text-[10px] text-slate-300">Very High</span>
            </div>
          </div>

          {/* Main Leaflet Map Container */}
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={true}
            zoomControl={false}
            ref={setMapInstance}
            className="h-full w-full"
          >
            <MapActions center={mapCenter} zoom={mapZoom} />

            {/* Base Tile Layer */}
            {baseMapStyle === 'osm' && (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            )}
            {baseMapStyle === 'satellite' && (
              <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            )}
            {baseMapStyle === 'dark' && (
              <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                maxZoom={16}
              />
            )}

            {/* Hotspot Radial Glows / Heatmap Buffer Areas */}
            {layerHeatmap &&
              hotspots.map((hs, idx) => {
                const lat = hs.center_lat ?? hs.latitude ?? (hs.centroid && hs.centroid[1]);
                const lon = hs.center_lon ?? hs.longitude ?? (hs.centroid && hs.centroid[0]);
                if (!lat || !lon) return null;
                return (
                  <React.Fragment key={`hotspot-glow-${idx}`}>
                    {/* Outer Green Glow */}
                    <Circle
                      center={[lat, lon]}
                      radius={1200}
                      pathOptions={{ color: 'transparent', fillColor: '#10b981', fillOpacity: 0.14 }}
                    />
                    {/* Yellow Core */}
                    <Circle
                      center={[lat, lon]}
                      radius={750}
                      pathOptions={{ color: 'transparent', fillColor: '#fbbf24', fillOpacity: 0.25 }}
                    />
                    {/* Red Intense Center */}
                    <Circle
                      center={[lat, lon]}
                      radius={380}
                      pathOptions={{ color: '#ef4444', fillColor: '#dc2626', fillOpacity: 0.45, weight: 1.5 }}
                    />
                  </React.Fragment>
                );
              })}

            {/* Hotspot Area Boundaries */}
            {layerHotspots &&
              hotspots.map((hs, idx) => {
                const lat = hs.center_lat ?? hs.latitude ?? hs.lat;
                const lon = hs.center_lon ?? hs.longitude ?? hs.lon;
                if (!lat || !lon) return null;
                return (
                  <Circle
                    key={`hs-boundary-${idx}`}
                    center={[lat, lon]}
                    radius={Math.min(Math.max(hs.radius_meters || 400, 200), 600)}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 2, dashArray: '3, 4' }}
                  />
                );
              })}

            {/* Police Stations Shield Badges */}
            {layerStations &&
              stations.map((st) => {
                const lat = st.latitude || st.lat;
                const lon = st.longitude || st.lon;
                if (!lat || !lon) return null;
                return (
                  <Marker key={`st-${st.id}`} position={[lat, lon]} icon={stationShieldIcon}>
                    <Popup maxWidth={260}>
                      <div className="text-xs p-1 text-slate-900">
                        <strong className="text-blue-800 text-sm block">{st.station_name || st.name}</strong>
                        <div className="text-slate-600 mt-1">Jurisdiction: {st.jurisdiction_area}</div>
                        <div className="text-slate-600">Officer: {st.officer_in_charge}</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Clustered Crime Incidents */}
            {layerIncidents && (
              <IncidentMarkerCluster incidents={incidents} />
            )}
          </MapContainer>
        </div>

        {/* RIGHT COLUMN: FILTERS (Top) & RECENT INCIDENTS (Bottom) */}
        <div className="lg:col-span-4 flex flex-col space-y-4 justify-between">
          {/* 1. FILTERS CARD */}
          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Filter className="w-4 h-4 text-blue-400" />
                <span>Filters</span>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 rounded-md bg-[#13203f] hover:bg-[#1a2d59] text-[11px] text-slate-300 hover:text-white font-medium transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Crime Type */}
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Crime Type</label>
                <select
                  value={selectedCrimeType}
                  onChange={(e) => setSelectedCrimeType(e.target.value)}
                  className="w-full bg-[#070d1a] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
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
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Severity</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full bg-[#070d1a] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
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
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Police Station</label>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="w-full bg-[#070d1a] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Stations</option>
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Date Range</label>
                <div className="relative">
                  <select
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e.target.value)}
                    className="w-full bg-[#070d1a] border border-[#1e293b] rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none"
                  >
                    <option value="30days">Last 30 days</option>
                    <option value="today">Today</option>
                    <option value="thisweek">This Week</option>
                    <option value="thismonth">This Month</option>
                  </select>
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            <button
              onClick={handleApplyFilters}
              className="w-full mt-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-2 rounded-xl text-xs shadow-lg transition-all"
            >
              Apply Filters
            </button>
          </div>

          {/* 2. RECENT INCIDENTS CARD */}
          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-4 shadow-2xl flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Recent Incidents</span>
              </div>
              <Link
                to="/incidents"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentIncidentsList.map((inc, i) => {
                const badge = getSeverityBadge(inc.severity);
                const timeStr = inc.time || '14:32';
                const dateLabel = inc.date ? `Today, ${timeStr}` : 'Today, 14:32';
                const locality = inc.police_station?.split(' ')[0] || inc.address?.split(',')[0] || 'Puducherry';

                return (
                  <div
                    key={`recent-inc-${inc.id || i}`}
                    className="flex items-center justify-between py-1 hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${badge.dot} shrink-0`} />
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">
                          {inc.crime_type?.name || inc.crime_type || 'Theft'}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-tight">
                          {dateLabel} &nbsp;&nbsp; {locality}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 2: 6 METRIC KPI CARDS (Single Row)                           */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Incidents */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-3.5 shadow-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Total Incidents</div>
            <div className="text-xl font-black text-white font-mono leading-tight">1,248</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">↑ 12% vs last month</div>
          </div>
        </div>

        {/* 2. Today's Incidents */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-3.5 shadow-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Today's Incidents</div>
            <div className="text-xl font-black text-white font-mono leading-tight">36</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">↑ 8% vs yesterday</div>
          </div>
        </div>

        {/* 3. This Week */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-3.5 shadow-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">This Week</div>
            <div className="text-xl font-black text-white font-mono leading-tight">214</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">↑ 15% vs last week</div>
          </div>
        </div>

        {/* 4. This Month */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-3.5 shadow-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">This Month</div>
            <div className="text-xl font-black text-white font-mono leading-tight">687</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">↑ 11% vs last month</div>
          </div>
        </div>

        {/* 5. High Severity */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-3.5 shadow-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">High Severity</div>
            <div className="text-xl font-black text-white font-mono leading-tight">89</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">↑ 6% vs last month</div>
          </div>
        </div>

        {/* 6. Active Hotspots */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-3.5 shadow-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Active Hotspots</div>
            <div className="text-xl font-black text-white font-mono leading-tight">5</div>
            <div className="text-[10px] text-red-400 font-semibold mt-0.5">↑ 2 new</div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 3: 4 ANALYTIC PANELS (Single Row)                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Panel 1: Crime Trend (Last 7 Days) */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-4 shadow-2xl flex flex-col justify-between">
          <div className="text-xs font-bold text-white mb-2">Crime Trend (Last 7 Days)</div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="crimeTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} domain={[0, 200]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#091124', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2.5} fill="url(#crimeTrendGradient)" dot={{ r: 3, fill: '#38bdf8' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 2: Crime Types Donut */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-4 shadow-2xl flex flex-col justify-between">
          <div className="text-xs font-bold text-white mb-1">Crime Types</div>
          <div className="flex items-center justify-between h-44">
            {/* Donut with Central Text */}
            <div className="relative w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={crimeTypeDonutData}
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {crimeTypeDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-white font-mono">1,248</span>
                <span className="text-[8px] text-slate-400">Total</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-1 text-[10px] pl-2 flex-1">
              {crimeTypeDonutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-400 font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 3: Incidents by Police Station */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-4 shadow-2xl flex flex-col justify-between">
          <div className="text-xs font-bold text-white mb-2">Incidents by Police Station</div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationBarData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#091124', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 4: Geographic Hotspots Mini-Preview */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-4 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white">Geographic Hotspots</span>
            <Link to="/map" className="text-slate-400 hover:text-white" title="Expand Full GIS Map">
              <Maximize2 className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-44 w-full rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
            {/* Satellite image / mini-map canvas */}
            <div className="absolute inset-0 bg-[#06101e]">
              <img
                src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/3720/5912"
                alt="Mini GIS satellite"
                className="w-full h-full object-cover opacity-70"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              {/* Simulated Heat Glows */}
              <div className="absolute top-1/4 left-1/3 w-16 h-16 rounded-full bg-red-600/60 blur-md pointer-events-none" />
              <div className="absolute bottom-1/3 left-1/2 w-14 h-14 rounded-full bg-amber-500/50 blur-md pointer-events-none" />
              <div className="absolute top-1/2 right-1/4 w-12 h-12 rounded-full bg-emerald-500/40 blur-md pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[11px] font-bold text-white bg-slate-900/60 px-2 py-0.5 rounded backdrop-blur-sm">
                  Puducherry
                </span>
              </div>
            </div>

            {/* Vertical Severity Intensity Bar on Right */}
            <div className="absolute right-2 top-3 bottom-3 flex items-center space-x-1.5 z-10">
              <div className="w-2.5 h-full rounded-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-600 shadow-lg border border-black/40" />
              <div className="flex flex-col justify-between h-full text-[8px] text-slate-300 font-medium">
                <span>Low</span>
                <span>Very High</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 4: BOTTOM FOOTER (Exact Match)                               */}
      {/* ==================================================================== */}
      <footer className="pt-2 border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-sans">
        <div>
          <strong className="text-slate-400">CRIMEMAP</strong> &nbsp;v1.0.0 &nbsp;|&nbsp; Puducherry Police Hackathon 2026
        </div>
        <div className="text-right text-[10px] text-slate-500 mt-1 sm:mt-0">
          This system provides decision-support information based on historical data and does not guarantee future outcomes.
        </div>
      </footer>
    </div>
  );
}
