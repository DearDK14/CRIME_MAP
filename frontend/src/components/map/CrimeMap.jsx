import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import IncidentMarkerCluster from './IncidentMarkerCluster';
import MapLegend from './MapLegend';
import {
  Layers,
  Flame,
  Shield,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
  Navigation,
  Crosshair,
  Map as MapIcon,
  Globe,
  Moon,
  Compass,
  AlertTriangle,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// Default Puducherry Coordinates as requested: 11.9139, 79.8145
const DEFAULT_CENTER = [11.9139, 79.8145];
const DEFAULT_ZOOM = 13;

// Police Station Custom Icon
const stationIcon = L.divIcon({
  className: 'custom-station-pin',
  html: `
    <div style="background: #1e3a8a; border: 2px solid #ffffff; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.6);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#60a5fa" stroke="#ffffff" stroke-width="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
});

// Custom DivIcon for Hotspot Risk Centroids
const createHotspotRiskPin = (score, category, label) => {
  const style = getRiskStyle(score);
  return L.divIcon({
    className: 'custom-hotspot-risk-pin',
    html: `
      <div style="display: flex; align-items: center; gap: 4px; background: #ffffff; border: 2px solid ${style.color}; border-radius: 20px; padding: 2px 7px 2px 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.18); cursor: pointer; white-space: nowrap; transform: translate(-50%, -50%);">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: ${style.color}; color: #ffffff; font-size: 10px;">
          🔥
        </span>
        <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: ${style.color};">
          ${Math.round(score)}
        </span>
      </div>
    `,
    iconSize: [58, 24],
    iconAnchor: [29, 12],
    popupAnchor: [0, -14],
  });
};

// Custom DivIcon for Predictive Risk Grid Zones
const createRiskGridPin = (score, zoneName) => {
  const style = getRiskStyle(score);
  return L.divIcon({
    className: 'custom-risk-grid-pin',
    html: `
      <div style="display: inline-flex; align-items: center; gap: 3px; background: #ffffff; border: 1.5px solid ${style.color}; border-radius: 6px; padding: 1px 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); font-family: monospace; font-size: 10px; font-weight: bold; color: ${style.color}; transform: translate(-50%, -50%);">
        <span>⚡ ${Math.round(score)}</span>
      </div>
    `,
    iconSize: [48, 20],
    iconAnchor: [24, 10],
    popupAnchor: [0, -12],
  });
};

// Helper for Risk Score Styling
const getRiskStyle = (score) => {
  if (score >= 70) {
    return { label: 'CRITICAL', color: '#dc2626', fill: '#ef4444', opacity: 0.28 };
  } else if (score >= 50) {
    return { label: 'HIGH', color: '#ea580c', fill: '#f97316', opacity: 0.22 };
  } else if (score >= 30) {
    return { label: 'MODERATE', color: '#d97706', fill: '#f59e0b', opacity: 0.18 };
  } else {
    return { label: 'LOW', color: '#059669', fill: '#10b981', opacity: 0.14 };
  }
};

// Map Controller for dynamic actions (fit bounds, fly to, scale)
function MapController({ 
  center, 
  zoom, 
  boundsToFit, 
  onBoundsFitted 
}) {
  const map = useMap();

  useEffect(() => {
    // Add metric scale bar at bottom left
    const scale = L.control.scale({ imperial: false, position: 'bottomleft' });
    scale.addTo(map);
    return () => {
      scale.remove();
    };
  }, [map]);

  useEffect(() => {
    if (boundsToFit && boundsToFit.length > 0) {
      try {
        map.fitBounds(boundsToFit, { padding: [50, 50], maxZoom: 15 });
        if (onBoundsFitted) onBoundsFitted();
      } catch (e) {
        console.warn('Bounds fitting error:', e);
      }
    } else if (center) {
      map.flyTo(center, zoom || DEFAULT_ZOOM, { duration: 1.2 });
    }
  }, [center, zoom, boundsToFit, map, onBoundsFitted]);

  return null;
}

export default function CrimeMap({
  incidents = [],
  stations = [],
  hotspots = [],
  predictions = [],
  heatmapPoints = [],
  selectedLocation = null,
  onIncidentClick = null,
  className = "h-full w-full"
}) {
  const containerRef = useRef(null);

  // Basemap Style: 'osm' (OpenStreetMap), 'satellite' (Esri Imagery), 'dark' (Esri Dark Canvas)
  const [baseMapStyle, setBaseMapStyle] = useState('osm');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Layer Toggles - Hotspots & Risk Grid active by default for intelligence visibility
  const [showIncidents, setShowIncidents] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showRiskGrid, setShowRiskGrid] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Map Navigation State
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [boundsToFit, setBoundsToFit] = useState(null);

  // Reset to Puducherry Urban Default
  const handleResetView = () => {
    setBoundsToFit(null);
    setMapCenter([...DEFAULT_CENTER]);
    setMapZoom(DEFAULT_ZOOM);
  };

  // Fit All Incidents
  const handleFitAllIncidents = () => {
    if (!incidents.length) return;
    const pts = incidents
      .filter((i) => (i.latitude || i.lat) && (i.longitude || i.lon))
      .map((i) => [i.latitude || i.lat, i.longitude || i.lon]);
    if (pts.length > 0) {
      setBoundsToFit(pts);
    }
  };

  // Fit Hotspots
  const handleFitHotspots = () => {
    if (!hotspots.length) return;
    const pts = hotspots
      .map((h) => [
        h.center_lat ?? h.latitude ?? h.lat,
        h.center_lon ?? h.longitude ?? h.lon
      ])
      .filter(([lat, lon]) => lat != null && lon != null && !isNaN(lat) && !isNaN(lon));
    if (pts.length > 0) {
      setBoundsToFit(pts);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className} bg-[#f1f5f9] overflow-hidden select-none`}>
      {/* 1. TOP-LEFT: Translucent Glass Toolbar with Layer Toggles */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-md flex items-center gap-1.5 text-xs text-slate-700">
          <div className="flex items-center gap-1 text-blue-800 font-semibold pr-1.5 border-r border-slate-200">
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            <span className="text-[11px] font-mono tracking-wide uppercase">Layers</span>
          </div>

          {/* Incidents Toggle */}
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              showIncidents 
                ? 'bg-blue-700 text-white font-bold shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
            title="Toggle Crime Incidents Markers"
          >
            Incidents ({incidents.length})
          </button>

          {/* Hotspots Toggle */}
          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
              showHotspots 
                ? 'bg-amber-600 text-white font-bold shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
            title="Toggle DBSCAN Hotspot Envelopes & Risk Marks"
          >
            <Flame className="w-3 h-3" />
            <span>Hotspots ({hotspots.length})</span>
          </button>

          {/* Risk Grid Toggle */}
          <button
            onClick={() => setShowRiskGrid(!showRiskGrid)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
              showRiskGrid 
                ? 'bg-red-700 text-white font-bold shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
            title="Toggle ML Predictive Sector Risk Grid"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Risk Grid ({predictions.length})</span>
          </button>

          {/* Stations Toggle */}
          <button
            onClick={() => setShowStations(!showStations)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
              showStations 
                ? 'bg-indigo-700 text-white font-bold shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
            title="Toggle Police Station Posts"
          >
            <Shield className="w-3 h-3" />
            <span>Stations ({stations.length})</span>
          </button>

          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              showHeatmap 
                ? 'bg-[#0f2b48] text-white font-bold shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
            title="Toggle Crime Density Heatmap"
          >
            Heatmap
          </button>
        </div>
      </div>

      {/* 2. TOP-RIGHT: Basemap Style Selector */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-md flex items-center gap-1 text-xs text-slate-700">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase pr-1">
            Map Style:
          </span>
          
          <button
            onClick={() => setBaseMapStyle('osm')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              baseMapStyle === 'osm'
                ? 'bg-blue-700 text-white font-bold shadow-sm'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            title="OpenStreetMap Standard (Free, Complete Geographic Detail)"
          >
            <Globe className="w-3 h-3 text-emerald-600" />
            <span>OpenStreetMap</span>
          </button>

          <button
            onClick={() => setBaseMapStyle('satellite')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              baseMapStyle === 'satellite'
                ? 'bg-blue-700 text-white font-bold shadow-sm'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            title="High-Resolution Satellite Imagery"
          >
            <MapIcon className="w-3 h-3 text-sky-600" />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => setBaseMapStyle('dark')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              baseMapStyle === 'dark'
                ? 'bg-blue-700 text-white font-bold shadow-sm'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            title="Tactical Dark Gray Basemap"
          >
            <Moon className="w-3 h-3 text-slate-600" />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* 3. FLOATING ACTION CONTROLS (Reset View, Fit All, Fullscreen) */}
      <div className="absolute bottom-6 left-3 z-[400] flex flex-col gap-1.5">
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 shadow-md flex flex-col gap-1 text-xs text-slate-700">
          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 transition-colors text-[11px] font-mono"
            title="Reset to Puducherry Urban Center (11.9139, 79.8145)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
            <span>Reset View</span>
          </button>

          <button
            onClick={handleFitAllIncidents}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 transition-colors text-[11px] font-mono"
            title="Fit Map Bounds to All Loaded Incidents"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-700" />
            <span>Fit All Incidents</span>
          </button>

          <button
            onClick={handleFitHotspots}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 transition-colors text-[11px] font-mono"
            title="Fit Map Bounds to Active Hotspots"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Fit Hotspots</span>
          </button>

          <div className="h-px bg-slate-200 my-0.5" />

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 transition-colors text-[11px] font-mono"
            title="Toggle Map Fullscreen View"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-purple-700" /> : <Maximize2 className="w-3.5 h-3.5 text-purple-700" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* 4. BOTTOM-RIGHT: Compact Professional Map Legend */}
      <div className="absolute bottom-6 right-3 z-[400]">
        <MapLegend />
      </div>

      {/* 5. MAIN LEAFLET MAP CONTAINER */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        zoomControl={true}
        className="h-full w-full"
      >
        <MapController
          center={mapCenter}
          zoom={mapZoom}
          boundsToFit={boundsToFit}
          onBoundsFitted={() => setBoundsToFit(null)}
        />

        {/* ==================================================================== */}
        {/* BASEMAP TILE LAYERS (100% Free, Zero API-Key Required, No Watermarks) */}
        {/* ==================================================================== */}
        {baseMapStyle === 'osm' && (
          <TileLayer
            key="osm-tiles"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {baseMapStyle === 'satellite' && (
          <TileLayer
            key="satellite-tiles"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

        {baseMapStyle === 'dark' && (
          <TileLayer
            key="dark-tiles"
            attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />
        )}

        {/* ==================================================================== */}
        {/* LAYER 1: CRIME INCIDENTS (Clusterized via Leaflet MarkerClusterGroup) */}
        {/* ==================================================================== */}
        {showIncidents && (
          <IncidentMarkerCluster
            incidents={incidents}
            onIncidentClick={onIncidentClick}
          />
        )}

        {/* ==================================================================== */}
        {/* LAYER 2: POLICE STATIONS (Clear Police Shield Badge)                */}
        {/* ==================================================================== */}
        {showStations &&
          stations.map((st) => {
            const lat = st.latitude || st.lat;
            const lon = st.longitude || st.lon;
            if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return null;

            return (
              <Marker key={`station-${st.id}`} position={[lat, lon]} icon={stationIcon}>
                <Popup className="custom-crimemap-popup" maxWidth={280}>
                  <div style={{ fontSize: '12px', color: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '6px' }}>
                      <span style={{ background: '#1d4ed8', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>PS HQ</span>
                      <strong style={{ fontSize: '13px', color: '#1e3a8a' }}>{st.station_name || st.name}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 8px', fontSize: '11px', color: '#334155' }}>
                      <span style={{ color: '#64748b' }}>Code:</span><span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{st.station_code || 'PY-PS'}</span>
                      <span style={{ color: '#64748b' }}>Officer:</span><span>{st.officer_in_charge || 'Station Inspector'}</span>
                      <span style={{ color: '#64748b' }}>Contact:</span><span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>{st.contact_number || '+91-413-2334000'}</span>
                      <span style={{ color: '#64748b' }}>Jurisdiction:</span><span>{st.jurisdiction_area || 'Territorial Police Station'}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* ==================================================================== */}
        {/* LAYER 3: HOTSPOTS (Translucent Geometric Buffer + Centroid Risk Pin) */}
        {/* ==================================================================== */}
        {showHotspots &&
          hotspots.map((hs) => {
            const lat = hs.center_lat ?? hs.latitude ?? hs.lat ?? (hs.centroid && hs.centroid[1]);
            const lon = hs.center_lon ?? hs.longitude ?? hs.lon ?? (hs.centroid && hs.centroid[0]);
            if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return null;

            // Clamped radius (meters) so hotspot does not cover entire district
            const radius = Math.min(Math.max(hs.radius_meters || 350, 150), 650);
            const score = hs.risk_score != null ? hs.risk_score : 65.0;
            const style = getRiskStyle(score);
            const clusterLabel = hs.cluster_label || `Hotspot Sector #${hs.id}`;

            return (
              <React.Fragment key={`hotspot-group-${hs.id}`}>
                {/* 3A. Translucent Spatial Buffer Polygon/Circle */}
                <Circle
                  center={[lat, lon]}
                  radius={radius}
                  pathOptions={{
                    color: style.color,
                    fillColor: style.fill,
                    fillOpacity: style.opacity,
                    weight: 2,
                    dashArray: '4, 4',
                  }}
                />

                {/* 3B. High-Visibility Interactive Centroid Risk Mark Pin */}
                <Marker
                  position={[lat, lon]}
                  icon={createHotspotRiskPin(score, hs.risk_category || style.label, clusterLabel)}
                >
                  <Popup className="custom-crimemap-popup" maxWidth={300}>
                    <div style={{ fontSize: '12px', color: '#0f172a', minWidth: '220px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>{clusterLabel}</span>
                        <span style={{ background: `${style.color}18`, color: style.color, border: `1px solid ${style.color}66`, padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                          {hs.risk_category || style.label} RISK
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 8px', fontSize: '11px', color: '#334155', marginBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>Assessed Risk:</span>
                        <strong style={{ color: style.color, fontFamily: 'monospace', fontSize: '13px' }}>{score.toFixed(1)} / 100</strong>
                        <span style={{ color: '#64748b' }}>Crime Volume:</span>
                        <span><strong>{hs.incident_count || 12}</strong> Cases</span>
                        <span style={{ color: '#64748b' }}>Dominant Type:</span>
                        <span style={{ color: '#1d4ed8', fontWeight: '600' }}>{hs.primary_crime_type || hs.dominant_crime_type || 'Property & Theft'}</span>
                        <span style={{ color: '#64748b' }}>Radius:</span>
                        <span>~{Math.round(radius)} meters</span>
                        <span style={{ color: '#64748b' }}>Centroid:</span>
                        <span style={{ fontFamily: 'monospace', color: '#64748b' }}>({lat.toFixed(4)}, {lon.toFixed(4)})</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#92400e', background: '#fef3c7', padding: '4px 6px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                        ⚠️ DBSCAN ML Cluster · Advisory Human Decision-Support Only
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* ==================================================================== */}
        {/* LAYER 4: HISTORICAL RISK GRID (Sector Assessment Cells + Pins)       */}
        {/* ==================================================================== */}
        {showRiskGrid &&
          predictions.map((pred) => {
            const lat = pred.center_lat ?? pred.latitude ?? pred.lat ?? (pred.police_station?.latitude);
            const lon = pred.center_lon ?? pred.longitude ?? pred.lon ?? (pred.police_station?.longitude);
            if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;

            const score = pred.risk_score != null ? pred.risk_score : (pred.risk_level === 'High' ? 78 : pred.risk_level === 'Medium' ? 48 : 22);
            const style = getRiskStyle(score);
            const zoneTitle = pred.zone_name || `Sector ${pred.zone_id || pred.id}`;

            return (
              <React.Fragment key={`risk-grid-group-${pred.id}`}>
                <Circle
                  center={[lat, lon]}
                  radius={420}
                  pathOptions={{
                    color: style.color,
                    fillColor: style.fill,
                    fillOpacity: 0.12,
                    weight: 1.5,
                    dashArray: '2, 4',
                  }}
                />
                <Marker
                  position={[lat, lon]}
                  icon={createRiskGridPin(score, zoneTitle)}
                >
                  <Popup className="custom-crimemap-popup" maxWidth={280}>
                    <div style={{ fontSize: '12px', color: '#0f172a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
                        <span>{zoneTitle}</span>
                        <span style={{ fontSize: '10px', color: style.color, background: `${style.color}15`, padding: '1px 5px', borderRadius: '4px', border: `1px solid ${style.color}40` }}>
                          {pred.risk_category || style.label}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 8px', fontSize: '11px', color: '#334155' }}>
                        <span style={{ color: '#64748b' }}>Assessed Risk:</span>
                        <strong style={{ color: style.color }}>{score.toFixed(1)} / 100</strong>
                        <span style={{ color: '#64748b' }}>Historical Cases:</span>
                        <span>{pred.incident_count_historical || pred.incident_count || 'N/A'} cases</span>
                        <span style={{ color: '#64748b' }}>Severity Index:</span>
                        <span>{pred.severity_weighted_index ? pred.severity_weighted_index.toFixed(2) : '1.45'}</span>
                        <span style={{ color: '#64748b' }}>Model:</span>
                        <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{pred.model_name || 'RandomForest'}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid #f1f5f9', paddingTop: '4px', marginTop: '6px' }}>
                        {pred.disclaimer || 'Advisory pattern risk assessment.'}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* ==================================================================== */}
        {/* LAYER 5: HEATMAP DENSITY CIRCLES                                     */}
        {/* ==================================================================== */}
        {showHeatmap &&
          heatmapPoints.slice(0, 150).map((pt, idx) => {
            const lat = pt.lat || pt[0];
            const lon = pt.lon || pt[1];
            const weight = pt.weight || pt[2] || 0.6;
            if (!lat || !lon) return null;

            return (
              <Circle
                key={`heat-${idx}`}
                center={[lat, lon]}
                radius={220}
                pathOptions={{
                  color: 'transparent',
                  fillColor: weight > 0.7 ? '#ef4444' : weight > 0.4 ? '#f59e0b' : '#3b82f6',
                  fillOpacity: 0.28,
                  weight: 0,
                }}
              />
            );
          })}
      </MapContainer>
    </div>
  );
}
