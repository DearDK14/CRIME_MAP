import React, { useState, useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { 
  Download, 
  Search, 
  Eye, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export default function AgGridIncidentLedger({
  incidents = [],
  loading = false,
  onSelectIncident,
  onRefresh,
}) {
  const gridRef = useRef(null);
  const [quickFilterText, setQuickFilterText] = useState('');

  // Custom Severity Cell Renderer
  const SeverityRenderer = useCallback((params) => {
    const val = params.value;
    const variantMap = {
      Critical: 'critical',
      High: 'high',
      Medium: 'medium',
      Low: 'low',
    };
    return (
      <div className="flex items-center h-full">
        <Badge variant={variantMap[val] || 'default'}>{val}</Badge>
      </div>
    );
  }, []);

  // Custom Status Cell Renderer
  const StatusRenderer = useCallback((params) => {
    const val = params.value;
    const isClosed = val === 'Closed';
    const isCharges = val === 'Charges Filed';
    const isInvestigating = val === 'Under Investigation';

    const colorClass = isClosed
      ? 'text-slate-600 bg-slate-100 border-slate-300'
      : isCharges
      ? 'text-sky-800 bg-sky-100 border-sky-300 font-semibold'
      : isInvestigating
      ? 'text-amber-800 bg-amber-100 border-amber-300 font-semibold'
      : 'text-blue-800 bg-blue-100 border-blue-300 font-semibold';

    return (
      <div className="flex items-center h-full">
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${colorClass}`}>
          {val}
        </span>
      </div>
    );
  }, []);

  // Custom Action / Inspection Cell Renderer
  const ActionRenderer = useCallback((params) => {
    return (
      <div className="flex items-center space-x-1.5 h-full">
        <button
          onClick={() => onSelectIncident && onSelectIncident(params.data)}
          className="p-1 rounded bg-slate-100 hover:bg-blue-700 hover:text-white text-slate-600 border border-slate-200 transition-colors"
          title="Inspect Case Profile"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }, [onSelectIncident]);

  // Column Definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'Case FIR #',
      field: 'case_number',
      pinned: 'left',
      width: 170,
      cellRenderer: (params) => (
        <span className="font-mono font-bold text-blue-700 cursor-pointer hover:underline">
          {params.value}
        </span>
      ),
      onCellClicked: (params) => onSelectIncident && onSelectIncident(params.data),
    },
    {
      headerName: 'Offense Category',
      field: 'crime_type.name',
      width: 170,
      filter: true,
      valueGetter: (params) => params.data?.crime_type?.name || 'General Offense',
    },
    {
      headerName: 'Date & Time',
      field: 'incident_date',
      width: 150,
      valueGetter: (params) => {
        const d = params.data?.incident_date || '';
        const t = params.data?.incident_time ? ` ${params.data.incident_time.slice(0, 5)}` : '';
        return `${d}${t}`;
      },
    },
    {
      headerName: 'Police Station',
      field: 'police_station.name',
      width: 180,
      filter: true,
      valueGetter: (params) => params.data?.police_station?.name || 'Puducherry HQ',
    },
    {
      headerName: 'Severity',
      field: 'severity',
      width: 120,
      cellRenderer: SeverityRenderer,
      filter: true,
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 160,
      cellRenderer: StatusRenderer,
      filter: true,
    },
    {
      headerName: 'Location Address',
      field: 'address',
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params.data?.address || 'Puducherry Jurisdiction',
    },
    {
      headerName: 'Victims',
      field: 'victim_count',
      width: 90,
      valueGetter: (params) => params.data?.victim_count || 1,
    },
    {
      headerName: 'Actions',
      width: 90,
      pinned: 'right',
      cellRenderer: ActionRenderer,
      sortable: false,
      filter: false,
    },
  ], [SeverityRenderer, StatusRenderer, ActionRenderer, onSelectIncident]);

  // Grid default options
  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    filter: true,
  }), []);

  // Quick Filter Handler
  const handleQuickFilterChange = (e) => {
    const text = e.target.value;
    setQuickFilterText(text);
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption('quickFilterText', text);
    }
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `puducherry_crime_incidents_${new Date().toISOString().slice(0, 10)}.csv`,
      });
    }
  };

  return (
    <div className="space-y-3 font-mono text-xs select-none">
      {/* AG-Grid Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-900 font-bold tracking-tight text-xs flex items-center space-x-1.5">
              <span>AG-GRID ENTERPRISE COMMAND LEDGER</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                High-Speed
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              Multi-column sorting • Instant filter • Virtual scrolling
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Instant filter all columns..."
              value={quickFilterText}
              onChange={handleQuickFilterChange}
              className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 font-mono text-xs w-56 sm:w-64 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Export CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 border-slate-300"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </Button>

          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              className="text-slate-600 hover:text-slate-900 border-slate-300"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* AG Grid Container (Styled with Quartz Light Theme) */}
      <div 
        className="ag-theme-quartz rounded-xl overflow-hidden border border-slate-200 shadow-sm"
        style={{ height: '540px', width: '100%' }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={incidents}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          rowSelection={{ mode: 'singleRow' }}
          animateRows={true}
          loading={loading}
        />
      </div>
    </div>
  );
}
