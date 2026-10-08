import React, { useState, useEffect } from 'react';
import { hotspotsAPI, predictionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  Cpu,
  Play,
  AlertTriangle,
  Compass,
  Sliders,
  CheckCircle,
  BarChart,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HotspotsPage() {
  const { isAdmin, isAnalyst } = useAuth();
  const [hotspots, setHotspots] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningDBSCAN, setRunningDBSCAN] = useState(false);
  const [runningML, setRunningML] = useState(false);

  // Parameters
  const [epsMeters, setEpsMeters] = useState(350);
  const [minSamples, setMinSamples] = useState(4);
  const [modelType, setModelType] = useState('RandomForest');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hsResp, predResp] = await Promise.all([
        hotspotsAPI.getAll(),
        predictionAPI.getResults(),
      ]);
      setHotspots(hsResp.data);
      setPredictions(predResp.data);
    } catch (err) {
      console.error("Hotspots fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunDBSCAN = async () => {
    setRunningDBSCAN(true);
    try {
      const resp = await hotspotsAPI.detect({
        eps_meters: parseFloat(epsMeters),
        min_samples: parseInt(minSamples),
      });
      setHotspots(resp.data);
    } catch (err) {
      console.error("DBSCAN execution error:", err);
      alert("Failed to execute DBSCAN clustering.");
    } finally {
      setRunningDBSCAN(false);
    }
  };

  const handleRunModel = async () => {
    setRunningML(true);
    try {
      const resp = await predictionAPI.run({
        model_type: modelType,
      });
      setModelMetrics(resp.data.metrics);
      // Refresh predictions
      const pResp = await predictionAPI.getResults();
      setPredictions(pResp.data);
    } catch (err) {
      console.error("Model execution error:", err);
      alert("Failed to run prediction pipeline.");
    } finally {
      setRunningML(false);
    }
  };

  const getRiskColor = (cat) => {
    switch (cat) {
      case 'Very High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Moderate':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Flame className="w-5 h-5 text-amber-600" />
            <span>Hotspot & Machine-Learning Risk Assessment</span>
          </h1>
          <p className="text-xs text-slate-500">
            Spatial Clustering (DBSCAN) • Explainable Multi-Factor Risk Scoring (0–100)
          </p>
        </div>

        <Link
          to="/map"
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          <Compass className="w-4 h-4" />
          <span>Inspect on Map</span>
        </Link>
      </div>

      {/* Prominent Ethical Human Verification Notice */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
        <div className="flex items-center space-x-2 font-bold text-amber-800 uppercase tracking-wider text-[11px]">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Decision-Support & Governance Notice</span>
        </div>
        <p className="leading-relaxed">
          The machine-learning pipeline detects areas of relatively higher historical incident density.
          Outputs are strictly designated as <strong>"Hotspot/Risk Assessment"</strong> to assist authorized
          command staff in preventive deployment. The system does <strong>NOT</strong> predict guaranteed future crimes,
          and human verification is mandatory for all operational interventions.
        </p>
      </div>

      {/* Controls Bar for Analysts & Admins */}
      {(isAdmin || isAnalyst) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* DBSCAN Hotspot Detection Engine */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>DBSCAN Spatial Cluster Parameters</span>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                CLUSTERING
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  Epsilon Distance (eps): <strong className="text-slate-900 font-mono">{epsMeters}m</strong>
                </label>
                <input
                  type="range"
                  min="150"
                  max="800"
                  step="25"
                  value={epsMeters}
                  onChange={(e) => setEpsMeters(e.target.value)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  Min Samples per Cluster: <strong className="text-slate-900 font-mono">{minSamples}</strong>
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={minSamples}
                  onChange={(e) => setMinSamples(e.target.value)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleRunDBSCAN}
              disabled={runningDBSCAN}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{runningDBSCAN ? 'Running DBSCAN Pipeline...' : 'Execute Hotspot Detection'}</span>
            </button>
          </div>

          {/* Experimental Zone Predictive Risk Model */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Experimental Short-Term Zone Risk Model</span>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
                PREDICTIVE
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="flex-1">
                <label className="text-[11px] text-slate-600 block mb-1">Model Architecture</label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="RandomForest">Random Forest Regressor</option>
                  <option value="GradientBoosting">Gradient Boosting Regressor</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="text-[11px] text-slate-600 block mb-1">Spatial Grid Tessellation</label>
                <div className="text-slate-800 py-1.5 text-xs font-semibold">6 x 6 Uniform Sectors (36 Zones)</div>
              </div>
            </div>

            <button
              onClick={handleRunModel}
              disabled={runningML}
              className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{runningML ? 'Training & Evaluating...' : 'Run Experimental Risk Model'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Model Performance & Explainability Metrics Card */}
      {modelMetrics && (
        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-blue-800 flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Model Evaluation vs Historical Moving Average Baseline</span>
            </span>
            <span className="text-slate-500 font-mono text-[10px]">Generated: {modelMetrics.generated_at}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 block">Baseline MAE</span>
              <strong className="text-slate-800 font-mono text-sm">{modelMetrics.baseline_mae}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Model MAE</span>
              <strong className="text-emerald-700 font-mono text-sm">{modelMetrics.model_mae}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Relative Gain</span>
              <strong className="text-blue-700 font-mono text-sm">+{modelMetrics.improvement_pct}%</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Zones Evaluated</span>
              <strong className="text-slate-900 font-mono text-sm">{modelMetrics.total_zones_evaluated}</strong>
            </div>
          </div>

          {/* Feature Importances */}
          <div>
            <span className="text-[11px] text-slate-700 block mb-1.5 font-semibold">
              Explainability: Global Feature Importances
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(modelMetrics.feature_importances || {}).map(([feat, imp]) => (
                <div key={feat} className="bg-slate-50 p-2 rounded-md border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 truncate">{feat}:</span>
                  <span className="text-blue-700 font-bold font-mono">{(imp * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detected Hotspots List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <span>Active Detected Hotspots</span>
            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-xs border border-amber-200 font-semibold">
              {hotspots.length} Clusters Active
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mr-2" />
            Analyzing Geospatial Density Clusters...
          </div>
        ) : hotspots.length === 0 ? (
          <div className="py-8 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
            No active spatial clusters detected. Try adjusting DBSCAN epsilon or min samples parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotspots.map((hs) => (
              <div
                key={hs.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-sm space-y-3 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 text-xs">{hs.cluster_label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getRiskColor(hs.risk_category)}`}>
                    {hs.risk_category}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Calculated Risk Score:</span>
                    <span className="font-bold text-slate-900 text-sm bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">
                      {hs.risk_score} / 100
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Incident Concentration:</span>
                    <strong className="text-slate-800">{hs.incident_count} recorded crimes</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Cluster Metric Radius:</span>
                    <span className="font-mono">{hs.radius_meters}m</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Primary Offense Type:</span>
                    <span className="text-blue-700 font-semibold">{hs.primary_crime_type}</span>
                  </div>

                  {hs.temporal_concentration && (
                    <div className="bg-slate-50 p-2 rounded-md border border-slate-200 text-[11px] text-slate-600 space-y-0.5 mt-2">
                      <div>30-Day Velocity: <strong className="text-slate-800">{hs.temporal_concentration.recent_count_30d || 0}</strong> incidents</div>
                      <div>Nocturnal Ratio: <strong className="text-slate-800">{((hs.temporal_concentration.night_ratio || 0) * 100).toFixed(0)}%</strong> at night</div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-mono text-[10px]">
                    Centroid: ({hs.center_lat.toFixed(4)}, {hs.center_lon.toFixed(4)})
                  </span>
                  <Link
                    to="/map"
                    className="flex items-center space-x-1 text-blue-700 hover:text-blue-800 font-semibold"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
