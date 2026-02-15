
import React from 'react';
import { Patient } from '../types';
import RiskMeter from './RiskMeter';

interface OperationalInsightProps {
  patient: Patient;
}

const OperationalInsight: React.FC<OperationalInsightProps> = ({ patient }) => {
  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="bg-emerald-50 p-2 rounded-lg text-lg">💰</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${patient.insurance?.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {patient.insurance?.status || 'Pending Verification'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Treatment Cost</p>
            <h4 className="text-2xl font-black text-slate-800">${patient.estTreatmentCost?.toLocaleString() || '---'}</h4>
          </div>
          <div className="pt-4 border-t">
            <p className="text-xs text-slate-500 font-medium">Provider: <span className="text-slate-800 font-bold">{patient.insurance?.provider || 'None'}</span></p>
            <p className="text-xs text-slate-500 font-medium">Policy: <span className="text-slate-800 font-bold">{patient.insurance?.policyNumber || 'N/A'}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="bg-blue-50 p-2 rounded-lg text-lg">📅</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Predicted LOS (Days)</p>
            <h4 className="text-2xl font-black text-slate-800">{patient.estLengthOfStay || '---'} Days</h4>
          </div>
          <div className="pt-4 border-t">
            <RiskMeter label="Financial Risk Index" value={patient.financialRiskScore || 0} />
          </div>
        </div>

        <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📉</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Operational Alert</p>
          </div>
          <p className="text-xs leading-relaxed opacity-90 italic">
            "AI predicts potential insurance bottleneck for high-cost cardiac procedure. Pre-authorization recommended within 4 hours."
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Cost-Effective Care Pathways
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patient.costEffectivePathways?.map((path, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md transition-all cursor-default">
              <span className="text-emerald-500">✅</span>
              <p className="text-sm font-bold text-slate-700">{path}</p>
            </div>
          )) || <p className="text-slate-400 italic text-sm">No pathways generated yet.</p>}
        </div>
      </section>

      <section className="bg-amber-50 border border-amber-200 p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
          ⚠️ Financial Risk Classification
        </h3>
        <p className="text-sm text-amber-900 leading-relaxed">
          This patient is classified as <strong>{patient.financialRiskScore! > 50 ? 'HIGH' : 'LOW'}</strong> financial risk based on coverage type ({patient.insurance?.coverageType}) and projected acuity. 
          {patient.financialRiskScore! > 50 ? ' Suggesting liaison with financial counseling to ensure coverage compliance.' : ' No immediate financial intervention required.'}
        </p>
      </section>
    </div>
  );
};

export default OperationalInsight;
