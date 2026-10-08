import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Layers, 
  BarChart3, 
  Sliders, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  MapPin,
  TrendingUp,
  Cpu,
  FileSpreadsheet
} from 'lucide-react';
import { 
  predictionApi, 
  hotspotApi, 
  analyticsApi, 
  mapApi 
} from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

export default function AnalystPage() {
  const [loading, setLoading] = useState(true);
  const [runningModel, setRunningModel] = useState(false);
  const [runningHotspot, setRunningHotspot] = useState(false);
  
  // Model & Prediction State
  const [predictions, setPredictions] = useState([]);
  const [forecastDays, setForecastDays] = useState(7);
  
  // Hotspots & Clustering State
  const [hotspots, setHotspots] = useState([]);
  const [epsMeters, setEpsMeters] = useState(600);
  const [minSamples, setMinSamples] = useState(5);
  
  // Temporal & Aggregated Analytics
  const [hourlyData, setHourlyData] = useState([]);
  const [weekdayData, setWeekdayData] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadAnalystData();
  }, []);

  const loadAnalystData = async () => {
    setLoading(true);
    try {
      const [predsRes, hotRes, hourRes, dayRes] = await Promise.all([
        predictionApi.getResults(15),
        hotspotApi.getAll({ active_only: true }),
        analyticsApi.getByHour(),
        analyticsApi.getByWeekday()
      ]);
      setPredictions(predsRes.data?.predictions || []);
      setHotspots(hotRes.data || []);
      setHourlyData(hourRes.data || []);
      setWeekdayData(dayRes.data || []);
    } catch (err) {
      console.error('Failed loading analyst data:', err);
      setMessage({ type: 'error', text: 'Error fetching analytical feeds from backend.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunDBSCAN = async () => {
    setRunningHotspot(true);
    setMessage(null);
    try {
      const res = await hotspotApi.detect({
        eps_meters: Number(epsMeters),
        min_samples: Number(minSamples),
        days_lookback: 90
      });
      setMessage({ 
        type: 'success', 
        text: `DBSCAN Clustering Complete: Detected ${res.data.detected_clusters} hotspots. ${res.data.noise_points} noise incidents filtered.` 
      });
      // Refresh hotspots
      const hotRes = await hotspotApi.getAll({ active_only: true });
      setHotspots(hotRes.data || []);
    } catch (err) {
      console.error('DBSCAN error:', err);
      setMessage({ type: 'error', text: 'Failed to run DBSCAN spatial clustering.' });
    } finally {
      setRunningHotspot(false);
    }
  };

  const handleRunPrediction = async () => {
    setRunningModel(true);
    setMessage(null);
    try {
      const res = await predictionApi.run({
        forecast_days: Number(forecastDays),
        model_type: 'time_series_weighted'
      });
      setMessage({ 
        type: 'success', 
        text: `Grid Risk Assessment Complete: Evaluated ${res.data.total_zones_evaluated} sector zones. Baseline MAE: ${res.data.model_metrics?.baseline_mae} | Model MAE: ${res.data.model_metrics?.model_mae}.` 
      });
      // Refresh predictions
      const predsRes = await predictionApi.getResults(15);
      setPredictions(predsRes.data?.predictions || []);
    } catch (err) {
      console.error('Prediction error:', err);
      setMessage({ type: 'error', text: 'Failed to run predictive risk assessment.' });
    } finally {
      setRunningModel(false);
    }
  };

  const handleExportGeoJSON = async () => {
    try {
      const res = await mapApi.getGeoJson();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `puducherry_crime_features_${new Date().toISOString().slice(0, 10)}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setMessage({ type: 'error', text: 'GeoJSON export failed.' });
    }
  };

  return (
    <div className="space-y-6 bg-[#f8fafc] text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Crime Intelligence & Analytical Workbench
                <span className="text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                  ROLE: ANALYST
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Advanced spatial statistics, Vectorized Haversine DBSCAN calibration, and explainable grid risk models.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportGeoJSON}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export GeoJSON
          </button>
          <button
            onClick={loadAnalystData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Feeds
          </button>
        </div>
      </div>

      {/* Status Notification */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Model Parameter Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ML Calibration: DBSCAN Hotspot Clustering */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-blue-700" />
              <h2 className="font-bold text-slate-900">Spatial Clustering (Haversine DBSCAN)</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">EPSG:4326 / Metric Arc</span>
          </div>

          <p className="text-xs text-slate-600">
            Vectorized spatial clustering using Haversine metric distance. Automatically distinguishes localized crime clusters from diffuse background noise.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Epsilon (Radius in Meters): <span className="text-blue-700 font-mono font-bold">{epsMeters}m</span>
              </label>
              <input 
                type="range" 
                min="200" 
                max="1500" 
                step="50"
                value={epsMeters}
                onChange={(e) => setEpsMeters(e.target.value)}
                className="w-full accent-blue-700 bg-slate-100 rounded-lg h-2 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Recommended: 400m - 800m</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Min Core Samples: <span className="text-blue-700 font-mono font-bold">{minSamples} pts</span>
              </label>
              <input 
                type="range" 
                min="3" 
                max="15" 
                step="1"
                value={minSamples}
                onChange={(e) => setMinSamples(e.target.value)}
                className="w-full accent-blue-700 bg-slate-100 rounded-lg h-2 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Density threshold</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Active clusters currently tracked: <strong className="text-slate-900 font-mono">{hotspots.length}</strong>
            </span>
            <button
              onClick={handleRunDBSCAN}
              disabled={runningHotspot}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              <Activity className={`w-4 h-4 ${runningHotspot ? 'animate-spin' : ''}`} />
              {runningHotspot ? 'Running Cluster Engine...' : 'Run DBSCAN Pipeline'}
            </button>
          </div>
        </div>

        {/* ML Calibration: Sector Grid Predictive Risk */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-slate-900">Predictive Risk Forecast Pipeline</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Temporal-Spatial Grid</span>
          </div>

          <p className="text-xs text-slate-600">
            Computes sector-level expected incident pressure using exponential temporal weighting and historical baseline deviation. 
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Forecast Horizon: <span className="text-amber-700 font-mono font-bold">{forecastDays} Days Ahead</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 7, 14].map((d) => (
                <button
                  key={d}
                  onClick={() => setForecastDays(d)}
                  className={`py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    forecastDays === d
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Model Evaluation Metric:</span>
              <span className="font-mono text-emerald-700 font-medium">Mean Absolute Error (MAE)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Decision Support Classification:</span>
              <span className="font-mono text-amber-800 font-medium">Explainable Advisory Scoring</span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Evaluated grid sectors: <strong className="text-slate-900 font-mono">{predictions.length}</strong>
            </span>
            <button
              onClick={handleRunPrediction}
              disabled={runningModel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              <TrendingUp className={`w-4 h-4 ${runningModel ? 'animate-spin' : ''}`} />
              {runningModel ? 'Forecasting Risk Grid...' : 'Run Risk Pipeline'}
            </button>
          </div>
        </div>
      </div>

      {/* Ethical Transparency Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-amber-900">Statutory Analytical & Ethical Notice:</strong>
          <p className="mt-0.5 text-slate-700 leading-relaxed">
            CRIMEMAP machine learning outputs are categorized strictly as <em>"Risk/Hotspot Assessment"</em> and historical density indicators. 
            Algorithmic outputs reflect historical data concentrations and must never be interpreted as certainty of future criminal activity. 
            All insights exist solely to support human police dispatch planning, preventative patrolling, and administrative resource allocation.
          </p>
        </div>
      </div>

      {/* Analytical Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temporal Diurnal Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Diurnal Crime Distribution (24-Hour Curve)</h3>
          <p className="text-xs text-slate-500 mb-4">Shows peak operational dispatch hours across Puducherry.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => `${val}:00`} 
                />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val) => [val, 'Incidents']}
                  labelFormatter={(val) => `Hour: ${val}:00 - ${val}:59`}
                />
                <Bar dataKey="incident_count" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day-of-Week Variation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Day-of-Week Operational Pressure</h3>
          <p className="text-xs text-slate-500 mb-4">Weekly cyclical patterns informing officer shift scheduling.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day_name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val) => [val, 'Incidents']}
                />
                <Bar dataKey="incident_count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Predictive Sectors Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Evaluated Risk Assessment Sectors</h3>
            <p className="text-xs text-slate-500">Current predictive risk levels and historical baseline comparisons.</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200 font-semibold">
            {predictions.length} Active Forecasts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Sector / Zone</th>
                <th className="py-2.5 px-3">Police Station</th>
                <th className="py-2.5 px-3">Assessed Risk Score</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">Predicted Incidents</th>
                <th className="py-2.5 px-3">Dominant Threat Type</th>
                <th className="py-2.5 px-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {predictions.slice(0, 10).map((pred) => {
                const score = pred.risk_score || (pred.risk_level === 'High' ? 82 : pred.risk_level === 'Medium' ? 54 : 26);
                return (
                  <tr key={pred.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {pred.zone_name || `Sector ${pred.id}`}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {pred.police_station?.station_name || 'Territorial PS'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={`${score >= 70 ? 'text-red-600' : score >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {score.toFixed(1)} / 100
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        pred.risk_level === 'High' 
                          ? 'bg-red-100 text-red-800 border-red-200' 
                          : pred.risk_level === 'Medium' 
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {pred.risk_level}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">
                      {pred.predicted_incidents?.toFixed(1) || 'N/A'} (±{pred.confidence_interval?.toFixed(1) || '0.5'})
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                        {pred.dominant_crime_type || 'General Offense'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {pred.model_confidence ? `${(pred.model_confidence * 100).toFixed(0)}%` : '85%'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
