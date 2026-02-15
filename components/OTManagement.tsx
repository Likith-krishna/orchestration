
import React, { useState, useMemo } from 'react';
import { Patient, OT, SurgicalPriority, PatientStatus } from '../types';
import RiskMeter from './RiskMeter';
import { getOTEfficiencyAudit, OTEfficiencyAudit } from '../services/geminiService';

interface OTManagementProps {
  ots: OT[];
  patients: Patient[];
  onSchedule: (patientId: string, otId: string) => void;
  onBatchSchedule: (assignments: { patientId: string, otId: string }[]) => void;
}

const OTManagement: React.FC<OTManagementProps> = ({ ots, patients, onSchedule, onBatchSchedule }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<OTEfficiencyAudit | null>(null);
  const [selectedOts, setSelectedOts] = useState<Record<string, string>>({}); // patientId -> otId

  // Surgical Queue Optimization with Tiered Priority
  const surgicalQueue = useMemo(() => {
    return patients
      .filter(p => (p.surgeryLikelihood || 0) > 40 && p.status !== PatientStatus.DISCHARGED && p.status !== PatientStatus.SURGERY)
      .sort((a, b) => {
        const priorityOrder = { [SurgicalPriority.EMERGENCY]: 3, [SurgicalPriority.URGENT]: 2, [SurgicalPriority.ELECTIVE]: 1 };
        const pA = priorityOrder[a.surgicalPriority || SurgicalPriority.ELECTIVE];
        const pB = priorityOrder[b.surgicalPriority || SurgicalPriority.ELECTIVE];
        if (pA !== pB) return pB - pA;

        const sA = a.surgeryLikelihood || 0;
        const sB = b.surgeryLikelihood || 0;
        if (sA !== sB) return sB - sA;

        return (b.deteriorationProb || 0) - (a.deteriorationProb || 0);
      });
  }, [patients]);

  const availableOts = useMemo(() => ots.filter(ot => ot.status === 'Ready'), [ots]);

  const handleEfficiencyAudit = async () => {
    setIsAuditing(true);
    try {
      setAuditResult(null);
      const result = await getOTEfficiencyAudit(ots, patients);
      if (result) {
        setAuditResult(result);
      }
    } catch (e) {
      console.error("Efficiency Audit Service Failure:", e);
      alert("AI Audit Service is currently unavailable. Operating on local cache.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleAdoptRecommendations = () => {
    if (!auditResult) return;

    if (availableOts.length === 0) {
      alert("ADOPTION FAILED: No 'Ready' theatres found. Perform suite sterilization first.");
      return;
    }

    if (surgicalQueue.length === 0) {
      alert("ADOPTION FAILED: Surgical queue is empty.");
      return;
    }

    const batchAssignments: { patientId: string, otId: string, patientName: string, otName: string }[] = [];
    const localAvailableOts = [...availableOts];
    const localQueue = [...surgicalQueue];

    const batchSize = Math.min(localAvailableOts.length, localQueue.length);

    for (let i = 0; i < batchSize; i++) {
      const patient = localQueue[i];
      const ot = localAvailableOts[i];
      batchAssignments.push({
        patientId: patient.id,
        otId: ot.id,
        patientName: patient.name,
        otName: ot.name
      });
    }

    onBatchSchedule(batchAssignments.map(a => ({ patientId: a.patientId, otId: a.otId })));
    setAuditResult(null);

    if (batchAssignments.length > 0) {
      const message = batchAssignments.map(a => `• ${a.patientName} → ${a.otName}`).join('\n');
      alert(`AI ORCHESTRATION SUCCESSFUL:\n\n${message}\n\nProjected wait time reduction: ${auditResult.savingsMinutes}m.`);
    }
  };

  const getPriorityColor = (priority?: SurgicalPriority) => {
    switch (priority) {
      case SurgicalPriority.EMERGENCY: return 'bg-rose-500/20 text-rose-400 border-rose-500/20';
      case SurgicalPriority.URGENT: return 'bg-amber-500/20 text-amber-400 border-amber-500/20';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready': return 'text-emerald-400';
      case 'In Use': return 'text-rose-400';
      default: return 'text-amber-400';
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-white uppercase tracking-tight">Surgical Orchestration</h2>
          <p className="text-xl text-slate-400 font-medium mt-2">AI-optimized theatre scheduling and pre-op readiness monitoring.</p>
        </div>
        <div className="flex gap-6">
          <div className="px-8 py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 backdrop-blur-md">
            <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Active Surgeons: 12</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          </div>
          <button
            onClick={handleEfficiencyAudit}
            disabled={isAuditing}
            className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isAuditing ? 'Auditing Nodes...' : 'Run Clinical Audit'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <h3 className="text-lg font-black text-blue-400 uppercase tracking-[0.2em] px-2 flex items-center gap-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Theatre Network
          </h3>
          {ots.map(ot => (
            <div key={ot.id} className={`glass-card p-10 border ${ot.status === 'Ready' ? 'border-emerald-500/30' : 'border-white/5'} transition-all group hover:bg-white/[0.03]`}>
              <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{ot.name}</h4>
                  <p className="text-sm text-slate-600 font-black uppercase tracking-[0.2em] mt-2">Suite // {ot.capacity || 'Standard'}</p>
                </div>
                <div className={`text-sm font-black uppercase tracking-[0.2em] ${getStatusColor(ot.status)} flex items-center gap-3 bg-white/5 px-5 py-3 rounded-full border border-white/5`}>
                  {ot.status === 'In Use' && <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>}
                  {ot.status === 'Ready' && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>}
                  {ot.status}
                </div>
              </div>

              <div className="space-y-6">
                {ot.status === 'In Use' ? (
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Procedure in Progress</p>
                    <p className="text-lg font-black text-white truncate mb-3">{ot.currentSurgery || 'Active Operation'}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <p className="text-sm text-blue-400 font-black uppercase tracking-widest">ETR: {ot.nextAvailable}</p>
                    </div>
                  </div>
                ) : ot.status === 'Cleaning' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-amber-400 font-black uppercase tracking-widest">Bio-Sterilization Cycle</p>
                      <span className="text-sm font-black text-slate-600">45%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-amber-500 w-1/2 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-sm text-emerald-400 font-black uppercase tracking-[0.2em]">Station Nominal</p>
                    <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">Infrastructure ready for surgical intake orchestration.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card overflow-hidden shadow-2xl border-white/5">
            <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Priority Surgical Queue</h3>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">AI Urgency Ranking</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-slate-500 text-sm font-black uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-10 py-7">Clinical Subject</th>
                    <th className="px-10 py-7">Requirement</th>
                    <th className="px-10 py-7 w-48">Acuity Matrix</th>
                    <th className="px-10 py-7">Station Map</th>
                    <th className="px-10 py-7 text-right">Operational Command</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {surgicalQueue.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.03] transition-all group">
                      <td className="px-10 py-8">
                        <div className="font-black text-white text-xl tracking-tight group-hover:text-blue-400 transition-colors border-l-2 border-transparent group-hover:border-blue-500 pl-4 -ml-4">{p.name}</div>
                        <div className="text-sm text-slate-500 font-black uppercase tracking-widest mt-2">{p.id} // {p.age}Y // {p.gender}</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-3">
                          <span className={`inline-flex px-5 py-2 rounded-xl text-sm font-black uppercase border tracking-widest shadow-sm ${getPriorityColor(p.surgicalPriority)}`}>
                            {p.surgicalPriority || 'Elective'}
                          </span>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-tighter">Likelihood: <span className="text-white">{p.surgeryLikelihood}%</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <RiskMeter label="Deterioration" value={p.deteriorationProb || 10} />
                      </td>
                      <td className="px-10 py-8">
                        <select
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm font-black uppercase text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                          value={selectedOts[p.id] || ''}
                          onChange={(e) => setSelectedOts(prev => ({ ...prev, [p.id]: e.target.value }))}
                        >
                          <option value="" className="bg-[#0a0f1d]">Unassigned</option>
                          {availableOts.map(ot => (
                            <option key={ot.id} value={ot.id} className="bg-[#0a0f1d]">{ot.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button
                          disabled={!selectedOts[p.id]}
                          onClick={() => onSchedule(p.id, selectedOts[p.id])}
                          className="bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white text-sm font-black px-10 py-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-20 uppercase tracking-widest"
                        >
                          Deploy
                        </button>
                      </td>
                    </tr>
                  ))}
                  {surgicalQueue.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center gap-6 opacity-30">
                          <div className="text-6xl">🛡️</div>
                          <p className="text-lg font-black uppercase tracking-[0.3em] text-slate-500">Operational Standby: Queue Clear</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-600/10 p-12 rounded-[3rem] border border-blue-500/20 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group shadow-2xl">
            <div className="absolute -bottom-10 -right-10 p-4 opacity-5 text-[15rem] transition-transform group-hover:scale-110 pointer-events-none">⚛️</div>
            <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(37,99,235,0.4)] shrink-0 group-hover:rotate-12 transition-transform">
              🤖
            </div>
            <div className="flex-1">
              <h4 className="text-blue-400 font-black uppercase tracking-[0.3em] text-lg mb-4 flex items-center gap-4">
                Orchestra Intelligence
                <span className="w-16 h-[2px] bg-blue-500/30"></span>
              </h4>
              <p className="text-white/80 text-lg font-medium italic leading-relaxed">
                {auditResult ? auditResult.bottleneckReason : "Ready for clinical load analysis. System idling in monitoring mode."}
              </p>
            </div>
            <button
              onClick={handleAdoptRecommendations}
              disabled={!auditResult || availableOts.length === 0 || surgicalQueue.length === 0}
              className="whitespace-nowrap bg-white text-blue-900 px-14 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-20"
            >
              Adopt AI Plan
            </button>
          </div>
        </div>
      </div>

      {auditResult && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
          <div className="glass-card w-full max-w-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col border-white/10">
            <div className="p-12 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">Clinical Optimization</h3>
                <p className="text-sm text-blue-400 font-black uppercase tracking-[0.3em] mt-2">Audit Core v3.1 Nominal</p>
              </div>
              <button onClick={() => setAuditResult(null)} className="text-slate-500 hover:text-white transition-colors text-2xl font-light">✕</button>
            </div>
            <div className="p-12 space-y-12">
              <div className="grid grid-cols-2 gap-10">
                <div className="p-10 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex flex-col items-center justify-center shadow-inner">
                  <p className="text-sm font-black text-blue-400 uppercase tracking-widest mb-4">Utilization Score</p>
                  <p className="text-6xl font-black text-white">{auditResult.utilizationScore}%</p>
                </div>
                <div className="p-10 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex flex-col items-center justify-center shadow-inner">
                  <p className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-4">Time Reclaimed</p>
                  <p className="text-6xl font-black text-white">{auditResult.savingsMinutes}M</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-4">
                  <span className="w-6 h-[2px] bg-slate-700"></span>
                  Strategic Bottleneck Identified
                </h4>
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-slate-300 text-base font-medium italic leading-relaxed">
                  "{auditResult.bottleneckReason}"
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-4">
                  <span className="w-6 h-[2px] bg-slate-700"></span>
                  Optimized Command Sequence
                </h4>
                <div className="flex flex-wrap gap-4">
                  {auditResult.optimizedSchedule.map((step, idx) => (
                    <span key={idx} className="bg-blue-600/10 text-blue-400 px-6 py-3 rounded-xl text-sm font-black uppercase border border-blue-500/20 shadow-sm">
                      {idx + 1}. {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-12 bg-white/5 border-t border-white/10 flex justify-end gap-8">
              <button
                onClick={() => setAuditResult(null)}
                className="px-12 py-5 bg-transparent text-slate-500 hover:text-white rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-colors"
              >
                Abort
              </button>
              <button
                onClick={handleAdoptRecommendations}
                disabled={availableOts.length === 0 || surgicalQueue.length === 0}
                className="px-14 py-5 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl text-sm font-black uppercase tracking-[0.3em] shadow-xl shadow-blue-900/40 active:scale-95 disabled:opacity-20"
              >
                Adopt Strategy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTManagement;
