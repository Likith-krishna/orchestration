
import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { generateClinicalCopilotData, CopilotAnalysis } from '../services/geminiService';

interface ClinicalCopilotProps {
  patient: Patient;
}

const ClinicalCopilot: React.FC<ClinicalCopilotProps> = ({ patient }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CopilotAnalysis | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analysis = await generateClinicalCopilotData(patient);
        setData(analysis);
      } catch (e) {
        console.error("Clinical Copilot Hook Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patient.id]);

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-24 bg-indigo-950/20 rounded-2xl"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="h-40 bg-rose-50 rounded-2xl"></div>
      </div>
    );
  }

  if (!data) return (
    <div className="p-12 text-center flex flex-col items-center gap-4">
      <span className="text-5xl opacity-20 grayscale">🧠</span>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">AI Insight unavailable for this case.</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      {/* 10-Sec Summary */}
      <section className="bg-indigo-950 text-indigo-50 p-6 rounded-2xl shadow-xl shadow-indigo-200/50">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-indigo-500/30 p-1.5 rounded-lg text-lg">⚡</span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300">Physician's 10-Second Bottom Line</h3>
        </div>
        <p className="text-lg font-medium leading-relaxed italic border-l-4 border-indigo-400 pl-4">
          "{data.summary10Sec || 'Analyzing case for bottom-line summary...'}"
        </p>
      </section>

      {/* SBAR Handoff */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Structured SBAR Handoff</h3>
          <button className="text-[10px] font-black text-blue-600 hover:text-blue-800 tracking-widest uppercase">Copy to EMR</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.sbar && Object.entries(data.sbar).map(([key, val]) => (
            <div key={key} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed font-medium">{String(val)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dangerous Mimics */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
          Diagnostic Overlooked Mimics
        </h3>
        <div className="space-y-3">
          {data.dangerousMimics && data.dangerousMimics.length > 0 ? (
            data.dangerousMimics.map((mimic, i) => (
              <div key={i} className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex gap-5 group hover:bg-rose-100 transition-all">
                <div className="shrink-0 w-12 h-12 bg-rose-200/50 rounded-xl flex items-center justify-center text-rose-600 font-black text-xl">!</div>
                <div>
                  <h4 className="text-base font-black text-rose-900 uppercase tracking-tight">{mimic.condition}</h4>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed"><span className="font-black opacity-40 uppercase mr-1">Pitfall:</span>{mimic.whyOverlooked}</p>
                  <div className="mt-3 inline-flex items-center gap-2 bg-rose-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    <span>🔎</span> Rule out: {mimic.check}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No mimics identified for this clinical pattern.</p>
          )}
        </div>
      </section>

      {/* Clinical Pearls & Literature */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence-Based Pearls</h3>
          <ul className="space-y-3">
            {data.clinicalPearls && data.clinicalPearls.map((p, i) => (
              <li key={i} className="text-xs text-slate-600 flex gap-3 leading-relaxed">
                <span className="text-indigo-500 font-black">•</span> {p}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correlated Literature</h3>
          <div className="space-y-3">
            {data.suggestedLiterature && data.suggestedLiterature.map((lit, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{lit.title}</h4>
                <div className="flex justify-between items-center mt-1">
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{lit.year}</p>
                   <span className="text-[8px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded font-black uppercase">PubMed Ref</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 italic leading-relaxed">"{lit.keyFinding}"</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ClinicalCopilot;
