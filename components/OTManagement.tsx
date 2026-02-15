
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
        // 1. Level of Surgical Priority (Emergency > Urgent > Elective)
        const priorityOrder = { [SurgicalPriority.EMERGENCY]: 3, [SurgicalPriority.URGENT]: 2, [SurgicalPriority.ELECTIVE]: 1 };
        const pA = priorityOrder[a.surgicalPriority || SurgicalPriority.ELECTIVE];
        const pB = priorityOrder[b.surgicalPriority || SurgicalPriority.ELECTIVE];
        if (pA !== pB) return pB - pA;
        
        // 2. Surgery Likelihood
        const sA = a.surgeryLikelihood || 0;
        const sB = b.surgeryLikelihood || 0;
        if (sA !== sB) return sB - sA;
        
        // 3. Deterioration Probability
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
    
    // Batch schedule: match top priority patients to available slots
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

    // Execute the atomic batch update in the parent
    onBatchSchedule(batchAssignments.map(a => ({ patientId: a.patientId, otId: a.otId })));

    // Explicitly clear audit result to close modal
    setAuditResult(null);
    
    if (batchAssignments.length > 0) {
      const message = batchAssignments.map(a => `• ${a.patientName} → ${a.otName}`).join('\n');
      alert(`AI ORCHESTRATION SUCCESSFUL:\n\n${message}\n\nProjected wait time reduction: ${auditResult.savingsMinutes}m.`);
    }
  };

  const getPriorityColor = (priority?: SurgicalPriority) => {
    switch (priority) {
      case SurgicalPriority.EMERGENCY: return 'bg-rose-100 text-rose-700 border-rose-200';
      case SurgicalPriority.URGENT: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready': return 'text-emerald-500';
      case 'In Use': return 'text-rose-500';
      default: return 'text-amber-500';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Surgical Suite Orchestration</h2>
          <p className="text-sm text-slate-500">AI-optimized theatre scheduling and pre-op readiness</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Surgeons: 12</span>
          </div>
          <button 
            onClick={handleEfficiencyAudit}
            disabled={isAuditing}
            className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {isAuditing ? 'Auditing Suite...' : 'Run Efficiency Audit'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: OT Roster */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Theatre Status</h3>
          {ots.map(ot => (
            <div key={ot.id} className={`bg-white p-6 rounded-3xl border ${ot.status === 'Ready' ? 'border-emerald-200 shadow-md' : 'border-slate-200'} transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-slate-800">{ot.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ot.capacity || 'Standard'} Suite</p>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor(ot.status)}`}>
                   {ot.status === 'In Use' && <span className="inline-block w-2 h-2 bg-rose-500 rounded-full animate-pulse mr-2"></span>}
                   {ot.status}
                </div>
              </div>
              
              <div className="space-y-3">
                {ot.status === 'In Use' ? (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Current Procedure</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{ot.currentSurgery || 'Active Operation'}</p>
                    <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase">Ends: {ot.nextAvailable}</p>
                  </div>
                ) : ot.status === 'Cleaning' ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">Sterilization Cycle...</p>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 w-1/2 animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Available</p>
                    <div className="text-[10px] text-slate-400 italic">No scheduled procedures. Ready for intake.</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Surgical Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Surgical Priority Queue</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Urgency Ranking</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-8 py-4">Patient</th>
                    <th className="px-8 py-4">Surgical Need</th>
                    <th className="px-8 py-4">Acuity</th>
                    <th className="px-8 py-4">Theatre Assignment</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {surgicalQueue.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{p.id} • {p.age}y</div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getPriorityColor(p.surgicalPriority)}`}>
                            {p.surgicalPriority || 'Elective'}
                          </span>
                          <p className="text-xs font-bold text-slate-600">Likelihood: {p.surgeryLikelihood}%</p>
                        </div>
                      </td>
                      <td className="px-8 py-4 w-40">
                        <RiskMeter label="Deterioration" value={p.deteriorationProb || 10} />
                      </td>
                      <td className="px-8 py-4">
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                          value={selectedOts[p.id] || ''}
                          onChange={(e) => setSelectedOts(prev => ({...prev, [p.id]: e.target.value}))}
                        >
                          <option value="">Select Suite</option>
                          {availableOts.map(ot => (
                            <option key={ot.id} value={ot.id}>{ot.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          disabled={!selectedOts[p.id]}
                          onClick={() => onSchedule(p.id, selectedOts[p.id])}
                          className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-30"
                        >
                          SCHEDULE
                        </button>
                      </td>
                    </tr>
                  ))}
                  {surgicalQueue.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic text-sm">
                        No pending surgical candidates meeting urgency threshold.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-indigo-950 p-8 rounded-3xl shadow-2xl border border-indigo-900 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl transition-transform group-hover:scale-110">💡</div>
             <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-blue-500/50 shrink-0">⚡</div>
             <div className="flex-1">
                <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2">Automated Batch Suggestion</h4>
                <p className="text-indigo-200 text-sm italic leading-relaxed">
                  {auditResult ? auditResult.bottleneckReason : "System waiting for next efficiency audit cycle."}
                </p>
             </div>
             <button 
               onClick={handleAdoptRecommendations}
               disabled={!auditResult || availableOts.length === 0 || surgicalQueue.length === 0}
               className="whitespace-nowrap bg-white text-indigo-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-30"
             >
                Adopt Batch Plan
             </button>
          </div>
        </div>
      </div>

      {/* Audit Overlay Modal */}
      {auditResult && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col border border-white/20">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">AI Suite Optimization</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Audit Engine Result v2.1</p>
              </div>
              <button onClick={() => setAuditResult(null)} className="text-slate-400 hover:text-slate-900 transition-colors">✕</button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">OT Efficiency Score</p>
                  <p className="text-4xl font-black">{auditResult.utilizationScore}%</p>
                </div>
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col items-center justify-center text-emerald-800">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2">Projected Time Savings</p>
                  <p className="text-4xl font-black">{auditResult.savingsMinutes}m</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Strategic Bottleneck</h4>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-800 text-sm font-medium italic">
                  "{auditResult.bottleneckReason}"
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Recommended Sequence</h4>
                <div className="flex flex-wrap gap-2">
                  {auditResult.optimizedSchedule.map((step, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-indigo-100">
                      {idx + 1}. {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setAuditResult(null)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdoptRecommendations}
                disabled={availableOts.length === 0 || surgicalQueue.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-30"
              >
                Execute Batch Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTManagement;
