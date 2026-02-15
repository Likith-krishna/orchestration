
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Patient, CareEvent } from '../types';

interface CareJourneyTimelineProps {
  patient: Patient;
}

const CareJourneyTimeline: React.FC<CareJourneyTimelineProps> = ({ patient }) => {
  const chartData = patient.careHistory.map(event => ({
    time: new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: event.riskScoreSnapshot
  }));

  // Calculate dynamic confidence metrics based on patient risk
  const recoveryConfidence = Math.max(5, 100 - (patient.riskScore || 50));
  const relapseRisk = patient.deteriorationProb || 5;

  const getEventIcon = (type: CareEvent['type']) => {
    switch (type) {
      case 'clinical': return '🩺';
      case 'intervention': return '💉';
      case 'status_change': return '🔄';
      case 'operational': return '🏢';
      default: return '📍';
    }
  };

  return (
    <div className="p-6 space-y-10 animate-fadeIn">
      {/* Risk Trend Header */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">AI Risk Trajectory</h3>
            <p className="text-xl font-black text-slate-800">Dynamic Acuity Monitoring</p>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">Real-time Analysis</span>
          </div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#3b82f6" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Outcome Analysis Card */}
      <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">🎯</div>
        <div className="relative z-10">
          <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">Outcome Prediction Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-2xl font-black leading-tight">
                Current pathway predicted to result in <span className={recoveryConfidence > 70 ? 'text-emerald-400' : 'text-amber-400'}>
                  {recoveryConfidence > 70 ? 'Stable Discharge' : recoveryConfidence > 40 ? 'Managed Recovery' : 'Complex Monitoring'}
                </span> within {patient.estLengthOfStay || 48} hours.
              </p>
              <div className="mt-4 flex gap-4">
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Recovery Conf.</p>
                  <p className={`text-sm font-black ${recoveryConfidence > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{recoveryConfidence}%</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Relapse Risk</p>
                  <p className={`text-sm font-black ${relapseRisk > 30 ? 'text-rose-400' : 'text-slate-300'}`}>{relapseRisk}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-md">
              <p className="text-[10px] font-black text-indigo-300 uppercase mb-2">Intervention Efficiency</p>
              <p className="text-xs leading-relaxed opacity-80 italic">
                "{patient.riskScore && patient.riskScore > 70 
                  ? 'High acuity requires aggressive intervention. AI pathway favors ICU stabilization over general boarding.'
                  : 'Low acuity suggests accelerated discharge eligibility. Early outpatient transition could improve efficiency by 12%.'}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chronological Vertical Timeline */}
      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Care Activity Timeline</h3>
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {patient.careHistory.map((event, idx) => (
            <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white text-lg shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-all duration-300">
                {getEventIcon(event.type)}
              </div>
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-3xl bg-white border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-black text-slate-800 uppercase text-[10px] tracking-tight">{event.title}</div>
                  <time className="font-mono text-[10px] text-blue-500 font-bold">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
                <div className="text-slate-500 text-xs leading-relaxed">{event.description}</div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase">{event.performedBy}</span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${event.riskScoreSnapshot > 70 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    ACUITY: {event.riskScoreSnapshot}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CareJourneyTimeline;
