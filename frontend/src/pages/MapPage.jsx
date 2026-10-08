import React, { useState, useEffect } from 'react';
import { 
  mapAPI, 
  stationsAPI, 
  hotspotsAPI, 
  predictionAPI, 
  analyticsAPI 
} from '../services/api';
import { useFilters } from '../context/FilterContext';
import CrimeMap from '../components/map/CrimeMap';
import DeckGL3DMap from '../components/map/DeckGL3DMap';
import FilterPanel from '../components/common/FilterPanel';
import RecentIncidentsPanel from '../components/dashboard/RecentIncidentsPanel';
import SpatialTools from '../components/map/SpatialTools';
import KpiCards from '../components/dashboard/KpiCards';
import CrimeTrendChart from '../components/dashboard/CrimeTrendChart';
import CrimeTypeChart from '../components/dashboard/CrimeTypeChart';
import StationChart from '../components/dashboard/StationChart';
import GeographicHotspotsPanel from '../components/dashboard/GeographicHotspotsPanel';
import EChartsCrimeAnalytics from '../components/dashboard/EChartsCrimeAnalytics';
import AgGridIncidentLedger from '../components/dashboard/AgGridIncidentLedger';
import { Button } from '../components/ui/button';
import {
  BarChart3,
  Flame,
  Shield,
  Layers,
  Activity,
  RefreshCw,
  Box,
  Map as MapIcon,
  Table,
  Sparkles
} from 'lucide-react';

