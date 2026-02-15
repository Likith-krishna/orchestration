
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { Patient, RiskLevel, Bed, OT, PatientStatus } from '../types';

interface DashboardProps {
  patients: Patient[];
  beds: Bed[];
  ots: OT[];
}

type ForecastPeriod = 'Daily' | 'Monthly' | 'Yearly';

const Dashboard: React.FC<DashboardProps> = ({ patients, beds, ots }) => {
  const [forecastPeriod, setForecastPeriod] = useState<ForecastPeriod>('Daily');
  const activePatients = patients.filter(p => p.status !== PatientStatus.DISCHARGED);
  
  const inpatientLoad = activePatients.filter(p => 
    p.status === PatientStatus.ADMITTED || 
    p.status === PatientStatus.SURGERY || 
    p.status === PatientStatus.DIAGNOSIS
  ).length;

  const totalBeds = beds.length;
  const occupiedCount = beds.filter(b => b.isOccupied).length;
  const reportedOccupancy = Math.max(inpatientLoad, occupiedCount);
  const currentVacancies = totalBeds - reportedOccupancy;
  
  const icuOccupancy = (beds.filter(b => b.ward === 'ICU' && b.isOccupied).length / Math.max(1, beds.filter(b => b.ward === 'ICU').length)) * 100;
  const totalEstRevenue = activePatients.reduce((acc, p) => acc + (p.estTreatmentCost || 0), 0);

  const getVacancyAnalysis = () => {
    const periodHours = forecastPeriod === 'Daily' ? 24 : forecastPeriod === 'Monthly' ? 720 : 8760;
    const dischargeCandidates = activePatients.filter(p => {
      if (p.status === PatientStatus.QUEUED || p.status === PatientStatus.TRIAGE) return false;
      const riskFactor = p.riskLevel === RiskLevel.LOW ? 1 : p.riskLevel === RiskLevel.MEDIUM ? 0.5 : 0.1;
      const timeFactor = p.estLengthOfStay && p.estLengthOfStay * 24 <= periodHours ? 1 : 0.2;
      return (riskFactor * timeFactor) > 0.4;
    });

    const predictedVacancies = Math.min(totalBeds, currentVacancies + dischargeCandidates.length);
    const vacancyProbability = Math.round((predictedVacancies / totalBeds) * 100);
    return { probability: vacancyProbability, count: predictedVacancies, candidates: dischargeCandidates.length };
  };

  const vacancyAnalysis = getVacancyAnalysis();

  const deptData = [
    { name: 'ER', count: activePatients.filter(p => p.department === 'Emergency').length },
    { name: 'Cardio', count: activePatients.filter(p => p.department === 'Cardiology').length },
    { name: 'ICU', count: activePatients.filter(p => p.department === 'ICU').length },
    { name: 'Gen Med', count: activePatients.filter(p => p.department === 'General Medicine').length },
  ];

  // Acuity Mix Classification: Consolidating Critical and High into one "High Risk" tier
  const riskData = [
    { name: 'High Risk', value: activePatients.filter(p => p.riskLevel === RiskLevel.CRITICAL || p.riskLevel === RiskLevel.HIGH).length, color: '#e11d48' },
    { name: 'Medium Risk', value: activePatients.filter(p => p.riskLevel === RiskLevel.MEDIUM).length, color: '#f59e0b' },
    { name: 'Low Risk', value: activePatients.filter(p => p.riskLevel === RiskLevel.LOW).length, color: '#10b981' },
  ].filter(d => d.value > 0);

  const forecastData: Record<ForecastPeriod, { label: string; load: number }[]> = {
    Daily: [
      { label: '08:00', load: 12 }, { label: '10:00', load: 18 }, { label: '12:00', load: 35 },
      { label: '14:00', load: 42 }, { label: '16:00', load: 28 }, { label: '18:00', load: 15 },
      { label: '20:00', load: 10 }, { label: '22:00', load: 8 }
    ],
    Monthly: [
      { label: 'Week 1', load: 240 }, { label: 'Week 2', load: 310 }, 
      { label: 'Week 3', load: 280 }, { label: 'Week 4', load: 350 }
    ],
    Yearly: [
      { label: 'Jan', load: 1200 }, { label: 'Feb', load: 1100 }, { label: 'Mar', load: 1400 },
      { label: 'Apr', load: 1350 }, { label: 'May', load: 1500 }, { label: 'Jun', load: 1600 },
      { label: 'Jul', load: 1750 }, { label: 'Aug', load: 1700 }, { label: 'Sep', load: 1550 },
      { label: 'Oct', load: 1650 }, { label: 'Nov', load: 1800 }, { label: 'Dec', load: 1950 }
    ]
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Hospital Command Center</h1>
        <div className="flex gap-4">
           <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest">Est. Revenue: ${totalEstRevenue.toLocaleString()}</span>
          </div>
          <div className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-widest">Monitoring: Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Active Patients', value: activePatients.length, icon: '👥', color: 'blue' },
          { label: 'Clinical Waitlist', value: activePatients.length - inpatientLoad, icon: '⌛', color: 'amber' },
          { label: 'Bed Occupancy', value: `${reportedOccupancy}/${totalBeds}`, icon: '🛏️', color: 'indigo' },
          { label: 'ICU Utilization', value: `${icuOccupancy.toFixed(0)}%`, icon: '⚡', color: 'emerald' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl group-hover:scale-110 transition-transform">{stat.icon}</span>
              <span className={`text-${stat.color}-600 bg-${stat.color}-50 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest`}>Live</span>
            </div>
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <span className="text-blue-500">📊</span>
              Department Load Analysis
            </h2>
            <p className="text-[10px] font-bold text-slate-400">LOAD-AWARE ROUTING ENABLED</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
            <span className="text-rose-500">📈</span>
            Acuity Mix
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-8 w-full">
              {riskData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
