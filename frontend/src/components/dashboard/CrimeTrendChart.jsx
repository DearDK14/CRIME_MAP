import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export default function CrimeTrendChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2" />
        Loading Crime Trend...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
        No incident trend data available for current selection.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#64748b' }}
            tickFormatter={(val) => (val ? val.slice(5) : '')} // MM-DD
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
          <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
          <Line
            type="monotone"
            dataKey="count"
            name="Total Incidents"
            stroke="#1d4ed8"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="high_severity"
            name="High/Critical Severity"
            stroke="#dc2626"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
