import React, { useState } from 'react';
import { importAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Download,
  Check,
  XCircle
} from 'lucide-react';

export default function ImportPage() {
  const { isAdmin, isAnalyst } = useAuth();
  const [file, setFile] = useState(null);
  const [csvPreviewText, setCsvPreviewText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setCommitSuccess(false);

      // Read small text preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvPreviewText(event.target.result.slice(0, 500));
      };
      reader.readAsText(selected);
    }
  };

  const handleValidatePreview = async (commit = false) => {
    if (!file) return;
    if (commit) setCommitting(true);
    else setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const resp = await importAPI.uploadCSV(formData, commit);
      setResult(resp.data);
      if (commit && resp.data.success) {
        setCommitSuccess(true);
      }
    } catch (err) {
      console.error("CSV import error:", err);
      alert(err.response?.data?.detail || "CSV processing failed.");
    } finally {
      setLoading(false);
      setCommitting(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!result?.errors) return;
    const errorCsv = "row,case_number,error_messages\n" +
      result.errors.map(e => `${e.row},"${e.case_number}","${e.errors.join('; ')}"`).join('\n');
    const blob = new Blob([errorCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CSV_Validation_Errors_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <UploadCloud className="w-5 h-5 text-blue-700" />
          <span>CSV Crime-Data Ingestion Wizard</span>
        </h1>
        <p className="text-xs text-slate-500">
          Bulk Case Verification • Duplicate Detection • Pre-Validation Inspection
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 max-w-3xl">
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-600 bg-slate-50 rounded-xl p-8 text-center transition-colors">
          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
            <UploadCloud className="w-10 h-10 text-blue-700 mb-2" />
            <span className="text-sm font-bold text-slate-800">
              {file ? file.name : 'Select or Drop CSV Crime Dataset File'}
            </span>
            <span className="text-xs text-slate-500 font-mono mt-1">
              Required headers: case_number, crime_type, date, latitude, longitude, police_station
            </span>
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-600 font-mono">
              Selected: <strong className="text-slate-900">{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleValidatePreview(false)}
                disabled={loading || committing}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-medium text-xs rounded-md transition-colors shadow-sm"
              >
                {loading ? 'Inspecting CSV...' : 'Inspect & Validate'}
              </button>

              {result && result.valid_rows > 0 && !commitSuccess && (
                <button
                  onClick={() => handleValidatePreview(true)}
                  disabled={committing}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-md shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{committing ? 'Importing Rows...' : `Commit ${result.valid_rows} Valid Rows`}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Commit Success Banner */}
      {commitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono flex items-center justify-between max-w-3xl">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Successfully imported {result?.imported_rows} records into PostgreSQL database with audit trail.</span>
          </div>
        </div>
      )}

      {/* Inspection Results Dashboard */}
      {result && (
        <div className="space-y-4 max-w-3xl">
          {/* Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-slate-500 block font-medium">Total Rows</span>
              <strong className="text-lg text-slate-900 font-bold font-mono">{result.total_rows}</strong>
            </div>
            <div className="bg-white border border-emerald-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-emerald-700 block font-semibold">Valid Rows</span>
              <strong className="text-lg text-emerald-700 font-bold font-mono">{result.valid_rows}</strong>
            </div>
            <div className="bg-white border border-red-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-red-700 block font-semibold">Invalid Rows</span>
              <strong className="text-lg text-red-700 font-bold font-mono">{result.invalid_rows}</strong>
            </div>
            <div className="bg-white border border-amber-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-amber-700 block font-semibold">Duplicate Rows</span>
              <strong className="text-lg text-amber-700 font-bold font-mono">{result.duplicate_rows}</strong>
            </div>
          </div>

          {/* Validation Errors List */}
          {result.invalid_rows > 0 && (
            <div className="bg-white border border-red-200 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-red-700 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Row Validation Exceptions ({result.errors.length})</span>
                </span>
                <button
                  onClick={handleDownloadErrors}
                  className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Error Report</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs font-mono">
                {result.errors.map((err, i) => (
                  <div key={i} className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 flex justify-between">
                    <span>Row #{err.row} [Case: {err.case_number}]:</span>
                    <span className="text-red-700 font-semibold">{err.errors.join(' • ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {result.preview?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
              <div className="text-xs font-bold text-slate-800 uppercase">
                Valid Records Preview (First {result.preview.length} Rows)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="py-1.5 px-2">Case ID</th>
                      <th className="py-1.5 px-2">Offense</th>
                      <th className="py-1.5 px-2">Date</th>
                      <th className="py-1.5 px-2">Station</th>
                      <th className="py-1.5 px-2">Severity</th>
                      <th className="py-1.5 px-2">Coordinates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {result.preview.map((p, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2 font-bold text-slate-900">{p.case_number}</td>
                        <td className="py-1.5 px-2">{p.crime_type}</td>
                        <td className="py-1.5 px-2">{p.date}</td>
                        <td className="py-1.5 px-2">{p.station}</td>
                        <td className="py-1.5 px-2 text-amber-700 font-semibold">{p.severity}</td>
                        <td className="py-1.5 px-2 text-slate-500">({p.latitude.toFixed(3)}, {p.longitude.toFixed(3)})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
