import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function HourlyChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2" />
        Loading Diurnal Curve...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
        No diurnal distribution data available.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="hourColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="hour_label"
            stroke="#64748b"
            tick={{ fontSize: 9, fontFamily: 'monospace' }}
            interval={2}
          />
          <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '0.375rem',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#0f172a',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value) => [`${value} incidents`, 'Hourly Volume']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#1d4ed8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#hourColor)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
