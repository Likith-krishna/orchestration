
import React, { useState } from 'react';
import { Patient, RiskLevel } from '../types';
import RiskMeter from './RiskMeter';
import ClinicalCopilot from './ClinicalCopilot';
import OperationalInsight from './OperationalInsight';
import CareJourneyTimeline from './CareJourneyTimeline';

interface PatientDetailsModalProps {
  patient: Patient;
  onClose: () => void;
  onAction?: (action: string) => void;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ patient, onClose, onAction }) => {
  const [activeTab, setActiveTab] = useState<'clinical' | 'copilot' | 'ops' | 'journey'>('clinical');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2rem] w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
        <div className="flex justify-between items-center p-8 border-b bg-white sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg
              ${patient.riskLevel === RiskLevel.CRITICAL ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{patient.name}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${patient.riskLevel === RiskLevel.CRITICAL ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'}`}>
                  {patient.riskLevel} Clinical Urgency
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Case #{patient.id} • {patient.age}y • {patient.gender}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex border border-slate-200">
              {[
                { id: 'clinical', label: 'Clinical' },
                { id: 'ops', label: 'Financial' },
                { id: 'journey', label: 'Care Journey' },
                { id: 'copilot', label: '🧠 AI Copilot', special: true }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === tab.id 
                      ? tab.special ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white shadow-md text-slate-900' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-all flex items-center justify-center text-slate-400 group">
              <svg className="w-5 h-5 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          {activeTab === 'copilot' && <ClinicalCopilot patient={patient} />}
          {activeTab === 'ops' && <OperationalInsight patient={patient} />}
          {activeTab === 'journey' && <CareJourneyTimeline patient={patient} />}
          {activeTab === 'clinical' && (
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">Active Clinical Presentation</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { label: 'Temp', val: `${patient.vitals.temp}°C`, normal: patient.vitals.temp < 37.5 },
                      { label: 'SpO2', val: `${patient.vitals.spo2}%`, normal: patient.vitals.spo2 > 94 },
                      { label: 'Pulse', val: `${patient.vitals.pulse} bpm`, normal: patient.vitals.pulse < 100 },
                      { label: 'BP', val: `${patient.vitals.bp_sys}/${patient.vitals.bp_dia}`, normal: patient.vitals.bp_sys < 140 },
                      { label: 'Resp Rate', val: `${patient.vitals.resp_rate}`, normal: true },
                      { label: 'Pain Score', val: `${patient.severity}/10`, normal: patient.severity < 7 },
                    ].map((v, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{v.label}</p>
                        <p className={`text-xl font-black ${v.normal ? 'text-slate-800' : 'text-rose-600'}`}>{v.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">Symptom Cluster</h4>
                      <div className="flex flex-wrap gap-2">
                        {patient.symptoms.map(s => (
                          <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all hover:bg-blue-100 cursor-default">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2">History of Presenting Illness</h4>
                      <p className="text-sm text-slate-600 leading-relaxed italic border-l-4 border-slate-200 pl-4">{patient.history || 'Patient reports no chronic baseline illness.'}</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Clinical Intelligence v3.1</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {patient.suggestedDiagnoses && patient.suggestedDiagnoses.length > 0 ? (
                      <div className="bg-indigo-950 border border-indigo-900 p-8 rounded-[2rem] shadow-xl text-white col-span-2">
                        <h4 className="text-indigo-300 text-xs font-black uppercase tracking-widest flex items-center gap-3 mb-6">
                          <span className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">🧬</span> 
                          Suggested Diagnoses & Clinical Probabilities
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {patient.suggestedDiagnoses.map((diag, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-200">{diag.name}</span>
                                <span className="text-[9px] text-indigo-400 font-bold uppercase mt-1">{diag.rationale}</span>
                              </div>
                              <span className="text-[10px] font-black text-indigo-400 bg-white/10 px-3 py-1 rounded-full shrink-0 ml-4">{diag.probability}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="col-span-2 py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                        <p className="text-slate-400 italic font-medium">No algorithmic analysis requested.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8 sticky top-0">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full border-8 border-slate-50 flex items-center justify-center relative mb-4">
                       <svg className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                          <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${(patient.riskScore || 0) * 2.14} 214`} className={patient.riskScore! > 70 ? 'text-rose-600' : 'text-blue-600'} />
                       </svg>
                       <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-slate-800">{patient.riskScore}%</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Composite Urgency Index</p>
                  </div>

                  <div className="space-y-6">
                    <RiskMeter label="Urgency Score" value={patient.riskScore || 0} />
                    <RiskMeter label="Deterioration Probability" value={patient.deteriorationProb || 0} />
                    <RiskMeter label="Infectious Contagion" value={patient.contagionScore || 0} />
                  </div>

                  <div className="pt-8 border-t border-slate-50 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase text-center mb-4 tracking-widest">Orchestration Actions</h4>
                    <button 
                      onClick={() => onAction?.('admit')}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                    >
                      Allocate Ward Bed
                    </button>
                    <button 
                      onClick={() => onAction?.('ot')}
                      className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Confirm Surgery Needs
                    </button>
                    <button 
                      onClick={() => onAction?.('discharge')}
                      className="w-full py-4 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      Authorize Discharge
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;
