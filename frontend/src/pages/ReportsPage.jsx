import React, { useState, useEffect } from 'react';
import { reportsAPI, stationsAPI } from '../services/api';
import {
  FileText,
  Download,
  Calendar,
  Shield,
  Filter,
  CheckCircle,
  AlertTriangle,
  Flame,
  Printer
} from 'lucide-react';

export default function ReportsPage() {
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    stationsAPI.getAll().then((res) => setStations(res.data)).catch(console.error);
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const resp = await reportsAPI.getSummary({
        police_station_id: stationId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setReport(resp.data);
    } catch (err) {
      console.error("Report summary error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const resp = await reportsAPI.downloadPDF({
        police_station_id: stationId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CRIMEMAP_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Failed to download intelligence report PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-700" />
            <span>Crime Intelligence Report Generator</span>
          </h1>
          <p className="text-xs text-slate-500">
            Executive Briefs • Structured Evidence Statistics • Downloadable Formatted PDF
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading || loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md text-xs shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Compiling PDF...' : 'Download Intelligence PDF'}</span>
        </button>
      </div>

      {/* Scope Filter Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 text-xs"
            >
              <option value="">All Police Stations</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchReport}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded font-medium text-xs transition-colors"
        >
          Update Preview
        </button>
      </div>

      {/* Report Preview Document */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mr-2" />
          Compiling Intelligence Document...
        </div>
      ) : report ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-md space-y-6 max-w-4xl mx-auto text-slate-900">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-4">
            <div className="text-[10px] text-blue-700 uppercase tracking-widest font-bold">
              Official Police Intelligence Briefing
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{report.title}</h2>
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mt-2">
              <span>Jurisdiction: <strong className="text-slate-800">{report.jurisdiction}</strong></span>
              <span>Scope: <strong className="text-slate-800">{report.start_date} to {report.end_date}</strong></span>
              <span>Generated: <strong className="text-slate-800">{report.generated_at}</strong></span>
            </div>
          </div>

          {/* Ethics / Disclaimer Alert Box */}
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-bold uppercase text-[11px] text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Report Methodology Distinction</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              This report strictly delineates between <strong>Historical Statistics</strong>, <strong>ML-Derived Risk Assessments</strong>,
              and <strong>Human Observations</strong>. Machine-learning calculations are decision-support indices based on spatial concentration and do not guarantee future crime events.
            </p>
          </div>

          {/* KPI Summary Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-medium">Total Incidents</span>
              <strong className="text-xl text-slate-900 font-bold font-mono">{report.total_incidents}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-medium">Critical Cases</span>
              <strong className="text-xl text-red-600 font-bold font-mono">{report.severity_breakdown?.Critical || 0}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-medium">High Severity</span>
              <strong className="text-xl text-orange-600 font-bold font-mono">{report.severity_breakdown?.High || 0}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-medium">Active Hotspots</span>
              <strong className="text-xl text-amber-600 font-bold font-mono">{report.hotspots?.length || 0}</strong>
            </div>
          </div>

          {/* Section 1: Historical Offense Counts */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
              1. Historical Offense Category Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {Object.entries(report.crime_types || {}).map(([cName, cnt]) => (
                <div key={cName} className="bg-slate-50 p-2 rounded-md border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 truncate">{cName}:</span>
                  <span className="text-slate-900 font-bold font-mono">{cnt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Machine-Learning Hotspot & Risk Assessments */}
          <div>
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1 flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>2. ML-Derived Hotspot Risk Assessments (DBSCAN Clusters)</span>
            </h3>
            <div className="space-y-2 text-xs">
              {report.hotspots?.length > 0 ? (
                report.hotspots.map((hs, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-900 font-bold text-xs">{hs.label}</span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Concentration: <strong className="text-slate-800">{hs.incident_count}</strong> crimes • Primary: <strong className="text-blue-700">{hs.primary_crime}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-700 font-mono">{hs.risk_score}/100</span>
                      <div className="text-[10px] font-bold text-slate-600 uppercase">{hs.risk_category} RISK</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs">No active hotspots detected within selected criteria.</div>
              )}
            </div>
          </div>

          {/* Section 3: Important Human Observations */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
              3. Operational Observations (Human Decision Support)
            </h3>
            <div className="space-y-1.5 text-xs text-slate-700">
              {report.observations?.map((obs, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <span className="text-blue-700 font-bold">•</span>
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