export default function MapPage() {
  const { filters, updateFilter, resetFilters } = useFilters();

  // Map Layer Data
  const [incidents, setIncidents] = useState([]);
  const [stations, setStations] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);

  // Analytics & KPI Data
  const [summary, setSummary] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [stationData, setStationData] = useState([]);

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [spatialOverlay, setSpatialOverlay] = useState(null);

  // Modern Framework Engine Selectors
  const [mapEngine, setMapEngine] = useState('2d'); // '2d' (Leaflet) or '3d' (Deck.gl WebGL)
  const [analyticsEngine, setAnalyticsEngine] = useState('echarts'); // 'echarts' or 'standard'
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Fetch all map layers and synchronized analytics
  const fetchAllData = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const queryParams = {
        crime_type_id: activeFilters.crime_type_id || undefined,
        severity: activeFilters.severity || undefined,
        police_station_id: activeFilters.police_station_id || undefined,
        date_from: activeFilters.date_from || undefined,
        date_to: activeFilters.date_to || undefined,
        status: activeFilters.status || undefined,
        search: activeFilters.search || undefined,
        limit: 1500,
      };

      const results = await Promise.allSettled([
        mapAPI.getIncidents(queryParams),
        stationsAPI.getAll(),
        hotspotsAPI.getAll(),
        predictionAPI.getResults(36),
        mapAPI.getHeatmap(queryParams),
        analyticsAPI.getSummary(queryParams),
        analyticsAPI.getByDate(queryParams),
        analyticsAPI.getByType(queryParams),
        analyticsAPI.getByStation(queryParams)
      ]);

      const [
        incResult,
        stResult,
        hsResult,
        predResult,
        heatResult,
        summaryResult,
        trendResult,
        typeResult,
        stationResult
      ] = results;

      if (incResult.status === 'fulfilled' && incResult.value?.data) {
        setIncidents(incResult.value.data);
      }
      if (stResult.status === 'fulfilled' && stResult.value?.data) {
        setStations(stResult.value.data);
      }
      if (hsResult.status === 'fulfilled' && hsResult.value?.data) {
        setHotspots(hsResult.value.data);
      }
      if (predResult.status === 'fulfilled' && predResult.value?.data) {
        setPredictions(predResult.value.data?.predictions || predResult.value.data || []);
      }
      if (heatResult.status === 'fulfilled' && heatResult.value?.data) {
        setHeatmapPoints(heatResult.value.data);
      }
      if (summaryResult.status === 'fulfilled' && summaryResult.value?.data) {
        setSummary(summaryResult.value.data);
      }
      if (trendResult.status === 'fulfilled' && trendResult.value?.data) {
        setTrendData(trendResult.value.data);
      }
      if (typeResult.status === 'fulfilled' && typeResult.value?.data) {
        setTypeData(typeResult.value.data);
      }
      if (stationResult.status === 'fulfilled' && stationResult.value?.data) {
        setStationData(stationResult.value.data);
      }
    } catch (err) {
      console.error("Map and intelligence fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleApplyFilters = () => {
    fetchAllData(filters);
  };

  const handleResetFilters = () => {
    resetFilters();
    setTimeout(() => {
      fetchAllData({});
    }, 50);
  };

  const handleSelectRecentIncident = (inc) => {
    setSelectedIncident(inc);
  };

  return (
    <div className="space-y-5">
      {/* ==================================================================== */}
      {/* 1. MAIN INTERACTIVE COMMAND DECK (Map in Center, Right Sidebar)     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Center: Hero Interactive C4I Crime Map (Dominant ~68% width on large screens) */}
        <div className="lg:col-span-8 flex flex-col">
          {/* Top Engine & Tool Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <span>GEOSPATIAL ENGINE:</span>
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setMapEngine('2d')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                    mapEngine === '2d'
                      ? 'bg-blue-700 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>2D Tactical (Leaflet)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapEngine('3d')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                    mapEngine === '3d'
                      ? 'bg-[#0f2b48] text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Box className="w-3.5 h-3.5 text-sky-300" />
                  <span>3D WebGL (Deck.gl)</span>
                </button>
              </div>
            </div>

            {/* Quick AG-Grid Ledger Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLedgerModal(true)}
              className="flex items-center space-x-1.5 border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
            >
              <Table className="w-3.5 h-3.5 text-blue-700" />
              <span>AG-Grid Incident Ledger</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                {incidents.length}
              </span>
            </Button>
          </div>

          {/* Map Viewport Container */}
          <div className="h-[620px] w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
            {mapEngine === '2d' ? (
              <CrimeMap
                incidents={incidents}
                stations={stations}
                hotspots={hotspots}
                predictions={predictions}
                heatmapPoints={heatmapPoints}
                selectedLocation={
                  selectedIncident
                    ? [selectedIncident.latitude || selectedIncident.lat, selectedIncident.longitude || selectedIncident.lon]
                    : null
                }
                onIncidentClick={(inc) => setSelectedIncident(inc)}
                className="h-full w-full"
              />
            ) : (
              <DeckGL3DMap
                incidents={incidents}
                stations={stations}
                hotspots={hotspots}
                onIncidentClick={(inc) => setSelectedIncident(inc)}
                className="h-full w-full"
              />
            )}
          </div>

          {/* Map Telemetry Sub-bar */}
          <div className="mt-2.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-[11px] font-mono text-slate-600 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Jurisdiction: <strong className="text-slate-900 font-bold">Puducherry UT</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span>Loaded Incidents: <strong className="text-blue-700 font-bold">{incidents.length}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Hotspots: <strong className="text-amber-700 font-bold">{hotspots.length}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Engine: <strong className="text-slate-900 font-bold uppercase">{mapEngine === '3d' ? 'Deck.gl (WebGL)' : 'Leaflet (2D)'}</strong></span>
            </div>
            <button
              onClick={() => fetchAllData(filters)}
              disabled={loading}
              className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* Right Side: Filters, Recent Incidents, Collapsible Spatial Search (~32% width) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          {/* 1.1 FILTERS Panel */}
          <div>
            <FilterPanel
              filters={filters}
              onFilterChange={updateFilter}
              onReset={handleResetFilters}
              onApply={handleApplyFilters}
            />
          </div>

          {/* 1.2 Recent Incidents Feed */}
          <div>
            <RecentIncidentsPanel
              incidents={incidents}
              onSelectIncident={handleSelectRecentIncident}
            />
          </div>

          {/* 1.3 Collapsible Spatial Search */}
          <div>
            <SpatialTools
              onRadiusResult={(res) => setSpatialOverlay(res)}
              onClearSpatial={() => setSpatialOverlay(null)}
              onCenterLocation={(coords, zoom) => {
                // Centers map
              }}
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. KPI STATISTICS ROW (Directly below Map)                          */}
      {/* ==================================================================== */}
      <div className="pt-2">
        <KpiCards summary={summary} loading={loading} />
      </div>

      {/* ==================================================================== */}
      {/* 3. ANALYTICS SUITE (Recharts vs Apache ECharts Switcher)             */}
      {/* ==================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              ANALYTICS &amp; INTELLIGENCE TELEMETRY
            </h2>
          </div>
          <div className="flex items-center space-x-1.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setAnalyticsEngine('echarts')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                analyticsEngine === 'echarts'
                  ? 'bg-blue-700 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>Apache ECharts (Enterprise)</span>
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsEngine('standard')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                analyticsEngine === 'standard'
                  ? 'bg-white text-blue-900 font-semibold shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>Standard (Recharts)</span>
            </button>
          </div>
        </div>

        {analyticsEngine === 'echarts' ? (
          <EChartsCrimeAnalytics
            trendData={trendData}
            typeData={typeData}
            stationData={stationData}
            loading={loading}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Panel 1: Crime Trend Line Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
              <div className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                    1. Crime Incident Trend
                  </h3>
                  <p className="text-[10px] text-slate-500">Chronological incident frequency</p>
                </div>
                <Activity className="w-4 h-4 text-blue-700" />
              </div>
              <div className="flex-1">
                <CrimeTrendChart data={trendData} loading={loading} />
              </div>
            </div>

            {/* Panel 2: Crime Categories Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
              <div className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                    2. Crime Classifications
                  </h3>
                  <p className="text-[10px] text-slate-500">Distribution across offense categories</p>
                </div>
                <Layers className="w-4 h-4 text-sky-700" />
              </div>
              <div className="flex-1">
                <CrimeTypeChart data={typeData} loading={loading} />
              </div>
            </div>

            {/* Panel 3: Incidents by Police Station */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
              <div className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                    3. Station Workload
                  </h3>
                  <p className="text-[10px] text-slate-500">Case volume across 10 territorial posts</p>
                </div>
                <Shield className="w-4 h-4 text-indigo-700" />
              </div>
              <div className="flex-1">
                <StationChart data={stationData} loading={loading} />
              </div>
            </div>

            {/* Panel 4: Active Geographic Hotspots */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
              <div className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                    4. Geographic Hotspots
                  </h3>
                  <p className="text-[10px] text-slate-500">Top DBSCAN spatial risk assessments</p>
                </div>
                <Flame className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <GeographicHotspotsPanel 
                  hotspots={hotspots} 
                  loading={loading}
                  onSelectHotspot={(hs) => {
                    // Focus hotspot
                  }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. MODAL: AG-GRID ENTERPRISE COMMAND LEDGER                          */}
      {/* ==================================================================== */}
      {showLedgerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Table className="w-5 h-5 text-blue-700" />
                <h3 className="font-mono font-bold text-base text-slate-900">
                  TACTICAL INCIDENT REPOSITORY (AG-GRID LEDGER)
                </h3>
              </div>
              <button
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-500 hover:text-slate-900 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-mono"
              >
                Close ESC
              </button>
            </div>

            <AgGridIncidentLedger
              incidents={incidents}
              loading={loading}
              onSelectIncident={(inc) => {
                setSelectedIncident(inc);
                setShowLedgerModal(false);
              }}
              onRefresh={() => fetchAllData(filters)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
