import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export default function StationChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2" />
        Loading Station Workload...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
        No station metrics available.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="station_name"
            stroke="#94a3b8"
            tick={{ fontSize: 8, fontFamily: 'monospace', fill: '#334155' }}
            angle={-25}
            textAnchor="end"
            interval={0}
          />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#64748b' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#cbd5e1',
              borderRadius: '0.375rem',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#0f172a',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '16px' }} />
          <Bar dataKey="count" name="Total Cases" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="high_severity" name="High Severity" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
