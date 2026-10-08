import React, { useEffect, useRef, useState } from 'react';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { 
  RotateCcw, 
  Sliders, 
  Shield, 
  Flame, 
  Compass
} from 'lucide-react';

const PUDUCHERRY_CENTER = [79.8145, 11.9139]; // [lon, lat]

// High-visibility tactical heat gradient (Green/Cyan -> Yellow -> Orange -> Crimson Red)
const HEAT_COLOR_RANGE = [
  [16, 185, 129, 200],   // Emerald Green (Low)
  [2, 132, 199, 220],    // Light Blue
  [234, 179, 8, 230],    // Yellow
  [249, 115, 22, 240],   // Orange
  [239, 68, 68, 250],    // Red
  [185, 28, 28, 255],    // Crimson Red (Critical)
];

// Open, free tile styles without API keys
const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  osm: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
};

export default function DeckGL3DMap({
  incidents = [],
  stations = [],
  hotspots = [],
  onIncidentClick,
  className = '',
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

  // 3D Visual Parameters
  const [elevationScale, setElevationScale] = useState(25);
  const [hexRadius, setHexRadius] = useState(180);
  const [showStations, setShowStations] = useState(true);
  const [styleMode, setStyleMode] = useState('dark');
  const [hoverInfo, setHoverInfo] = useState(null);
  const [cameraState, setCameraState] = useState({ pitch: 50, bearing: -15, zoom: 12.5 });

  // Initialize MapLibre & DeckGL Overlay
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[styleMode],
      center: PUDUCHERRY_CENTER,
      zoom: 12.5,
      pitch: 50,
      bearing: -15,
      antialias: true,
      maxPitch: 75,
    });

    const overlay = new MapboxOverlay({
      interleaved: false,
      layers: [],
    });

    map.addControl(overlay);
    mapRef.current = map;
    overlayRef.current = overlay;

    map.on('rotate', () => {
      setCameraState((prev) => ({
        ...prev,
        pitch: Math.round(map.getPitch()),
        bearing: Math.round(map.getBearing()),
      }));
    });

    map.on('zoom', () => {
      setCameraState((prev) => ({
        ...prev,
        zoom: parseFloat(map.getZoom().toFixed(1)),
      }));
    });

    return () => {
      if (overlayRef.current) {
        map.removeControl(overlayRef.current);
      }
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, [styleMode]);

  // Update DeckGL layers whenever incidents, stations, or parameters change
  useEffect(() => {
    if (!overlayRef.current) return;

    // Filter valid incident coordinates
    const validIncidents = incidents.filter(
      (inc) =>
        (inc.longitude || inc.lon) &&
        (inc.latitude || inc.lat) &&
        !isNaN(Number(inc.longitude || inc.lon)) &&
        !isNaN(Number(inc.latitude || inc.lat))
    );

    const validHotspots = hotspots.map(h => ({
      ...h,
      lat: h.center_lat ?? h.latitude ?? h.lat,
      lon: h.center_lon ?? h.longitude ?? h.lon,
      score: h.risk_score != null ? h.risk_score : 65.0
    })).filter(h => h.lat && h.lon && !isNaN(Number(h.lat)) && !isNaN(Number(h.lon)));

    const layers = [
      // 1. 3D Extruded Hexagon Crime Density Layer
      new HexagonLayer({
        id: 'deck-crime-hexagons-3d',
        data: validIncidents,
        getPosition: (d) => [Number(d.longitude || d.lon), Number(d.latitude || d.lat)],
        radius: hexRadius,
        elevationScale: elevationScale,
        elevationRange: [0, 1500],
        extruded: true,
        pickable: true,
        colorRange: HEAT_COLOR_RANGE,
        coverage: 0.92,
        opacity: 0.88,
        upperPercentile: 100,
        material: {
          ambient: 0.65,
          diffuse: 0.85,
          shininess: 45,
          specularColor: [255, 255, 255],
        },
        onHover: (info) => {
          if (info.object) {
            setHoverInfo({
              x: info.x,
              y: info.y,
              type: 'hexagon',
              count: info.object.points?.length || 0,
              coords: info.coordinate,
            });
          } else {
            setHoverInfo(null);
          }
        },
      }),

      // 2. Spatial Hotspot Risk Envelopes
      new ScatterplotLayer({
        id: 'deck-hotspots-layer',
        data: validHotspots,
        getPosition: (d) => [Number(d.lon), Number(d.lat)],
        getFillColor: (d) => d.score >= 70 ? [239, 68, 68, 120] : d.score >= 50 ? [249, 115, 22, 100] : [245, 158, 11, 80],
        getLineColor: (d) => d.score >= 70 ? [220, 38, 38, 255] : d.score >= 50 ? [234, 88, 12, 255] : [217, 119, 6, 255],
        getRadius: (d) => Math.min(Math.max(d.radius_meters || 350, 180), 550),
        lineWidthMinPixels: 2,
        stroked: true,
        pickable: true,
        onHover: (info) => {
          if (info.object) {
            setHoverInfo({
              x: info.x,
              y: info.y,
              type: 'hotspot',
              hotspot: info.object,
            });
          } else {
            setHoverInfo(null);
          }
        },
      }),

      // 3. High-Performance Police Station Posts (Glowing Scatterplot)
      showStations &&
        new ScatterplotLayer({
          id: 'deck-stations-layer',
          data: stations.filter((s) => s.latitude && s.longitude),
          getPosition: (d) => [Number(d.longitude), Number(d.latitude)],
          getFillColor: [15, 43, 72, 230], // Deep Government Blue
          getLineColor: [2, 132, 199, 255], // Light Blue Outline
          getRadius: 160,
          lineWidthMinPixels: 2,
          stroked: true,
          pickable: true,
          onHover: (info) => {
            if (info.object) {
              setHoverInfo({
                x: info.x,
                y: info.y,
                type: 'station',
                station: info.object,
              });
            } else {
              setHoverInfo(null);
            }
          },
        }),
    ].filter(Boolean);

    overlayRef.current.setProps({ layers });
  }, [incidents, stations, hotspots, elevationScale, hexRadius, showStations]);

  // Camera Reset
  const handleResetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: PUDUCHERRY_CENTER,
      zoom: 12.5,
      pitch: 50,
      bearing: -15,
      essential: true,
    });
  };

  const handleTopDownView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      pitch: 0,
      bearing: 0,
      essential: true,
    });
  };

  return (
    <div className={`relative w-full h-full bg-[#0a192f] overflow-hidden select-none ${className}`}>
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Tactical WebGL Header */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-lg shadow-md text-xs font-mono">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
        </span>
        <span className="text-slate-900 font-bold tracking-wider">ENGINE: DECK.GL + MAPLIBRE (WEBGL)</span>
        <span className="text-slate-300">|</span>
        <span className="text-blue-700 font-semibold">{incidents.length} Hex Aggregates</span>
      </div>

      {/* Floating 3D Parameter Controls */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-lg text-xs font-mono space-y-3 w-56 text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-slate-900 font-bold">
          <span className="flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-700" />
            <span>3D Controls</span>
          </span>
          <span className="text-[10px] text-slate-500 font-sans">GPU Mode</span>
        </div>

        {/* Elevation Extrusion Scale */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>Elevation:</span>
            <span className="text-slate-900 font-bold">{elevationScale}x</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            value={elevationScale}
            onChange={(e) => setElevationScale(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
          />
        </div>

        {/* Hexagon Radius */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>Hex Radius:</span>
            <span className="text-slate-900 font-bold">{hexRadius}m</span>
          </div>
          <input
            type="range"
            min="80"
            max="400"
            step="20"
            value={hexRadius}
            onChange={(e) => setHexRadius(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* Toggles */}
        <div className="pt-1 border-t border-slate-100 space-y-1.5">
          <label className="flex items-center justify-between text-[11px] text-slate-700 cursor-pointer">
            <span className="flex items-center space-x-1.5">
              <Shield className="w-3 h-3 text-blue-700" />
              <span>Station Posts</span>
            </span>
            <input
              type="checkbox"
              checked={showStations}
              onChange={(e) => setShowStations(e.target.checked)}
              className="accent-blue-700 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Camera Quick Buttons */}
        <div className="pt-1 border-t border-slate-100 flex items-center gap-1.5">
          <button
            onClick={handleResetView}
            className="flex-1 py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center space-x-1 transition-colors border border-slate-200"
            title="Reset 3D Perspective"
          >
            <RotateCcw className="w-3 h-3" />
            <span>3D Reset</span>
          </button>
          <button
            onClick={handleTopDownView}
            className="flex-1 py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center space-x-1 transition-colors border border-slate-200"
            title="Top-down 2D View"
          >
            <Compass className="w-3 h-3" />
            <span>Top View</span>
          </button>
        </div>
      </div>

      {/* Floating Telemetry Badge (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm border border-slate-200 px-2.5 py-1 rounded text-[10px] font-mono text-slate-600 flex items-center space-x-2 shadow-sm">
        <span>Pitch: <strong className="text-slate-900">{cameraState.pitch}°</strong></span>
        <span>•</span>
        <span>Bearing: <strong className="text-slate-900">{cameraState.bearing}°</strong></span>
        <span>•</span>
        <span>Zoom: <strong className="text-slate-900">{cameraState.zoom}</strong></span>
      </div>

      {/* Floating 3D Legend (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-2.5 shadow-md text-[10px] font-mono text-slate-700 space-y-1.5">
        <div className="font-bold text-slate-900 text-[11px] flex items-center space-x-1">
          <Flame className="w-3.5 h-3.5 text-red-600" />
          <span>Hexagon Density Scale</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-emerald-700 font-semibold text-[9px]">Low</span>
          <div className="flex h-2.5 w-28 rounded overflow-hidden border border-slate-200">
            <span className="flex-1 bg-[#10b981]" />
            <span className="flex-1 bg-[#0284c7]" />
            <span className="flex-1 bg-[#eab308]" />
            <span className="flex-1 bg-[#f97316]" />
            <span className="flex-1 bg-[#ef4444]" />
            <span className="flex-1 bg-[#b91c1c]" />
          </div>
          <span className="text-red-700 font-bold text-[9px]">Critical</span>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoverInfo && (
        <div
          style={{ left: hoverInfo.x + 12, top: hoverInfo.y + 12 }}
          className="absolute z-20 pointer-events-none bg-white border border-slate-200 p-2.5 rounded-lg shadow-xl text-xs font-mono text-slate-900 animate-in fade-in-50"
        >
          {hoverInfo.type === 'hexagon' && (
            <div>
              <div className="text-[10px] text-blue-700 font-bold uppercase">3D Crime Density Cluster</div>
              <div className="text-sm font-bold text-slate-900">{hoverInfo.count} Incident Cases</div>
              {hoverInfo.coords && (
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Lat: {hoverInfo.coords[1]?.toFixed(4)} | Lon: {hoverInfo.coords[0]?.toFixed(4)}
                </div>
              )}
            </div>
          )}
          {hoverInfo.type === 'hotspot' && (
            <div>
              <div className="text-[10px] text-amber-600 font-bold uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-600" />
                <span>Hotspot Risk Sector</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{hoverInfo.hotspot.cluster_label || `Hotspot #${hoverInfo.hotspot.id}`}</div>
              <div className="text-[11px] text-slate-700 mt-0.5">
                Risk Score: <strong className="text-red-600">{Number(hoverInfo.hotspot.score).toFixed(1)} / 100</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                Cases: {hoverInfo.hotspot.incident_count} • Primary: {hoverInfo.hotspot.primary_crime_type}
              </div>
            </div>
          )}
          {hoverInfo.type === 'station' && (
            <div>
              <div className="text-[10px] text-blue-700 font-bold uppercase">Police Station Post</div>
              <div className="text-sm font-bold text-slate-900">{hoverInfo.station.name}</div>
              <div className="text-[10px] text-slate-500">{hoverInfo.station.jurisdiction_area}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
