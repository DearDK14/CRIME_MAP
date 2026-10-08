import React from 'react';
import { Shield, Flame } from 'lucide-react';

export default function MapLegend() {
  return (
    <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md text-slate-800 text-xs w-64 select-none">
      <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500 font-mono mb-2 flex items-center justify-between">
        <span>MAP INTELLIGENCE LEGEND</span>
      </div>

      {/* Crime Severities */}
      <div className="mb-3">
        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Crime Incident Severity</div>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm" />
            <span className="text-slate-700">Critical</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
            <span className="text-slate-700">High</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
            <span className="text-slate-700">Medium</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-slate-700">Low</span>
          </div>
        </div>
      </div>

      {/* ML Hotspot Risk Scores */}
      <div className="mb-3 border-t border-slate-100 pt-2">
        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1 flex items-center space-x-1">
          <Flame className="w-3 h-3 text-amber-600" />
          <span>Hotspot Risk Assessment</span>
        </div>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-100 border border-red-400" />
              <span className="text-slate-700">Very High (75–100)</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-orange-100 border border-orange-400" />
              <span className="text-slate-700">High (50–74)</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-400" />
              <span className="text-slate-700">Moderate (25–49)</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-400" />
              <span className="text-slate-700">Low (0–24)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stations */}
      <div className="border-t border-slate-100 pt-2">
        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
          <span className="w-3.5 h-3.5 rounded bg-blue-700 text-white flex items-center justify-center text-[9px] font-bold">
            <Shield className="w-2.5 h-2.5" />
          </span>
          <span className="text-slate-700">Police Station HQ</span>
        </div>
      </div>
    </div>
  );
}
