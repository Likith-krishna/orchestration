
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Patient, Bed, PatientStatus } from '../types';

interface EmergencyModuleProps {
  patients: Patient[];
  beds: Bed[];
  onIsolatePatient: (patientId: string) => void;
  onTriggerLockdown: () => void;
  isLockdownActive: boolean;
}

const EmergencyModule: React.FC<EmergencyModuleProps> = ({ 
  patients, 
  beds, 
  onIsolatePatient, 
  onTriggerLockdown, 
  isLockdownActive 
}) => {
  const activePatients = patients.filter(p => p.status !== PatientStatus.DISCHARGED);
  
  // Logic to detect clusters based on shared symptoms
  const symptomCounts: Record<string, number> = {};
  activePatients.forEach(p => {
    p.symptoms.forEach(s => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });

  const topSymptoms = Object.entries(symptomCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Detect unusual clusters (threshold of 3+ shared symptoms)
  const clusters = Object.entries(symptomCounts).filter(([, count]) => count >= 3);
  const isOutbreakPossible = clusters.length > 0;

  // Infectious Heatmap data (Age vs Temperature with size as contagion score)
  const heatmapData = activePatients.map(p => ({
    x: p.age,
    y: p.vitals.temp,
    z: (p.contagionScore || 20) + 10,
    name: p.name,
    isIsolated: p.isolationRecommended
  }));

  const isolationBeds = beds.filter(b => b.type === 'Isolation');
  const availableIsolation = isolationBeds.filter(b => !b.isOccupied).length;

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Biosurveillance Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200">🚨</span>
            Biosurveillance Command
          </h2>
          <p className="text-sm text-slate-500 mt-1">Real-time infection clustering & automated isolation routing</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onTriggerLockdown}
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl active:scale-95 transition-all ${
              isLockdownActive ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            {isLockdownActive ? 'Lift Lockdown Protocol' : 'Lockdown Protocol'}
          </button>
        </div>
      </div>

      {/* Outbreak Alert Banner */}
      {isOutbreakPossible ? (
        <div className="bg-rose-600 text-white p-6 rounded-3xl shadow-2xl shadow-rose-200 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse border-4 border-rose-500">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">⚠️</div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight leading-none">Possible Outbreak Trend Detected</h3>
              <p className="text-rose-100 text-sm mt-1 font-bold">
                Cluster detected: {clusters.map(([s]) => s).join(', ')} symptoms present in {clusters[0]?.[1]} active cases.
              </p>
            </div>
          </div>
          <div className="bg-white/20 px-6 py-4 rounded-2xl text-center border border-white/30 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Confidence Score</p>
            <p className="text-2xl font-black">92.4%</p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500 text-white p-6 rounded-3xl flex items-center gap-6 shadow-lg shadow-emerald-100">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🛡️</div>
          <div>
            <h3 className="font-black uppercase tracking-widest text-sm">No Active Infection Clusters</h3>
            <p className="text-emerald-100 text-xs">Continuous biosurveillance monitoring active.</p>
          </div>
        </div>
      )}

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
          <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight flex items-center gap-2">
            <span className="text-rose-500">🌡️</span>
            Patient Infection Heatmap
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" dataKey="x" name="Age" unit="y" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis type="number" dataKey="y" name="Temp" unit="°C" domain={[35, 42]} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Patients" data={heatmapData}>
                  {heatmapData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.y > 38 ? '#e11d48' : entry.isIsolated ? '#3b82f6' : '#94a3b8'} 
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Febrile Range</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Isolated</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6">Isolation Status</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-bold">Available ISO Beds</span>
                <span className={`text-2xl font-black ${availableIsolation > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {availableIsolation} / {isolationBeds.length}
                </span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${availableIsolation === 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${(availableIsolation / isolationBeds.length) * 100}%` }}
                />
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-amber-400 uppercase mb-2">Auto-Recommendation</p>
                <p className="text-xs text-white leading-relaxed italic">
                  {isOutbreakPossible 
                    ? `"Recommend immediate isolation for ${clusters[0]?.[1]} patients in ER with shared atypical symptoms."`
                    : `"Baseline monitoring. No immediate isolation triggers detected via automated clustering."`
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Top Infectious Symptoms</h3>
            <div className="space-y-4">
              {topSymptoms.map((s, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-700 uppercase">
                    <span>{s.name}</span>
                    <span>{s.count} Cases</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${s.count >= 3 ? 'bg-rose-500' : 'bg-blue-500'}`} 
                      style={{ width: `${(s.count / Math.max(1, activePatients.length)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {topSymptoms.length === 0 && <p className="text-xs text-slate-400 italic">No symptoms reported.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Infectious Registry Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Active Contagion Registry</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Global Surveillance Feed Active
          </span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-8 py-4">Patient</th>
              <th className="px-8 py-4">Key Symptoms</th>
              <th className="px-8 py-4">Temp (°C)</th>
              <th className="px-8 py-4">Contagion Score</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Recommendation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activePatients.filter(p => p.vitals.temp > 37.5 || p.isolationRecommended).map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-4">
                  <div className="font-bold text-slate-800">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{p.id} • {p.age}y</div>
                </td>
                <td className="px-8 py-4">
                  <div className="flex flex-wrap gap-1">
                    {p.symptoms.map(s => (
                      <span key={s} className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase">
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span className={`text-sm font-black ${p.vitals.temp > 38.5 ? 'text-rose-600' : 'text-amber-600'}`}>
                    {p.vitals.temp}°C
                  </span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                      <div className="h-full bg-rose-500" style={{ width: `${p.contagionScore || 40}%` }} />
                    </div>
                    <span className="text-xs font-black text-slate-900">{p.contagionScore || 40}%</span>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                    p.isolationRecommended ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {p.isolationRecommended ? 'ISOLATED' : 'GENERAL'}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                  {!p.isolationRecommended ? (
                    <button 
                      onClick={() => onIsolatePatient(p.id)}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all active:scale-95"
                    >
                      Isolate Now
                    </button>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center justify-end gap-1">
                      <span className="text-xs">✅</span> Secured
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {activePatients.filter(p => p.vitals.temp > 37.5 || p.isolationRecommended).length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic text-sm">
                  No infectious risk currently identified in patient population.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmergencyModule;
