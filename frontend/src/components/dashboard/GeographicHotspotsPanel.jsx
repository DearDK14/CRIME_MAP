import React from 'react';
import { Flame, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const getRiskColor = (score) => {
  if (score >= 75) return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', badge: 'VERY HIGH' };
  if (score >= 50) return { text: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300', badge: 'HIGH' };
  if (score >= 25) return { text: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300', badge: 'MODERATE' };
  return { text: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', badge: 'LOW' };
};

export default function GeographicHotspotsPanel({ hotspots = [], loading = false, onSelectHotspot = null }) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mr-2" />
        Evaluating Active Hotspots...
      </div>
    );
  }

  const topHotspots = [...hotspots].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 5);

  return (
    <div className="h-64 flex flex-col justify-between">
      <div className="space-y-2 overflow-y-auto pr-1">
        {topHotspots.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-slate-400 text-xs font-mono">
            No active hotspots detected for current filters.
          </div>
        ) : (
          topHotspots.map((hs) => {
            const score = hs.risk_score != null ? hs.risk_score : 55.0;
            const style = getRiskColor(score);
            return (
              <div
                key={hs.id}
                onClick={() => onSelectHotspot && onSelectHotspot(hs)}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/70 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Flame className={`w-3.5 h-3.5 shrink-0 ${style.text}`} />
                    <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 truncate">
                      {hs.cluster_label || `Cluster Sector #${hs.id}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                    <span>{hs.incident_count || 10} Incidents</span>
                    <span>•</span>
                    <span className="truncate">{hs.dominant_crime_type || 'Property & Theft'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-xs font-mono font-bold ${style.text}`}>
                    {score.toFixed(1)} <span className="text-[9px] text-slate-400">/ 100</span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.border} ${style.text}`}>
                    {style.badge}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-500">Active Clusters: <strong className="text-slate-900">{hotspots.length}</strong></span>
        <Link to="/hotspots" className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-0.5">
          <span>Explore All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
