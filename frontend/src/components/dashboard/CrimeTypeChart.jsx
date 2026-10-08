import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

const BAR_COLORS = [
  '#1d4ed8', // Deep Gov Blue
  '#0284c7', // Light Blue
  '#4338ca', // Indigo Navy
  '#0d9488', // Teal
  '#475569', // Slate Grey
  '#2563eb', // Royal Blue
  '#0891b2', // Cyan
  '#64748b', // Light Slate
];

export default function CrimeTypeChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2" />
        Loading Crime Types...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
        No category data available.
      </div>
    );
  }

  // Display top 8 categories
  const displayData = data.slice(0, 8);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={displayData}
          layout="vertical"
          margin={{ top: 5, right: 25, left: 35, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#64748b' }} />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#94a3b8"
            tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#334155' }}
            width={90}
          />
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
            formatter={(value, name, item) => [
              `${value} cases (${item.payload.percentage || 0}%)`,
              'Incidents',
            ]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
