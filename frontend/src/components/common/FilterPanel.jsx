import React, { useState, useEffect } from 'react';
import { crimeTypesAPI, stationsAPI } from '../../services/api';
import { Filter, RotateCcw, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function FilterPanel({ filters, onFilterChange, onReset, onApply }) {
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [stations, setStations] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [ctResp, stResp] = await Promise.all([
          crimeTypesAPI.getAll(),
          stationsAPI.getAll(),
        ]);
        setCrimeTypes(ctResp.data);
        setStations(stResp.data);
      } catch (err) {
        console.error("Filter catalog fetch error:", err);
      }
    };
    loadCatalog();
  }, []);

  const handleChange = (key, value) => {
    onFilterChange(key, value);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 text-xs select-none">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2 text-slate-800 font-bold font-mono">
          <Filter className="w-3.5 h-3.5 text-blue-700" />
          <span>CRIME FILTER PARAMETERS</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-3">
          {/* Crime Type */}
          <div>
            <label className="text-[10px] text-slate-500 font-mono block mb-1">Crime Type</label>
            <select
              value={filters.crime_type_id || ''}
              onChange={(e) => handleChange('crime_type_id', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="">All Crime Types</option>
              {crimeTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="text-[10px] text-slate-500 font-mono block mb-1">Severity</label>
            <select
              value={filters.severity || ''}
              onChange={(e) => handleChange('severity', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Police Station */}
          <div>
            <label className="text-[10px] text-slate-500 font-mono block mb-1">Police Station</label>
            <select
              value={filters.police_station_id || ''}
              onChange={(e) => handleChange('police_station_id', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="">All Stations</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="text-[10px] text-slate-500 font-mono block mb-1">Date From</label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleChange('date_from', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-xs font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="text-[10px] text-slate-500 font-mono block mb-1">Date To</label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleChange('date_to', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-xs font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] text-slate-500 font-mono block mb-1">Case Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Charges Filed">Charges Filed</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100">
        <div className="flex items-center space-x-2 flex-1 max-w-sm mr-2">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search case ID, address, keyword..."
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-sans"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={onApply}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition-colors shadow-sm"
          >
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
