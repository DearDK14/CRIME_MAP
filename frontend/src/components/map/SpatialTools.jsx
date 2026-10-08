import React, { useState } from 'react';
import { mapAPI } from '../../services/api';
import { Target, Search, Navigation, X, Shield } from 'lucide-react';

export default function SpatialTools({ onRadiusResult, onClearSpatial, onCenterLocation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('radius'); // 'radius' or 'station'
  const [lat, setLat] = useState('11.9365');
  const [lon, setLon] = useState('79.8322');
  const [radiusMeters, setRadiusMeters] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [stationResult, setStationResult] = useState(null);
  const [matchedCount, setMatchedCount] = useState(null);

  const handleRadiusSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStationResult(null);
    try {
      const resp = await mapAPI.spatialQuery({
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        radius_meters: parseFloat(radiusMeters),
      });
      setMatchedCount(resp.data.matched_count);
      if (onRadiusResult) {
        onRadiusResult({
          center: [parseFloat(lat), parseFloat(lon)],
          radius: parseFloat(radiusMeters),
          geojson: resp.data.geojson,
        });
      }
      if (onCenterLocation) {
        onCenterLocation([parseFloat(lat), parseFloat(lon)], 14);
      }
    } catch (err) {
      console.error("Spatial radius query failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNearestStation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMatchedCount(null);
    try {
      const resp = await mapAPI.getNearbyStation(parseFloat(lat), parseFloat(lon));
      setStationResult(resp.data);
      if (onCenterLocation) {
        onCenterLocation([resp.data.latitude, resp.data.longitude], 15);
      }
    } catch (err) {
      console.error("Nearest station search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMatchedCount(null);
    setStationResult(null);
    if (onClearSpatial) onClearSpatial();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-white hover:bg-slate-50 text-blue-700 py-2 px-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between text-xs font-semibold font-mono transition-colors"
        title="Open GIS Spatial Analysis Tools"
      >
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-blue-700" />
          <span>GIS SPATIAL SEARCH TOOLS</span>
        </div>
        <span className="text-[10px] text-slate-500 font-sans">Radius • Proximity</span>
      </button>
    );
  }

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-slate-800 text-xs select-none">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 font-bold">
        <div className="flex items-center space-x-2 text-blue-800 font-mono text-xs">
          <Target className="w-4 h-4 text-blue-700" />
          <span>GIS SPATIAL SEARCH &amp; BUFFER</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-700 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 mb-3 bg-slate-100 p-0.5 rounded-lg border border-slate-200 font-mono text-[11px]">
        <button
          onClick={() => setMode('radius')}
          className={`py-1 rounded-md text-center transition-colors ${
            mode === 'radius' ? 'bg-white text-blue-900 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Radius Buffer
        </button>
        <button
          onClick={() => setMode('station')}
          className={`py-1 rounded-md text-center transition-colors ${
            mode === 'station' ? 'bg-white text-blue-900 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Nearest Station
        </button>
      </div>

      <form onSubmit={mode === 'radius' ? handleRadiusSearch : handleNearestStation} className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 font-mono block mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
              required
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-mono block mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
              required
            />
          </div>
        </div>

        {mode === 'radius' && (
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <label className="text-[10px] text-slate-500 font-mono">Radius Buffer</label>
              <span className="text-[10px] text-blue-700 font-mono font-bold">{radiusMeters}m</span>
            </div>
            <input
              type="range"
              min="200"
              max="5000"
              step="100"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        )}

        <div className="flex space-x-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
          >
            {mode === 'radius' ? <Search className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
            <span>{loading ? 'Calculating...' : mode === 'radius' ? 'Query Buffer' : 'Find Station'}</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg font-mono text-xs border border-slate-200"
            title="Clear spatial query overlay"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Results Box */}
      {matchedCount !== null && (
        <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg font-mono text-[11px] text-blue-900">
          <div className="font-bold flex items-center justify-between">
            <span>Incidents Inside Buffer:</span>
            <span className="text-white bg-blue-700 px-2 py-0.5 rounded font-bold text-xs">
              {matchedCount}
            </span>
          </div>
          <p className="text-[10px] text-blue-700 mt-1">
            Spatial radius: {radiusMeters}m from ({lat}, {lon})
          </p>
        </div>
      )}

      {stationResult && (
        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 space-y-1">
          <div className="flex items-center space-x-1.5 text-blue-800 font-bold">
            <Shield className="w-3.5 h-3.5 text-blue-700" />
            <span>{stationResult.station_name}</span>
          </div>
          <div className="text-[10px] text-slate-600">
            Distance: <span className="text-slate-900 font-bold">{stationResult.distance_meters} meters</span>
          </div>
          <div className="text-[10px] text-slate-600">
            Officer: {stationResult.officer_in_charge || 'N/A'}
          </div>
          <div className="text-[10px] text-slate-600">
            Tel: {stationResult.contact_number || 'N/A'}
          </div>
        </div>
      )}
    </div>
  );
}
