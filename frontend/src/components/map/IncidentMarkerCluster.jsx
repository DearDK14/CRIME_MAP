import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Severity color palette
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'Critical':
      return '#ef4444'; // Red
    case 'High':
      return '#f97316'; // Orange-Red
    case 'Medium':
      return '#f59e0b'; // Amber
    case 'Low':
      return '#10b981'; // Emerald
    default:
      return '#3b82f6'; // Blue
  }
};

const createIncidentPin = (severity) => {
  const color = getSeverityColor(severity);
  const isCritical = severity === 'Critical';
  return L.divIcon({
    className: 'custom-incident-pin',
    html: `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 22px; height: 22px; border-radius: 9999px; background-color: ${color}; opacity: ${isCritical ? '0.45' : '0.22'}; ${isCritical ? 'animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}"></span>
        <span style="width: ${isCritical ? '12px' : '10px'}; height: ${isCritical ? '12px' : '10px'}; border-radius: 9999px; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.35);"></span>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
};

export default function IncidentMarkerCluster({ incidents = [], onIncidentClick = null }) {
  const map = useMap();
  const clusterGroupRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Initialize Leaflet MarkerClusterGroup with Smart Severity Detection
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const markers = cluster.getAllChildMarkers();
        const count = cluster.getChildCount();
        const criticalCount = markers.filter((m) => m.options?.incidentData?.severity === 'Critical').length;
        const highCount = markers.filter((m) => m.options?.incidentData?.severity === 'High').length;

        let bg = '#1d4ed8'; // Default Government Blue
        let borderColor = '#ffffff';
        let extraBadge = '';

        if (criticalCount > 0) {
          bg = '#dc2626'; // Red for clusters containing Critical cases
          borderColor = '#fecaca';
          extraBadge = `
            <span style="position: absolute; top: -5px; right: -5px; background: #991b1b; border: 1.5px solid #ffffff; color: #ffffff; border-radius: 9999px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" title="${criticalCount} Critical cases in cluster">
              !
            </span>
          `;
        } else if (highCount > 0) {
          bg = '#ea580c'; // Orange for clusters with High cases
          borderColor = '#fed7aa';
        } else if (count >= 20) {
          bg = '#d97706'; // Amber for larger clusters
          borderColor = '#fde68a';
        }

        return L.divIcon({
          html: `
            <div style="position: relative; background: ${bg}; width: 34px; height: 34px; border-radius: 50%; border: 2.5px solid ${borderColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: bold; font-size: 11px; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">
              <span>${count}</span>
              ${extraBadge}
            </div>
          `,
          className: 'incident-cluster-bubble',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
      },
    });

    clusterGroupRef.current = clusterGroup;

    // Populate markers
    incidents.forEach((inc) => {
      const lat = inc.latitude || inc.lat;
      const lon = inc.longitude || inc.lon;
      if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return;

      const marker = L.marker([lat, lon], {
        icon: createIncidentPin(inc.severity),
        incidentData: inc,
      });

      const dateStr = inc.incident_date 
        ? new Date(inc.incident_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : (inc.date || 'N/A');
        
      const timeStr = inc.incident_date
        ? new Date(inc.incident_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        : (inc.time || 'N/A');

      const crimeType = inc.crime_type?.name || inc.crime_type || 'Unspecified Crime';
      const station = inc.police_station?.station_name || inc.police_station || 'Territorial PS';
      const severity = inc.severity || 'Medium';
      const status = inc.status || 'Under Investigation';
      const caseId = inc.case_id || inc.case_number || `CASE-${inc.id}`;
      const address = inc.address || 'Puducherry Jurisdiction';

      const sevColor = getSeverityColor(severity);

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; min-width: 220px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <span style="font-family: monospace; font-weight: bold; color: #64748b; font-size: 11px;">${caseId}</span>
            <span style="background: ${sevColor}18; color: ${sevColor}; border: 1px solid ${sevColor}55; padding: 1px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">${severity}</span>
          </div>
          <div style="font-size: 13px; font-weight: bold; color: #1e3a8a; margin-bottom: 4px;">${crimeType}</div>
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 8px; font-size: 11px; color: #334155; margin-bottom: 6px;">
            <span style="color: #64748b;">Date:</span><span style="font-family: monospace;">${dateStr}</span>
            <span style="color: #64748b;">Time:</span><span style="font-family: monospace;">${timeStr}</span>
            <span style="color: #64748b;">Station:</span><span>${station}</span>
            <span style="color: #64748b;">Status:</span><span style="color: #059669; font-weight: 600;">${status}</span>
          </div>
          <div style="font-size: 10px; color: #475569; background: #f8fafc; padding: 4px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
            📍 ${address}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-crimemap-popup',
        maxWidth: 280,
      });

      marker.on('click', () => {
        if (onIncidentClick) {
          onIncidentClick(inc);
        }
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, incidents, onIncidentClick]);

  return null;
}
