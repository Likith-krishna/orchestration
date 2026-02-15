
import React, { useMemo } from 'react';
import { Patient, RiskLevel, PatientStatus } from '../types';

interface QueueBoardProps {
  patients: Patient[];
  onSelect: (patient: Patient) => void;
}

const QueueBoard: React.FC<QueueBoardProps> = ({ patients, onSelect }) => {
  // Filter for patients currently needing clinical flow
  const queuedPatients = useMemo(() => {
    return patients.filter(p => 
      p.status === PatientStatus.QUEUED || 
      p.status === PatientStatus.DIAGNOSIS ||
      p.status === PatientStatus.TRIAGE
    );
  }, [patients]);

  // Orchestra Priority Index (OPI) Calculation
  // A composite score ensuring clinical urgency is balanced with operational wait times
  const patientsWithOPI = useMemo(() => {
    const now = Date.now();
    return queuedPatients.map(p => {
      const waitTimeMins = p.queueStartTime 
        ? Math.floor((now - new Date(p.queueStartTime).getTime()) / 60000)
        : 0;
      
      // Weights: Clinical Risk (60%), Wait Time (20%), Deterioration Risk (20%)
      const clinicalBase = p.riskScore || 0;
      const waitWeight = Math.min(waitTimeMins * 1.5, 40); // Cap wait bonus at 40 points
      const deteriorationWeight = p.deteriorationProb || 0;
      
      const opi = (clinicalBase * 0.6) + (waitWeight * 0.2) + (deteriorationWeight * 0.2);
      
      return { ...p, opi, waitTimeMins };
    }).sort((a, b) => b.opi - a.opi);
  }, [queuedPatients]);

  // Dynamic Metrics
  const stats = useMemo(() => {
    const critical = patientsWithOPI.filter(p => p.riskLevel === RiskLevel.CRITICAL).length;
    const avgWait = patientsWithOPI.length > 0 
      ? Math.round(patientsWithOPI.reduce((acc, p) => acc + p.waitTimeMins, 0) / patientsWithOPI.length)
      : 0;
    const highDeterioration = patientsWithOPI.filter(p => (p.deteriorationProb || 0) > 50).length;
    
    return { critical, avgWait, highDeterioration };
  }, [patientsWithOPI]);

  const getUrgencyStyles = (opi: number, level?: RiskLevel) => {
    if (level === RiskLevel.CRITICAL || opi > 85) return 'bg-rose-50 border-rose-200 text-rose-700';
    if (level === RiskLevel.HIGH || opi > 65) return 'bg-orange-50 border-orange-200 text-orange-700';
    if (level === RiskLevel.MEDIUM || opi > 40) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Clinical Flow Orchestration</h2>
          <p className="text-sm text-slate-500">OPI-based prioritization: balancing acuity, time, and deterioration risk.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-4 hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl">⏳</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Wait</p>
              <p className="text-lg font-black text-slate-800">{stats.avgWait}m</p>
            </div>
          </div>

          <div className="bg-white border border-rose-100 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-4 hover:shadow-lg hover:shadow-rose-100 transition-all border-l-4 border-l-rose-500">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 text-xl animate-pulse">🚨</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical</p>
              <p className="text-lg font-black text-slate-800">{stats.critical}</p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl px-5 py-3 shadow-xl flex items-center gap-4 border border-slate-800">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400 text-xl">📉</div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deterioration Risk</p>
              <p className="text-lg font-black text-white">{stats.highDeterioration} Cases</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">OPI Rank</th>
                <th className="px-8 py-5">Patient & Clinical Context</th>
                <th className="px-8 py-5">Urgency Matrix</th>
                <th className="px-8 py-5">Wait Time</th>
                <th className="px-8 py-5">AI Routing</th>
                <th className="px-8 py-5 text-right">Operational Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientsWithOPI.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <span className="text-6xl">✨</span>
                      <p className="font-black uppercase tracking-widest text-slate-400">Queue Cleared: Monitoring Active</p>
                    </div>
                  </td>
                </tr>
              ) : (
                patientsWithOPI.map((p, index) => {
                  const styles = getUrgencyStyles(p.opi, p.riskLevel);
                  
                  return (
                    <tr 
                      key={p.id} 
                      className="hover:bg-slate-50 group transition-all cursor-pointer relative" 
                      onClick={() => onSelect(p)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-black text-slate-300 group-hover:text-blue-500 transition-colors">#{index + 1}</span>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${styles}`}>
                            {Math.round(p.opi)}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-black text-slate-800 text-base">{p.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.id} • {p.age}y • {p.gender}</span>
                            {p.preferredLanguage && (
                              <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 rounded font-black uppercase">{p.preferredLanguage}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest ${styles}`}>
                            {p.riskLevel || 'Triage Pending'}
                          </span>
                          <div className="flex gap-1">
                            <span className={`w-full h-1 rounded-full ${p.deteriorationProb && p.deteriorationProb > 50 ? 'bg-rose-500 animate-pulse' : 'bg-slate-200'}`} title="Deterioration Prob"></span>
                            <span className={`w-full h-1 rounded-full ${p.icuLikelihood && p.icuLikelihood > 40 ? 'bg-indigo-500' : 'bg-slate-200'}`} title="ICU Likelihood"></span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className={`text-sm font-mono font-bold ${p.waitTimeMins > 30 ? 'text-rose-600' : 'text-slate-600'}`}>
                            {p.waitTimeMins}m
                          </span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Queue Start: {p.queueStartTime ? new Date(p.queueStartTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-bold text-slate-700">{p.department || 'ROUTING...'}</p>
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                            {p.status}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95 group-hover:translate-x-1"
                        >
                          Review Case →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Legend */}
      <div className="flex flex-wrap gap-8 px-4 justify-center">
        {[
          { label: 'OPI > 85: Immediate Action', color: 'bg-rose-500' },
          { label: 'OPI > 65: Urgent Flow', color: 'bg-orange-500' },
          { label: 'OPI > 40: Standard Care', color: 'bg-amber-500' },
          { label: 'OPI < 40: Stable / Awaiting', color: 'bg-emerald-500' }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueueBoard;
