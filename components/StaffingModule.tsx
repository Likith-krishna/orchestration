
import React, { useState } from 'react';
import { StaffMember, Patient, Department, StaffStatus } from '../types';
import RiskMeter from './RiskMeter';

interface StaffingModuleProps {
  staff: StaffMember[];
  patients: Patient[];
  onRedeploy: (staffId: string, ward: Department) => void;
}

interface SimulationResult {
  title: string;
  bedStrain: number;
  otDelay: number;
  mortalityIncrease: number;
  shortfall: string;
  recommendation: string;
}

const StaffingModule: React.FC<StaffingModuleProps> = ({ staff, patients, onRedeploy }) => {
  const [activeSimulation, setActiveSimulation] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const activePatients = patients.filter(p => p.status !== 'In Triage' && p.status !== 'Discharged');
  
  const wards = Object.values(Department);
  const wardSurgeData = wards.map(ward => {
    const pCount = activePatients.filter(p => p.department === ward).length;
    const sCount = staff.filter(s => s.assignedWard === ward && s.status === StaffStatus.ACTIVE).length;
    const ratio = sCount === 0 ? pCount * 10 : pCount / sCount;
    return { ward, pCount, sCount, ratio };
  });

  const highSurgeWards = wardSurgeData.filter(w => w.ratio > 4);
  const availableStaff = staff.filter(s => s.workload < 30 && s.status !== StaffStatus.OFF);

  const runSimulation = (scenario: string) => {
    setIsSimulating(true);
    setActiveSimulation(null);

    setTimeout(() => {
      let result: SimulationResult;

      switch(scenario) {
        case 'MASS_ARRIVAL':
          result = {
            title: 'Mass Casualty Simulation (+30 Patients/hr)',
            bedStrain: 94,
            otDelay: 180,
            mortalityIncrease: 12.4,
            shortfall: 'Triage Nurses, ER Bays',
            recommendation: 'Activate Level 1 Trauma Protocol. Divert non-critical ER arrivals to satellite clinics. Cancel elective surgeries for 24h.'
          };
          break;
        case 'ICU_CRISIS':
          result = {
            title: 'Critical Care Ceiling (95% ICU Occupancy)',
            bedStrain: 98,
            otDelay: 45,
            mortalityIncrease: 18.2,
            shortfall: 'Ventilators, ICU Nurses',
            recommendation: 'Initiate critical care step-down review. Expedite stable transitions to General Medicine. Prepare for inter-facility transfers.'
          };
          break;
        case 'SURGEON_DEFICIT':
          result = {
            title: 'Surgical Resource Deficit (2 Surgeons Unavailable)',
            bedStrain: 42,
            otDelay: 520,
            mortalityIncrease: 3.1,
            shortfall: 'Operating Theatre Slots',
            recommendation: 'Reschedule all Tier-3 elective procedures. Prioritize Emergency and Tier-1 Oncology cases. Extend morning shift for remaining surgical staff.'
          };
          break;
        default:
          result = {
            title: 'Baseline Stress Test',
            bedStrain: 15,
            otDelay: 0,
            mortalityIncrease: 0,
            shortfall: 'None',
            recommendation: 'Continue standard operations.'
          };
      }

      setActiveSimulation(result);
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Workforce Intelligence</h2>
          <p className="text-sm text-slate-500">Strategic staffing & scenario modeling</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Surge Watch: Active</span>
          </div>
        </div>
      </div>

      <section className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3 space-y-6">
            <div>
              <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">Simulation Engine</h3>
              <h4 className="text-white text-xl font-black tracking-tight uppercase">Strategic Stress Simulator</h4>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Test hospital resilience against high-impact events.
              </p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => runSimulation('MASS_ARRIVAL')}
                disabled={isSimulating}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-50"
              >
                <div className="text-left">
                  <p className="text-white text-xs font-bold">Mass Patient Surge</p>
                  <p className="text-[10px] text-slate-500">+30 Arrivals / Hour</p>
                </div>
                <span className="text-xl group-hover:scale-125 transition-transform">🚑</span>
              </button>
              
              <button 
                onClick={() => runSimulation('ICU_CRISIS')}
                disabled={isSimulating}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-50"
              >
                <div className="text-left">
                  <p className="text-white text-xs font-bold">ICU Capacity Crisis</p>
                  <p className="text-[10px] text-slate-500">95% Occupancy Limit</p>
                </div>
                <span className="text-xl group-hover:scale-125 transition-transform">🏥</span>
              </button>

              <button 
                onClick={() => runSimulation('SURGEON_DEFICIT')}
                disabled={isSimulating}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-50"
              >
                <div className="text-left">
                  <p className="text-white text-xs font-bold">Surgical Staff Deficit</p>
                  <p className="text-[10px] text-slate-500">2 Surgeons Unavailable</p>
                </div>
                <span className="text-xl group-hover:scale-125 transition-transform">🔬</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center relative min-h-[320px]">
            {isSimulating ? (
              <div className="flex flex-col items-center gap-6 animate-pulse">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
                <p className="text-blue-400 font-black text-xs uppercase tracking-widest">Running Predictive Models...</p>
              </div>
            ) : activeSimulation ? (
              <div className="w-full space-y-8 animate-fadeIn">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase mb-2 inline-block">Impact Analysis</span>
                    <h5 className="text-white text-lg font-black">{activeSimulation.title}</h5>
                  </div>
                  <button onClick={() => setActiveSimulation(null)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Risk Increase</p>
                    <p className="text-2xl font-black text-rose-500">+{activeSimulation.mortalityIncrease}%</p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">OT Backlog</p>
                    <p className="text-2xl font-black text-amber-500">+{activeSimulation.otDelay}m</p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Bed Strain</p>
                    <p className="text-2xl font-black text-blue-400">{activeSimulation.bedStrain}%</p>
                  </div>
                </div>

                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center gap-6">
                  <div className="shrink-0">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 text-2xl">⚡</div>
                  </div>
                  <div>
                    <p className="text-white text-[10px] font-black uppercase tracking-widest mb-1">Mitigation Strategy</p>
                    <p className="text-slate-300 text-sm italic leading-relaxed">{activeSimulation.recommendation}</p>
                    <p className="text-[10px] text-rose-400 font-bold uppercase mt-3">Critical Gap: {activeSimulation.shortfall}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 opacity-50">
                <div className="text-6xl mb-4">🔮</div>
                <p className="text-slate-500 font-bold text-sm">Select a scenario to model system resilience</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Staff Load</p>
          <p className="text-3xl font-black text-slate-900">
            {Math.round(staff.reduce((acc, s) => acc + s.workload, 0) / staff.length)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff : Patient</p>
          <p className="text-3xl font-black text-slate-900">
            1 : {(activePatients.length / staff.filter(s => s.status === StaffStatus.ACTIVE).length).toFixed(1)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Duty</p>
          <p className="text-3xl font-black text-slate-900">{staff.filter(s => s.status === StaffStatus.ACTIVE).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Personnel Roster</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-8 py-4">Staff Member</th>
              <th className="px-8 py-4">Role & Dept</th>
              <th className="px-8 py-4">Workload</th>
              <th className="px-8 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{s.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <div className="text-sm font-bold text-slate-700">{s.role}</div>
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{s.assignedWard}</div>
                </td>
                <td className="px-8 py-4 w-48">
                  <RiskMeter label="" value={s.workload} />
                </td>
                <td className="px-8 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    s.status === StaffStatus.ACTIVE ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    s.status === StaffStatus.BREAK ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                    'bg-slate-50 text-slate-700 border-slate-100'
                  }`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffingModule;
