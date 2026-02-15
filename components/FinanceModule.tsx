
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';
import { Patient, RiskLevel } from '../types';
import RiskMeter from './RiskMeter';
import { generateFinancialAudit, createLiaisonRequest, FinancialAudit, LiaisonRequest } from '../services/geminiService';

interface FinanceModuleProps {
  patients: Patient[];
}

const FinanceModule: React.FC<FinanceModuleProps> = ({ patients }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<FinancialAudit | null>(null);
  const [activeLiaison, setActiveLiaison] = useState<LiaisonRequest | null>(null);
  const [isLiaisonLoading, setIsLiaisonLoading] = useState(false);

  const activePatients = patients.filter(p => p.status !== 'Discharged');
  
  // Executive Financial Aggregates
  const totalProjectedRevenue = activePatients.reduce((sum, p) => sum + (p.estTreatmentCost || 0), 0);
  const avgTreatmentCost = activePatients.length > 0 ? totalProjectedRevenue / activePatients.length : 0;
  const verifiedInsuranceCount = activePatients.filter(p => p.insurance?.status === 'Verified').length;
  const verificationRate = activePatients.length > 0 ? (verifiedInsuranceCount / activePatients.length) * 100 : 0;

  // Chart Data: Revenue by Department
  const deptRevenue = Array.from(
    activePatients.reduce((acc, p) => {
      const dept = p.department || 'Unassigned';
      acc.set(dept, (acc.get(dept) || 0) + (p.estTreatmentCost || 0));
      return acc;
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value }));

  const handleExportBillingReport = async () => {
    setIsAuditing(true);
    try {
      const result = await generateFinancialAudit(activePatients);
      setAuditResult(result);
    } catch (e) {
      console.error("Financial Audit Failed", e);
      alert("Failed to connect to Financial AI Engine. Please check network connectivity.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleLiaisonRequest = async (patientId: string) => {
    const patient = activePatients.find(p => p.id === patientId);
    if (!patient) return;

    setIsLiaisonLoading(true);
    try {
      const request = await createLiaisonRequest(patient);
      setActiveLiaison(request);
    } catch (e) {
      alert("Liaison Service Error. Manual intervention required.");
    } finally {
      setIsLiaisonLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Verified': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Financial Intelligence Hub</h2>
          <p className="text-sm text-slate-500">Predictive cost modeling & revenue integrity orchestration</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportBillingReport}
            disabled={isAuditing}
            className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isAuditing ? 'Generating Audit...' : 'Export Billing Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:shadow-xl transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Projected Revenue</p>
          <p className="text-3xl font-black text-slate-900">${totalProjectedRevenue.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-500">
            <span className="text-xs font-bold">+12.4% vs Baseline</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:shadow-xl transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Treatment Cost</p>
          <p className="text-3xl font-black text-slate-900">${avgTreatmentCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase">Acuity-Adjusted</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:shadow-xl transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Insurance Verification</p>
          <p className="text-3xl font-black text-slate-900">{verificationRate.toFixed(1)}%</p>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${verificationRate}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight">Revenue Mix by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl transform group-hover:scale-110 transition-transform">💎</div>
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Financial AI Insights</h3>
              <span className="bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Real-Time Core</span>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs font-bold text-blue-400 uppercase mb-2">Cost Optimization Trigger</p>
                <p className="text-sm text-white/90 leading-relaxed italic">
                  "{auditResult?.strategicAdvice || "Analyzing patient flow for discharge-ready low-acuity cases to optimize bed-turnover revenue."}"
                </p>
              </div>
              <div className="flex gap-4">
                 <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Integrity Score</p>
                    <p className="text-2xl font-black text-emerald-400">{auditResult?.revenueIntegrityScore || 88}%</p>
                 </div>
                 <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Unbilled Potential</p>
                    <p className="text-2xl font-black text-blue-400">${(auditResult?.unbilledRevenueEst || 4500).toLocaleString()}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Patient Financial Registry</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Billing Pipeline</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-8 py-5">Patient & Provider</th>
                <th className="px-8 py-5">Coverage Status</th>
                <th className="px-8 py-5">Fin. Risk Index</th>
                <th className="px-8 py-5 text-right">Est. Billable</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activePatients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-800 text-base">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.id} • {p.insurance?.provider || 'UNINSURED'}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(p.insurance?.status)}`}>
                      {p.insurance?.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-8 py-5 w-48">
                    <RiskMeter label="" value={p.financialRiskScore || 0} />
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-900 text-base">
                    ${(p.estTreatmentCost || 0).toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleLiaisonRequest(p.id)}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:shadow-md active:scale-95"
                    >
                      AI Liaison
                    </button>
                  </td>
                </tr>
              ))}
              {activePatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-medium uppercase tracking-widest opacity-30">
                     No billable records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Modal Overlay */}
      {auditResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
            <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Executive Billing Audit</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Hospital Revenue integrity Protocol</p>
              </div>
              <button onClick={() => setAuditResult(null)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-50 hover:text-rose-600 transition-all">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-8 bg-indigo-950 rounded-[2.5rem] text-white flex flex-col items-center justify-center shadow-xl">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Integrity Composite</p>
                  <p className="text-6xl font-black">{auditResult.revenueIntegrityScore}%</p>
                </div>
                <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] text-emerald-900 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Unbilled Exposure</p>
                  <p className="text-4xl font-black">${auditResult.unbilledRevenueEst.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Identified Billing Anomalies</h4>
                <div className="space-y-3">
                  {auditResult.billingAnomalies.map((item, idx) => (
                    <div key={idx} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex justify-between items-center group hover:bg-rose-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 bg-rose-200 rounded-full flex items-center justify-center text-rose-700 font-black text-[10px]">{idx + 1}</span>
                        <div>
                           <p className="text-sm font-bold text-rose-900">Patient: {item.patientId}</p>
                           <p className="text-xs text-rose-700 italic">{item.issue}</p>
                        </div>
                      </div>
                      <p className="text-base font-black text-rose-600">-${item.financialImpact.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2.5rem]">
                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="text-lg">📈</span> AI Revenue Recovery Plan
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                  "{auditResult.reportSummary}"
                </p>
              </div>
            </div>

            <div className="p-10 border-t bg-slate-50 flex justify-end gap-4">
               <button onClick={() => setAuditResult(null)} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
               <button className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all" onClick={() => { alert('Billing summary transmitted to Revenue Cycle Management.'); setAuditResult(null); }}>Commit Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Liaison Modal Overlay */}
      {activeLiaison && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col border border-white/20">
            <div className="p-10 border-b bg-indigo-950 text-white flex justify-between items-center">
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">AI Clinical Liaison</h3>
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mt-1">Insurance Justification Draft</p>
               </div>
               <button onClick={() => setActiveLiaison(null)} className="text-white hover:text-indigo-300 transition-colors">✕</button>
            </div>
            
            <div className="p-10 space-y-8">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Status</span>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                    activeLiaison.priority === 'Immediate' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-black'
                  }`}>{activeLiaison.priority}</span>
               </div>

               <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem]">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Justification Language</h4>
                  <p className="text-sm text-slate-700 leading-loose italic">
                    "{activeLiaison.clinicalJustification}"
                  </p>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeLiaison.suggestedNextSteps.map((step, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-blue-100">
                        {idx + 1}. {step}
                      </span>
                    ))}
                  </div>
               </div>
            </div>

            <div className="p-10 border-t bg-slate-50 flex justify-end gap-3">
               <button onClick={() => setActiveLiaison(null)} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Dismiss</button>
               <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl" onClick={() => { alert('Liaison request dispatched to Insurance Desk.'); setActiveLiaison(null); }}>Transmit Request</button>
            </div>
          </div>
        </div>
      )}

      {isLiaisonLoading && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/20 backdrop-blur-sm">
           <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Building Clinical Case...</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
