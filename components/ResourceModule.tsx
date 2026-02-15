
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell 
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
  onLog, onUpdateResources, 
  onCreateRequest, onUpdateRequestStatus, 
  onCreateRefill, onUpdateRefillStatus 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transfers' | 'refills' | 'history'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<ResourceIntelligence | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form State for new transfer
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
    // Basic validation
    // Fix: Explicitly cast 'resources.blood' indexing to number to resolve TypeScript comparison error.
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
    if (['Delivered', 'Verified'].includes(status)) return 'bg-emerald-100 text-emerald-700';
    if (['In Transit', 'Shipped'].includes(status)) return 'bg-blue-100 text-blue-700';
    if (['Approved', 'Confirmed'].includes(status)) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 relative">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Resource Orchestration Hub</h2>
          <p className="text-sm text-slate-500">Live logistics, department transfers, and vendor refills</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {['overview', 'transfers', 'refills', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row">
              <div className="p-10 medical-gradient text-white flex flex-col items-center justify-center gap-6 md:w-80 shrink-0">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="transparent" />
                    <circle cx="80" cy="80" r="70" stroke="white" strokeWidth="12" fill="transparent" strokeDasharray={`${resources.oxygen.tankPercentage * 4.4} 440`} className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-black">{resources.oxygen.tankPercentage}%</span>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Oxygen Tank</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase text-blue-200 mb-1">Time to Empty</p>
                  <p className="text-2xl font-black">{aiInsight?.oxygenDepletionHours || '--'} Hours</p>
                </div>
              </div>
              <div className="flex-1 p-10 space-y-8 bg-white">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Bulk Supply & Cylinders</h3>
                  <button 
                    onClick={() => onCreateRefill({ type: 'Oxygen', quantity: 20, vendor: 'AirGas Global' })}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800"
                  >
                    + Rapid Tank Refill
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cylinders Ready</p>
                    <p className="text-3xl font-black text-slate-800">{resources.oxygen.cylindersAvailable}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ward Utilization</p>
                    <p className="text-3xl font-black text-indigo-600">{resources.oxygen.cylindersInUse}</p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                   <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">💡</div>
                   <p className="text-xs text-blue-700 font-medium leading-relaxed italic">
                     "AI Prediction: Expected demand surge in Pediatrics in 2 hours. Suggest pre-transferring 5 cylinders."
                   </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Blood Bank Availability</h3>
                <button 
                  onClick={() => setActiveTab('transfers')}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                >
                  Initiate Unit Transfer
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bloodData.map(b => (
                  <div key={b.group} className={`p-6 rounded-3xl border transition-all hover:scale-105 ${b.isLow ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xl font-black ${b.isLow ? 'text-rose-600' : 'text-slate-800'}`}>{b.group}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${b.isLow ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                        {b.isLow ? 'REFILL REQ' : 'SAFE'}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{b.units} <span className="text-[10px] text-slate-400 uppercase font-black">u</span></p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 text-7xl transition-transform group-hover:scale-110">🚛</div>
               <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">Logistics Intel</h3>
               <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Resource Strain</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${aiInsight?.resourceStrainIndex! > 70 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${aiInsight?.resourceStrainIndex || 40}%` }} />
                      </div>
                      <span className="text-2xl font-black text-white">{aiInsight?.resourceStrainIndex || '--'}%</span>
                    </div>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Smart Suggestion</p>
                    <p className="text-sm text-slate-300 leading-relaxed italic">"Inter-facility data shows St. Jude (H4) has AB- surplus. Recommend GPS transfer request."</p>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6 shrink-0 relative z-10">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Movement</h3>
                 <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black">{requests.filter(r => r.status !== 'Delivered').length} Pending</span>
               </div>
               <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                 {requests.filter(r => r.status !== 'Delivered').map(r => (
                   <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                     <div className="flex justify-between items-center">
                       <p className="text-xs font-black text-slate-800 uppercase">{r.type}: {r.subType || r.quantity}</p>
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${getStatusColor(r.status)}`}>{r.status}</span>
                     </div>
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{r.fromDept} ➔ {r.toDept}</p>
                   </div>
                 ))}
                 {requests.filter(r => r.status !== 'Delivered').length === 0 && (
                   <p className="text-xs text-slate-400 italic text-center py-4">No active internal transfers.</p>
                 )}
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Health</h3>
               <div className="space-y-4">
                  {medicationData.map(m => (
                    <div key={m.name} className="flex flex-col gap-2 group">
                      <div className="flex justify-between items-center">
                         <p className="text-xs font-black text-slate-700 uppercase">{m.name}</p>
                         {m.status === 'Critical' && (
                           <button 
                             onClick={() => handleAutoRefill(m.name)}
                             className="text-[8px] font-black text-rose-600 hover:text-rose-800 uppercase animate-pulse"
                           >
                             Trigger Refill
                           </button>
                         )}
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className={`h-full ${m.status === 'Critical' ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, (m.stock / m.threshold) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
               <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Inter-Departmental Logistics</h3>
                  <p className="text-sm text-slate-400">Request and verify resource movement between wards</p>
               </div>
               <button 
                 onClick={() => setShowTransferModal(true)}
                 className="px-8 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
               >
                 + Create Transfer Request
               </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="px-6 py-4">Ref ID</th>
                    <th className="px-6 py-4">Resource Details</th>
                    <th className="px-6 py-4">Logistics Route</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Current Stage</th>
                    <th className="px-6 py-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 font-mono text-xs text-slate-500 font-bold">{req.id}</td>
                      <td className="px-6 py-5">
                         <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800 uppercase">{req.type} {req.subType ? `(${req.subType})` : ''}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{req.quantity} Units</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase">{req.fromDept}</span>
                            <span className="text-slate-300">➔</span>
                            <span className="text-[10px] font-black text-blue-600 uppercase">{req.toDept}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                           req.urgency === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                           req.urgency === 'Urgent' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                           'bg-slate-50 text-slate-500 border-slate-100'
                         }`}>{req.urgency}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(req.status)}`}>
                           {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <div className="flex justify-end gap-2">
                           {req.status === 'Requested' && (
                             <button onClick={() => onUpdateRequestStatus(req.id, 'Approved')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase">Approve</button>
                           )}
                           {req.status === 'Approved' && (
                             <button onClick={() => onUpdateRequestStatus(req.id, 'In Transit')} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase">Dispatch</button>
                           )}
                           {req.status === 'In Transit' && (
                             <button onClick={() => onUpdateRequestStatus(req.id, 'Delivered')} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase">Sign Off</button>
                           )}
                           {req.status === 'Delivered' && (
                             <span className="text-emerald-500 text-xs font-bold">✓ Complete</span>
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

      {activeTab === 'refills' && (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
             <div className="absolute top-0 right-0 p-12 opacity-10 text-9xl">⛽</div>
             <div className="relative z-10 space-y-6 max-w-2xl">
                <h3 className="text-3xl font-black uppercase tracking-tight">Vendor Supply Chain</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Managing external procurement and replenishment orders for critical biologics and gases.
                </p>
                <div className="flex gap-4 pt-4">
                   <button 
                    onClick={() => onCreateRefill({ type: 'Oxygen', quantity: 20, vendor: 'AirGas Medical' })}
                    className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-50 transition-all active:scale-95"
                   >
                     Order Bulk Oxygen (20%)
                   </button>
                   <button 
                    onClick={() => onCreateRefill({ type: 'Blood', subType: 'O-', quantity: 12, vendor: 'National Blood Bank' })}
                    className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all active:scale-95"
                   >
                     Emergency O- Order
                   </button>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Active Replenishment Pipeline</h3>
             <div className="space-y-4">
                {refills.map(ref => (
                  <div key={ref.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-white hover:shadow-lg transition-all">
                    <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                         ref.type === 'Oxygen' ? 'bg-blue-100 text-blue-600' : ref.type === 'Blood' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                       }`}>
                         {ref.type === 'Oxygen' ? '💨' : ref.type === 'Blood' ? '💉' : '💊'}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <h4 className="text-base font-black text-slate-800 uppercase">{ref.type} {ref.subType && `(${ref.subType})`}</h4>
                             <span className="text-[10px] font-black text-slate-400 font-mono">PO: {ref.id.split('-')[1]}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-bold uppercase mt-1">Vendor: {ref.vendor} • Amount: {ref.quantity} {ref.type === 'Oxygen' ? '%' : 'u'}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-3">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(ref.status)}`}>{ref.status}</span>
                       <div className="flex gap-2">
                          {ref.status === 'Requested' && <button onClick={() => onUpdateRefillStatus(ref.id, 'Confirmed')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Confirm Receipt</button>}
                          {ref.status === 'Confirmed' && <button onClick={() => onUpdateRefillStatus(ref.id, 'Shipped')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Mark Shipped</button>}
                          {ref.status === 'Shipped' && <button onClick={() => onUpdateRefillStatus(ref.id, 'Delivered')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Receive Dock</button>}
                          {ref.status === 'Delivered' && <button onClick={() => onUpdateRefillStatus(ref.id, 'Verified')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Verify & Stock</button>}
                          {ref.status === 'Verified' && <span className="text-emerald-500 text-xs font-black uppercase">Verified Stock</span>}
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Transfer Request Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
            <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Initiate Transfer</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Inter-Departmental Logistics Flow</p>
               </div>
               <button onClick={() => setShowTransferModal(false)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-50 transition-all">✕</button>
            </div>
            
            <div className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                    <select 
                      value={newTransfer.type}
                      onChange={e => setNewTransfer({...newTransfer, type: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                    >
                      <option value="Blood">Blood Units</option>
                      <option value="Oxygen">Oxygen Cylinders</option>
                      <option value="Ventilator">Ventilator Unit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sub-Type</label>
                    <input 
                      type="text"
                      placeholder="e.g. O-"
                      value={newTransfer.subType}
                      onChange={e => setNewTransfer({...newTransfer, subType: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                    />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">To Department</label>
                    <select 
                      value={newTransfer.toDept}
                      onChange={e => setNewTransfer({...newTransfer, toDept: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                    >
                      {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Urgency</label>
                    <select 
                      value={newTransfer.urgency}
                      onChange={e => setNewTransfer({...newTransfer, urgency: e.target.value as any})}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold ${
                        newTransfer.urgency === 'Critical' ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
               </div>

               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantity (Units)</label>
                 <div className="flex items-center gap-6">
                    <input 
                      type="range" min="1" max="15"
                      value={newTransfer.quantity}
                      onChange={e => setNewTransfer({...newTransfer, quantity: parseInt(e.target.value)})}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-3xl font-black text-slate-900 w-12">{newTransfer.quantity}</span>
                 </div>
               </div>

               <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Pre-Approval Check</p>
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    {newTransfer.type === 'Blood' && (resources.blood[newTransfer.subType as BloodGroup] as number) < newTransfer.quantity 
                      ? '❌ Insufficient stock in Blood Bank for this transfer.'
                      : '✅ Inventory parity check passed. Request will proceed to approval.'}
                  </p>
               </div>
            </div>

            <div className="p-10 border-t bg-slate-50 flex justify-end gap-3">
               <button onClick={() => setShowTransferModal(false)} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">Discard</button>
               <button 
                 onClick={handleCreateRequest} 
                 className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95"
               >
                 Submit Request
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceModule;
