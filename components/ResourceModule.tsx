
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { ResourceInventory, Patient, OT, BloodGroup, AuditLog, ResourceRequest, RefillOrder, Department } from '../types';
import { analyzeResourceIntelligence, ResourceIntelligence } from '../services/geminiService';

interface ResourceModuleProps {
  resources: ResourceInventory;
  patients: Patient[];
  ots: OT[];
  requests: ResourceRequest[];
  refills: RefillOrder[];
  onLog?: (action: string, details: string, severity: AuditLog['severity']) => void;
  onUpdateResources?: (updater: (prev: ResourceInventory) => ResourceInventory) => void;
  onCreateRequest: (req: Omit<ResourceRequest, 'id' | 'timestamp' | 'requestedBy' | 'status'>) => void;
  onUpdateRequestStatus: (id: string, status: ResourceRequest['status']) => void;
  onCreateRefill: (order: Omit<RefillOrder, 'id' | 'timestamp' | 'status'>) => void;
  onUpdateRefillStatus: (id: string, status: RefillOrder['status']) => void;
}

const ResourceModule: React.FC<ResourceModuleProps> = ({
  resources, patients, ots, requests, refills,
  onCreateRequest, onUpdateRequestStatus,
  onCreateRefill, onUpdateRefillStatus
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transfers' | 'refills' | 'history'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<ResourceIntelligence | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [newTransfer, setNewTransfer] = useState({
    type: 'Blood' as any,
    subType: 'O-',
    quantity: 1,
    fromDept: Department.BLOOD_BANK,
    toDept: Department.EMERGENCY,
    urgency: 'Normal' as any
  });

  useEffect(() => {
    const fetchAIAnalysis = async () => {
      setIsAnalyzing(true);
      const result = await analyzeResourceIntelligence(resources, patients, ots);
      setAiInsight(result);
      setIsAnalyzing(false);
    };
    fetchAIAnalysis();
  }, [resources, patients.length, ots.length]);

  const bloodData = Object.entries(resources.blood).map(([group, units]) => ({
    group: group as BloodGroup,
    units,
    isLow: units < 10
  }));

  const medicationData = resources.medicalSupplies.criticalMeds.map(m => ({
    name: m.name,
    stock: m.stock,
    threshold: m.minThreshold,
    status: m.stock < m.minThreshold ? 'Critical' : 'Stable'
  }));

  const handleCreateRequest = () => {
    if (newTransfer.type === 'Blood' && (resources.blood[newTransfer.subType as BloodGroup] as number) < newTransfer.quantity) {
      alert("INSUFFICIENT STOCK: Requested quantity exceeds available units in Blood Bank.");
      return;
    }
    onCreateRequest(newTransfer);
    setShowTransferModal(false);
  };

  const handleAutoRefill = (medName: string) => {
    onCreateRefill({
      type: 'Medication',
      subType: medName,
      quantity: 100,
      vendor: 'PharmaCore Global'
    });
  };

  const getStatusColor = (status: string) => {
    if (['Delivered', 'Verified'].includes(status)) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (['In Transit', 'Shipped'].includes(status)) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (['Approved', 'Confirmed'].includes(status)) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-slate-50 text-slate-400 border-slate-100';
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-32 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Resource Orchestration</h2>
          <p className="text-lg font-semibold text-slate-500 mt-2">Live logistics, department transfers, and supply chain integrity nodes.</p>
        </div>
        <div className="flex bg-white p-2 rounded-[2rem] border-2 border-blue-100 shadow-xl overflow-hidden">
          {['overview', 'transfers', 'refills', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-2xl shadow-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="glass-card overflow-hidden flex flex-col xl:flex-row group border-2 border-blue-100 shadow-2xl">
              <div className="p-16 bg-blue-600 text-white flex flex-col items-center justify-center gap-10 xl:w-[28rem] shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0%,_transparent_70%)] opacity-30"></div>
                <div className="relative w-64 h-64 group-hover:scale-110 transition-transform duration-700">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="128" cy="128" r="115" stroke="rgba(255,255,255,0.15)" strokeWidth="20" fill="transparent" />
                    <circle cx="128" cy="128" r="115" stroke="white" strokeWidth="20" fill="transparent" strokeDasharray={`${resources.oxygen.tankPercentage * 7.22} 722`} className="transition-all duration-1000" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-baseline justify-center leading-none">
                      <span className="text-7xl font-black tracking-tighter">{resources.oxygen.tankPercentage}</span>
                      <span className="text-3xl font-black tracking-tighter ml-1">%</span>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-10 flex justify-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-80 whitespace-nowrap">Oxygen Reserve</span>
                  </div>
                </div>
                <div className="text-center space-y-3 relative z-10">
                  <p className="text-[11px] font-black uppercase text-blue-100 tracking-[0.4em]">Time to Depletion</p>
                  <p className="text-5xl font-black text-white tracking-widest leading-none">{aiInsight?.oxygenDepletionHours || '--'}H</p>
                </div>
              </div>
              <div className="flex-1 p-16 space-y-12 bg-white">
                <div className="flex justify-between items-center border-b-2 border-blue-50 pb-8">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Supply Matrix Node</h3>
                  <button
                    onClick={() => onCreateRefill({ type: 'Oxygen', quantity: 20, vendor: 'AirGas Global' })}
                    className="text-[11px] font-black text-blue-600 hover:text-white uppercase tracking-[0.3em] bg-blue-50 hover:bg-blue-600 px-6 py-3 rounded-2xl transition-all shadow-sm"
                  >
                    + Rapid Replenishment
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-10">
                  <div className="bg-blue-50/50 p-10 rounded-[2.5rem] border-2 border-blue-100 group/stat hover:bg-blue-600 transition-all duration-500 shadow-sm">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 group-hover/stat:text-white/70">Cylinders Nominal</p>
                    <p className="text-6xl font-black text-slate-900 tracking-tighter group-hover/stat:text-white">{resources.oxygen.cylindersAvailable}</p>
                  </div>
                  <div className="bg-indigo-50/50 p-10 rounded-[2.5rem] border-2 border-indigo-100 group/stat hover:bg-indigo-600 transition-all duration-500 shadow-sm">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 group-hover/stat:text-white/70">Active Utilization</p>
                    <p className="text-6xl font-black text-indigo-700 tracking-tighter group-hover/stat:text-white">{resources.oxygen.cylindersInUse}</p>
                  </div>
                </div>
                <div className="p-8 bg-blue-50/50 border-2 border-blue-100 rounded-[2rem] flex items-center gap-8 relative overflow-hidden shadow-sm">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-4xl shadow-2xl shadow-blue-100 text-white">💡</div>
                  <p className="text-sm text-slate-700 font-black leading-relaxed italic border-l-4 border-blue-400 pl-6">
                    "AI Prediction: Expected demand surge in Pediatrics in 2 hours. Suggest pre-transferring 5 cylinders to mitigate latency."
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-16 hover:border-blue-200 transition-all duration-500 border-2 border-blue-100">
              <div className="flex justify-between items-center mb-12 border-b-2 border-blue-50 pb-8">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Blood Bank Inventory Hub</h3>
                <button
                  onClick={() => setActiveTab('transfers')}
                  className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] hover:bg-blue-50 px-6 py-2 rounded-xl transition-all"
                >
                  Deploy Command Transfer →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                {bloodData.map(b => (
                  <div key={b.group} className={`p-10 rounded-[3rem] border-2 transition-all duration-500 hover:-translate-y-2 shadow-sm ${b.isLow ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-white border-blue-50 hover:border-blue-200'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <span className={`text-4xl font-black tracking-tighter ${b.isLow ? 'text-rose-600' : 'text-slate-900'}`}>{b.group}</span>
                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${b.isLow ? 'bg-rose-600 text-white animate-pulse shadow-lg' : 'bg-blue-50 text-blue-600'}`}>
                        {b.isLow ? 'REFILL' : 'NOMINAL'}
                      </span>
                    </div>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">{b.units} <span className="text-[12px] text-slate-400 uppercase font-black tracking-widest ml-1">Units</span></p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div className="glass-card p-12 relative overflow-hidden group border-2 border-blue-100 shadow-xl bg-white">
              <div className="absolute -bottom-16 -right-16 text-[15rem] text-blue-600/5 rotate-12 pointer-events-none group-hover:scale-125 transition-transform duration-1000">🚛</div>
              <h3 className="text-blue-600 text-[11px] font-black uppercase tracking-[0.5em] mb-12 flex items-center gap-4">
                <span className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></span>
                Logistics Intelligence
              </h3>
              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="flex justify-between items-baseline border-b-2 border-blue-50 pb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Resource Strain Index</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">{aiInsight?.resourceStrainIndex || '--'}</span>
                      <span className="text-sm font-black text-slate-400 tracking-tighter">%</span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-blue-50 rounded-full overflow-hidden border-2 border-blue-100 shadow-inner">
                    <div className={`h-full transition-all duration-1000 ${aiInsight?.resourceStrainIndex! > 70 ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${aiInsight?.resourceStrainIndex || 40}%` }} />
                  </div>
                </div>
                <div className="p-10 bg-blue-50/50 border-2 border-blue-100 rounded-[2.5rem] relative shadow-sm">
                  <p className="text-[11px] font-black text-blue-700 uppercase tracking-[0.4em] mb-4">Smart Allocation Node</p>
                  <p className="text-sm text-slate-800 leading-relaxed italic font-bold">"Cross-facility data indicates Surplus at Node H4 (St. Jude). Recommend automated redirection request."</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-12 flex flex-col group border-2 border-blue-100 shadow-xl bg-white">
              <div className="flex justify-between items-center mb-10 border-b-2 border-blue-50 pb-6">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Active Supply Matrix</h3>
                <span className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-blue-100">{requests.filter(r => r.status !== 'Delivered').length} Nodes</span>
              </div>
              <div className="space-y-6 max-h-[25rem] overflow-y-auto custom-scrollbar pr-3">
                {requests.filter(r => r.status !== 'Delivered').map(r => (
                  <div key={r.id} className="p-8 bg-blue-50/20 rounded-[2rem] border-2 border-blue-50 flex flex-col gap-4 group/item hover:bg-white hover:border-blue-600 transition-all duration-300 cursor-default shadow-sm hover:shadow-xl hover:shadow-blue-50">
                    <div className="flex justify-between items-center">
                      <p className="text-md font-black text-slate-900 uppercase tracking-tight">{r.type}: <span className="text-blue-600">{r.subType || r.quantity}</span></p>
                      <span className={`text-[9px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest shadow-md ${getStatusColor(r.status)}`}>{r.status}</span>
                    </div>
                    <div className="flex items-center gap-4 opacity-50 group-hover/item:opacity-100 transition-all">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{r.fromDept}</span>
                      <span className="text-blue-400 font-black">➔</span>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{r.toDept}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-12 flex flex-col border-2 border-blue-100 shadow-xl bg-white">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 border-b-2 border-blue-50 pb-6">Pharmacy Critical Core</h3>
              <div className="space-y-10">
                {medicationData.map(m => (
                  <div key={m.name} className="space-y-4 group/p">
                    <div className="flex justify-between items-center">
                      <p className="text-md font-black text-slate-900 uppercase tracking-tight group-hover/p:text-blue-600 transition-colors uppercase">{m.name}</p>
                      {m.status === 'Critical' && (
                        <button
                          onClick={() => handleAutoRefill(m.name)}
                          className="text-[10px] font-black text-rose-600 hover:text-white uppercase tracking-[0.2em] animate-pulse border-2 border-rose-100 bg-rose-50 px-5 py-2 rounded-2xl hover:bg-rose-600 transition-all"
                        >
                          Refill Node
                        </button>
                      )}
                    </div>
                    <div className="h-2 w-full bg-blue-50 rounded-full overflow-hidden border-2 border-blue-100 shadow-inner">
                      <div className={`h-full transition-all duration-1000 ${m.status === 'Critical' ? 'bg-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, (m.stock / m.threshold) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="animate-fadeIn">
          <div className="glass-card p-16 border-2 border-blue-100 shadow-2xl bg-white">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 mb-16 border-b-4 border-blue-50 pb-12">
              <div>
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Hospital Logistics Matrix</h3>
                <p className="text-lg font-semibold text-slate-500 mt-3">Verify and command high-priority resource distribution nodes.</p>
              </div>
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-16 py-6 bg-blue-600 text-white text-[12px] font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
              >
                + Deploy Logistics Payload
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] border-b-2 border-blue-50">
                  <tr>
                    <th className="px-12 py-8">Protocol ID</th>
                    <th className="px-12 py-8">Resource identification</th>
                    <th className="px-12 py-8">Logistics Architecture</th>
                    <th className="px-12 py-8">Acuity</th>
                    <th className="px-12 py-8">Validation Stage</th>
                    <th className="px-12 py-8 text-right">Command Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-blue-50 bg-white">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-blue-50 transition-all duration-300 group">
                      <td className="px-12 py-10 font-mono text-[11px] text-slate-400 font-black">#{req.id.split('-')[1]}</td>
                      <td className="px-12 py-10">
                        <div className="flex flex-col">
                          <span className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-all">{req.type} {req.subType ? `// ${req.subType}` : ''}</span>
                          <span className="text-[11px] text-slate-400 font-black uppercase mt-2 tracking-[0.2em]">{req.quantity} Functional Units</span>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-6">
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{req.fromDept}</span>
                          <span className="text-blue-400 font-black">➔</span>
                          <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">{req.toDept}</span>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <span className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase border-2 tracking-[0.2em] shadow-sm transition-all ${req.urgency === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          req.urgency === 'Urgent' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>{req.urgency}</span>
                      </td>
                      <td className="px-12 py-10">
                        <span className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase border-2 tracking-[0.3em] shadow-lg ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-12 py-10 text-right">
                        <div className="flex justify-end gap-4">
                          {req.status === 'Requested' && (
                            <button onClick={() => onUpdateRequestStatus(req.id, 'Approved')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Validate</button>
                          )}
                          {req.status === 'Approved' && (
                            <button onClick={() => onUpdateRequestStatus(req.id, 'In Transit')} className="px-8 py-4 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95">Deploy</button>
                          )}
                          {req.status === 'In Transit' && (
                            <button onClick={() => onUpdateRequestStatus(req.id, 'Delivered')} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">Confirm Arrival</button>
                          )}
                          {req.status === 'Delivered' && (
                            <div className="flex items-center gap-4 text-emerald-600">
                              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                              <span className="text-[11px] font-black uppercase tracking-[0.3em]">Logistics Finalized</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'refills' || activeTab === 'history') && (
        <div className="space-y-12 animate-fadeIn">
          {activeTab === 'refills' && (
            <div className="bg-indigo-600 rounded-[4rem] p-16 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -bottom-32 -right-32 p-32 opacity-10 text-[25rem] transition-transform duration-1000 group-hover:scale-110 pointer-events-none grayscale group-hover:grayscale-0">🔋</div>
              <div className="relative z-10 space-y-12 max-w-4xl">
                <div className="space-y-6">
                  <span className="text-indigo-100 text-[12px] font-black uppercase tracking-[0.5em] mb-6 flex items-center gap-6">
                    <span className="w-12 h-[2px] bg-white/30"></span>
                    External Logistics Core
                  </span>
                  <h3 className="text-6xl font-black uppercase tracking-tighter">Global Supply Matrix</h3>
                  <p className="text-indigo-50 text-xl leading-relaxed font-bold opacity-80">
                    Managing critical procurement streams for high-acuity biologics, medical gases, and neural pharmaceuticals across authorized global vendors.
                  </p>
                </div>
                <div className="flex flex-wrap gap-8 pt-6">
                  <button
                    onClick={() => onCreateRefill({ type: 'Oxygen', quantity: 20, vendor: 'AirGas Medical' })}
                    className="px-16 py-7 bg-white text-indigo-900 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-50 transition-all active:scale-95 shadow-indigo-900/40"
                  >
                    Order Oxygen Payload
                  </button>
                  <button
                    onClick={() => onCreateRefill({ type: 'Blood', subType: 'O-', quantity: 12, vendor: 'National Blood Bank' })}
                    className="px-16 py-7 bg-rose-500 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-rose-600 transition-all active:scale-95 shadow-rose-900/40 border-4 border-rose-400/30"
                  >
                    Emergency Blood Drop
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-16 bg-white border-2 border-blue-100 shadow-2xl">
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.4em] mb-12 border-b-4 border-blue-50 pb-8">Replenishment Stream Hub</h3>
            <div className="space-y-8">
              {refills.map(ref => (
                <div key={ref.id} className="p-10 bg-blue-50/20 border-2 border-blue-100 rounded-[3.5rem] flex flex-col xl:flex-row xl:items-center justify-between gap-12 group/ref hover:bg-white hover:border-blue-600 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-blue-50">
                  <div className="flex items-center gap-10">
                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl transition-all duration-700 group-hover/ref:scale-110 group-hover/ref:rotate-6 ${ref.type === 'Oxygen' ? 'bg-white text-blue-600 border-4 border-blue-50 shadow-blue-100' :
                      ref.type === 'Blood' ? 'bg-white text-rose-600 border-4 border-rose-50 shadow-rose-100' :
                        'bg-white text-amber-600 border-4 border-amber-50 shadow-amber-100'
                      }`}>
                      {ref.type === 'Oxygen' ? '💨' : ref.type === 'Blood' ? '🩸' : '💊'}
                    </div>
                    <div>
                      <div className="flex items-center gap-6">
                        <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{ref.type} {ref.subType && `// ${ref.subType}`}</h4>
                        <span className="text-[11px] font-black text-slate-400 font-mono tracking-[0.3em] bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">PO-{ref.id.split('-')[1]}</span>
                      </div>
                      <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3">Vendor Node: <span className="text-blue-600">{ref.vendor}</span> • Matrix Load: {ref.quantity} {ref.type === 'Oxygen' ? '%' : 'u'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <span className={`px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] border-2 shadow-xl ${getStatusColor(ref.status)}`}>{ref.status}</span>
                    <div className="flex gap-6">
                      {ref.status === 'Requested' && <button onClick={() => onUpdateRefillStatus(ref.id, 'Confirmed')} className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] hover:bg-blue-50 px-6 py-2 rounded-xl transition-all">Validate Stream</button>}
                      {ref.status === 'Confirmed' && <button onClick={() => onUpdateRefillStatus(ref.id, 'Shipped')} className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] hover:bg-blue-50 px-6 py-2 rounded-xl transition-all">Command Shift</button>}
                      {ref.status === 'Shipped' && <button onClick={() => onUpdateRefillStatus(ref.id, 'Delivered')} className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] hover:bg-blue-50 px-6 py-2 rounded-xl transition-all">Mark Docked</button>}
                      {ref.status === 'Delivered' && <button onClick={() => onUpdateRefillStatus(ref.id, 'Verified')} className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-blue-100 transition-all active:scale-95">Complete Audit</button>}
                      {ref.status === 'Verified' && (
                        <div className="flex items-center gap-4 text-emerald-600">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                          <span className="text-[11px] font-black uppercase tracking-[0.4em]">Successfully Stocked</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-slate-900/60 backdrop-blur-3xl animate-fadeIn">
          <div className="bg-white w-full max-w-2xl shadow-[0_50px_100px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col rounded-[4rem] border-8 border-blue-50">
            <div className="p-16 border-b-4 border-blue-50 bg-blue-50/30 flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Initialize Transfer Node</h3>
                <p className="text-[11px] text-blue-600 font-black uppercase tracking-[0.5em] mt-3">Logistics Architecture Config Protocol</p>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="w-16 h-16 bg-white border-2 border-blue-50 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-600 transition-all text-2xl shadow-sm">✕</button>
            </div>

            <div className="p-16 space-y-12">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Category Class</label>
                  <select
                    value={newTransfer.type}
                    onChange={e => setNewTransfer({ ...newTransfer, type: e.target.value as any })}
                    className="w-full bg-blue-50 border-4 border-white rounded-3xl px-8 py-6 text-lg font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 appearance-none shadow-inner"
                  >
                    <option value="Blood">Blood Payload</option>
                    <option value="Oxygen">Oxygen Reserve</option>
                    <option value="Ventilator">Ventilator Unit</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Payload Marker</label>
                  <input
                    type="text"
                    placeholder="e.g. O-"
                    value={newTransfer.subType}
                    onChange={e => setNewTransfer({ ...newTransfer, subType: e.target.value })}
                    className="w-full bg-blue-50 border-4 border-white rounded-3xl px-8 py-6 text-lg font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Target Sector</label>
                  <select
                    value={newTransfer.toDept}
                    onChange={e => setNewTransfer({ ...newTransfer, toDept: e.target.value as any })}
                    className="w-full bg-blue-50 border-4 border-white rounded-3xl px-8 py-6 text-lg font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 appearance-none shadow-inner"
                  >
                    {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Priority Level</label>
                  <select
                    value={newTransfer.urgency}
                    onChange={e => setNewTransfer({ ...newTransfer, urgency: e.target.value as any })}
                    className={`w-full bg-blue-50 border-4 border-white rounded-3xl px-8 py-6 text-lg font-black outline-none focus:ring-4 focus:ring-blue-100 appearance-none shadow-inner ${newTransfer.urgency === 'Critical' ? 'text-rose-600' : 'text-slate-900'
                      }`}
                  >
                    <option value="Normal">Standard</option>
                    <option value="Urgent">Urgent Hub</option>
                    <option value="Critical">Critical Node</option>
                  </select>
                </div>
              </div>

              <div className="space-y-8">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Payload Load (Units)</label>
                <div className="flex items-center gap-12 bg-blue-50 p-8 rounded-[2.5rem] border-4 border-white shadow-inner">
                  <input
                    type="range" min="1" max="15"
                    value={newTransfer.quantity}
                    onChange={e => setNewTransfer({ ...newTransfer, quantity: parseInt(e.target.value) })}
                    className="flex-1 h-3 bg-blue-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-7xl font-black text-blue-600 tracking-tighter w-24">{newTransfer.quantity}</span>
                </div>
              </div>

              <div className="p-10 bg-indigo-50 border-4 border-white rounded-[3rem] relative overflow-hidden shadow-xl shadow-indigo-100/50">
                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-4">System Pre-Logistics Scan</p>
                <p className="text-lg text-indigo-900 leading-relaxed italic font-bold">
                  {newTransfer.type === 'Blood' && (resources.blood[newTransfer.subType as BloodGroup] as number) < newTransfer.quantity
                    ? '❌ DEPLETED STOCK: Command will fail due to inventory mismatch in central vault.'
                    : '✅ NOMINAL: System parity check passed. Payload ready for orchestration deployment.'}
                </p>
              </div>
            </div>

            <div className="p-16 border-t-4 border-blue-50 bg-blue-50/30 flex justify-end gap-10">
              <button onClick={() => setShowTransferModal(false)} className="px-12 py-6 bg-transparent text-slate-400 hover:text-slate-900 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] transition-colors font-bold">Abort Command</button>
              <button
                onClick={handleCreateRequest}
                className="px-20 py-7 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl shadow-blue-100 active:scale-95 transition-all"
              >
                Execute Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceModule;
