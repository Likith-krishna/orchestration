
import React, { useState } from 'react';
import { Patient, PatientStatus } from '../types';
import CareJourneyTimeline from './CareJourneyTimeline';

interface CareJourneyViewProps {
  patients: Patient[];
}

const CareJourneyView: React.FC<CareJourneyViewProps> = ({ patients }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patients.length > 0 ? patients[0].id : null);

  const activePatients = patients.filter(p => p.status !== PatientStatus.DISCHARGED);
  const selectedPatient = activePatients.find(p => p.id === selectedPatientId) || activePatients[0];

  // Dynamic Confidence derivation
  const recoveryConfidence = selectedPatient ? Math.max(5, 100 - (selectedPatient.riskScore || 50)) : 0;

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">AI Care Journey Analytics</h2>
          <p className="text-sm text-slate-500">Longitudinal clinical trajectory and outcome prediction</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-white border rounded-xl flex items-center gap-2 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analytics Mode: Longitudinal</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-8">
        {/* Patient Selection Sidebar */}
        <div className="w-80 shrink-0 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b bg-slate-50/50">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Cohort</h3>
            <div className="mt-4 relative">
              <input 
                type="text" 
                placeholder="Search patient registry..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activePatients.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  selectedPatientId === p.id 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'bg-white border-slate-100 text-slate-600 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-sm truncate">{p.name}</p>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                    selectedPatientId === p.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {p.id}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    selectedPatientId === p.id ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    {p.status}
                  </p>
                  <p className={`text-[10px] font-black ${
                    selectedPatientId === p.id ? 'text-white' : 'text-slate-900'
                  }`}>
                    Risk: {p.riskScore}%
                  </p>
                </div>
              </button>
            ))}
            {activePatients.length === 0 && (
              <div className="py-20 text-center text-slate-400 italic text-xs">
                No active patients in registry.
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-y-auto">
          {selectedPatient ? (
            <div className="p-4">
              <div className="px-8 py-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">
                    {selectedPatient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{selectedPatient.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Case Journal • Clinical History Analysis
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recovery Confidence</p>
                    <p className={`text-lg font-black ${recoveryConfidence > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{recoveryConfidence}%</p>
                  </div>
                </div>
              </div>
              <CareJourneyTimeline patient={selectedPatient} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <span className="text-5xl">🛤️</span>
              <p className="font-black uppercase tracking-widest text-xs">Select a patient to view Care Journey</p>
              <p className="text-xs italic">Clinical trajectory analysis requires active case selection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareJourneyView;
