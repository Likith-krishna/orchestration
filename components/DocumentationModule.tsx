
import React, { useState, useEffect } from 'react';
import { Patient, PatientStatus } from '../types';
import { generateClinicalDocumentation, ClinicalDocument } from '../services/geminiService';

interface DocumentationModuleProps {
  patients: Patient[];
}

const DocumentationModule: React.FC<DocumentationModuleProps> = ({ patients }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patients.length > 0 ? patients[0].id : null);
  const [docType, setDocType] = useState<'triage' | 'admission' | 'discharge' | 'surgery'>('triage');
  const [document, setDocument] = useState<ClinicalDocument | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const activePatients = patients.filter(p => p.status !== PatientStatus.DISCHARGED);
  const selectedPatient = activePatients.find(p => p.id === selectedPatientId) || activePatients[0];

  const handleGenerate = async () => {
    if (!selectedPatient) return;
    try {
      setIsGenerating(true);
      const doc = await generateClinicalDocumentation(selectedPatient, docType);
      setDocument(doc);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    setDocument(null);
  }, [selectedPatientId, docType]);

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">AI Summaries & Documentation</h2>
          <p className="text-sm text-slate-500">Automated medical scribe with predictive coding and billing orchestration</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-xl hover:bg-slate-50 transition-all">Scribe Settings</button>
           <button className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Commit to Record</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-8">
        {/* Patient Selection Sidebar */}
        <div className="w-80 shrink-0 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b bg-slate-50/50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Patient Case</h3>
            <div className="mt-4 relative">
              <input 
                type="text" 
                placeholder="Search active cases..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
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
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  selectedPatientId === p.id ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {p.status}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center p-2 gap-2 w-fit shrink-0">
            {[
              { id: 'triage', label: 'Triage Summary' },
              { id: 'admission', label: 'Admission Note' },
              { id: 'surgery', label: 'Operative Draft' },
              { id: 'discharge', label: 'Discharge Summary' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDocType(tab.id as any)}
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                  docType === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            {!document && !isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 bg-slate-50/30">
                <div className="w-24 h-24 bg-white shadow-2xl shadow-blue-100 text-blue-600 rounded-[2rem] flex items-center justify-center text-5xl transform -rotate-6 transition-transform hover:rotate-0">🖋️</div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Automated Clinical Documentation</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                    Generate structured summaries using AI. The system will process symptoms, vitals, and care trajectory into a finalized {docType.toUpperCase()}.
                  </p>
                </div>
                <button 
                  onClick={handleGenerate}
                  className="bg-slate-900 hover:bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95"
                >
                  Generate {docType.replace('_', ' ')}
                </button>
              </div>
            ) : isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-10 bg-slate-50/50">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">📝</div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">AI Scribe is Drafting...</h3>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Coding ICD-10-CM</span>
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Optimizing Billing</span>
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Validation</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                <div className="px-10 py-6 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-black uppercase">Draft Active</span>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{document?.title}</h3>
                  </div>
                  <div className="flex gap-4">
                    <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-2 uppercase transition-colors">
                      <span className="text-sm">📋</span> Copy
                    </button>
                    <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-2 uppercase transition-colors">
                      <span className="text-sm">🖨️</span> Print
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/20">
                  <div className="max-w-4xl mx-auto">
                    <div className="p-10 bg-white border border-slate-100 shadow-sm rounded-3xl font-mono text-sm leading-loose text-slate-700 whitespace-pre-wrap">
                      {document?.content}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-900 text-white shrink-0 grid grid-cols-2 gap-12 border-t border-slate-800">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">ICD-10-CM Suggestions</h4>
                      <span className="text-[8px] text-slate-500 font-bold">GEMINI 3.0 CORE</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {document?.icdCodes.map(code => (
                        <div key={code.code} className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl group hover:bg-white/10 transition-all cursor-help relative" title={code.description}>
                          <span className="text-sm font-black text-indigo-300 group-hover:text-white">{code.code}</span>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 truncate max-w-[120px]">{code.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">HCPCS / CPT Forecast</h4>
                      <span className="text-[8px] text-slate-500 font-bold">REVENUE INTEGRITY</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {document?.billingCodes.map(code => (
                        <div key={code.code} className="bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 rounded-2xl flex flex-col min-w-[140px] hover:bg-emerald-500/10 transition-all">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-black text-emerald-400">{code.code}</span>
                            <span className="text-xs font-black text-white">${code.estAmount}</span>
                          </div>
                          <p className="text-[8px] font-bold text-emerald-200/50 uppercase truncate">{code.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModule;
