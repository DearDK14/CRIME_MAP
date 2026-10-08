import React from 'react';
import {
  FileSpreadsheet,
  CalendarDays,
  Clock,
  CalendarRange,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export default function KpiCards({ summary = {}, loading = false }) {
  const cards = [
    {
      title: 'Total Incidents',
      value: summary.total_incidents ?? '...',
      icon: FileSpreadsheet,
      color: 'text-blue-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-900',
      subtext: 'Across all jurisdictions',
    },
    {
      title: "Today's Incidents",
      value: summary.incidents_today ?? '...',
      icon: Clock,
      color: 'text-sky-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-900',
      subtext: 'Reported in last 24h',
    },
    {
      title: 'This Week',
      value: summary.incidents_this_week ?? '...',
      icon: CalendarDays,
      color: 'text-indigo-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-900',
      subtext: 'Current 7-day period',
    },
    {
      title: 'This Month',
      value: summary.incidents_this_month ?? '...',
      icon: CalendarRange,
      color: 'text-blue-800',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-900',
      subtext: 'Calendar month cumulative',
    },
    {
      title: 'High / Critical Severity',
      value: summary.high_severity_incidents ?? '...',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50/40',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      subtext: 'Priority enforcement cases',
    },
    {
      title: 'Active Hotspots',
      value: summary.active_hotspots ?? '...',
      icon: Flame,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/40',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800',
      subtext: 'ML DBSCAN clusters detected',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-3.5 rounded-xl border ${c.borderColor} ${c.bgColor} shadow-sm transition-all hover:translate-y-[-2px]`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 font-medium truncate">{c.title}</span>
              <Icon className={`w-4 h-4 ${c.color} shrink-0`} />
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight ${c.textColor}`}>
              {loading ? (
                <span className="inline-block w-12 h-6 bg-slate-200 animate-pulse rounded" />
              ) : (
                c.value
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 truncate font-mono">
              {c.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
