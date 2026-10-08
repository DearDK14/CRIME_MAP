import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const getSeverityBadge = (severity) => {
  switch (severity) {
    case 'Critical':
      return { dot: 'bg-red-600', badge: 'bg-red-100 text-red-800 border-red-300' };
    case 'High':
      return { dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800 border-orange-300' };
    case 'Medium':
      return { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'Low':
      return { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    default:
      return { dot: 'bg-blue-600', badge: 'bg-blue-100 text-blue-800 border-blue-300' };
  }
};

export default function RecentIncidentsPanel({ incidents = [], onSelectIncident = null }) {
  // Take top 6 most recent
  const recentList = incidents.slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 select-none">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            RECENT INCIDENTS
          </h3>
          <p className="text-[10px] text-slate-500">Live operational feed from Puducherry police logs</p>
        </div>
        <Link
          to="/incidents"
          className="text-[11px] font-mono text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-0.5"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100 mt-1 max-h-[310px] overflow-y-auto pr-1">
        {recentList.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-mono">
            No recent incidents matching filters
          </div>
        ) : (
          recentList.map((inc) => {
            const crimeName = inc.crime_type?.name || inc.crime_type || 'General Offense';
            const station = inc.police_station?.station_name || inc.police_station?.name || inc.police_station || 'Territorial PS';
            const severity = inc.severity || 'Medium';
            const badge = getSeverityBadge(severity);
            const dateStr = inc.incident_time ? inc.incident_time.slice(0, 5) : '12:00';
            const dayStr = inc.incident_date || 'Today';

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident && onSelectIncident(inc)}
                className="py-2 px-1 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-2 group"
                title="Click to locate on Map"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${badge.dot}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                      {crimeName}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                      <span>{dayStr} • {dateStr}</span>
                      <span>•</span>
                      <span className="truncate text-slate-600 font-sans">{station}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${badge.badge}`}>
                    {severity}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
