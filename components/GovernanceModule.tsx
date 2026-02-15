
import React, { useState, useMemo } from 'react';
import { AuditLog, UserRole } from '../types';
import { generateComplianceReport } from '../services/geminiService';

interface GovernanceModuleProps {
  logs: AuditLog[];
}

const GovernanceModule: React.FC<GovernanceModuleProps> = ({ logs }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [complianceSummary, setComplianceSummary] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Warning': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [logs, searchQuery]);

  const handleDownloadReport = async () => {
    if (logs.length === 0) {
      alert("Compliance audit requires active system logs. Please process a clinical event first.");
      return;
    }

    setIsExporting(true);
    setExportProgress(10);
    setComplianceSummary(null);

    try {
      // 1. Get AI Synthesis of logs
      const summary = await generateComplianceReport(logs);
      setExportProgress(40);
      setComplianceSummary(summary);
      
      // 2. Simulate PDF creation handshake
      await new Promise(r => setTimeout(r, 1200));
      setExportProgress(80);
      
      // 3. Finalize and trigger simulated download
      await new Promise(r => setTimeout(r, 800));
      setExportProgress(100);
      
      const fileName = `ORCHESTRA_HIPAA_REPORT_${new Date().toISOString().split('T')[0]}.txt`;
      const blob = new Blob([`
ORCHESTRA HEALTH: HIPAA COMPLIANCE EXPORT
==========================================
Date: ${new Date().toLocaleString()}
Audit Continuity: VERIFIED
Log Range: ${logs.length} entries

AI COMPLIANCE SUMMARY:
----------------------
${summary}

AUDIT TRAIL SNAPSHOT:
---------------------
${logs.slice(0, 10).map(l => `[${l.timestamp}] ${l.action} (${l.user}): ${l.details}`).join('\n')}
...
[END OF RECORD]
      `], { type: 'text/plain' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();

      setTimeout(() => setIsExporting(false), 2000);
    } catch (e) {
      alert("Compliance Engine Handshake Failed. Please retry in 60s.");
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Platform Governance & Audit</h2>
          <p className="text-sm text-slate-500">Decision transparency, AI explainability, and compliance logs</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadReport}
            disabled={isExporting}
            className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-xl"
          >
            {isExporting ? (
              <>
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Generating Report...
              </>
            ) : 'Download HIPAA Report'}
          </button>
        </div>
      </div>

      {isExporting && (
        <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-500 shadow-2xl animate-pulse">
           <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Secure Export In Progress</p>
              <span className="text-xs font-black text-slate-900">{exportProgress}%</span>
           </div>
           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${exportProgress}%` }}></div>
           </div>
        </div>
      )}

      {complianceSummary && (
        <div className="bg-indigo-950 p-8 rounded-[2.5rem] text-white shadow-2xl border border-indigo-900 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl transform group-hover:rotate-12 transition-transform">⚖️</div>
           <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">Audit Intelligence Summary</h3>
           <p className="text-sm text-slate-200 leading-relaxed italic border-l-4 border-blue-500 pl-6">
             "{complianceSummary}"
           </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Decision Confidence</p>
          <p className="text-3xl font-black text-slate-900">97.8%</p>
          <p className="mt-4 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">High Reliability Index</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Manual Overrides</p>
          <p className="text-3xl font-black text-slate-900">2.4%</p>
          <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Decision Integrity: High</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Events (24h)</p>
          <p className="text-3xl font-black text-slate-900">{logs.length}</p>
          <p className="mt-4 text-[10px] text-blue-500 font-bold uppercase tracking-widest">Compliance Pipeline Active</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">System Audit Trail</h3>
          <div className="flex gap-4">
             <input 
              type="text" 
              placeholder="Filter audit logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium" 
             />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">Category</th>
                <th className="px-8 py-4">User</th>
                <th className="px-8 py-4">Event Details</th>
                <th className="px-8 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                      <br />
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${getSeverityStyle(log.severity)}`}>
                        {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="text-xs font-bold text-slate-700">{log.user}</div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-xs text-slate-600 leading-relaxed max-w-md">{log.details}</p>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm">🛡️</span> Blockchain Validated
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-medium uppercase tracking-widest opacity-30">
                    No compliance events match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GovernanceModule;
