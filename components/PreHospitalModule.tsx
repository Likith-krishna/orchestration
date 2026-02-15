
import React, { useState, useEffect } from 'react';
import { Patient, Ambulance, ExternalHospital, Department, PatientStatus, RiskLevel, BloodGroup } from '../types';
import { calculateOptimalHospital, getTriageChatResponse, OptimalHospitalResponse } from '../services/geminiService';
import HospitalGISMap from './HospitalGISMap';

interface PreHospitalModuleProps {
  ambulances: Ambulance[];
  externalHospitals: ExternalHospital[];
  onDispatchToExternal: (hospitalId: string) => void;
}

const RESOURCE_OPTIONS = [
  { id: 'all', label: 'All Resources', icon: '📋' },
  { id: 'icu', label: 'ICU Vacancy', icon: '🛏️' },
  { id: 'blood', label: 'Blood Supply', icon: '🩸' },
  { id: 'oxygen', label: 'Oxygen Supply', icon: '💨' },
  { id: 'surgery', label: 'Surgery / OT', icon: '🔬' }
];

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PreHospitalModule: React.FC<PreHospitalModuleProps> = ({ ambulances, externalHospitals, onDispatchToExternal }) => {
  const [activeTab, setActiveTab] = useState<'citizen' | 'ambulance' | 'tactical'>('citizen');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Hello, I am the Orchestra Virtual Triage Assistant. How can I help you or your family today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routingResult, setRoutingResult] = useState<OptimalHospitalResponse | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<ExternalHospital | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [searchTarget, setSearchTarget] = useState('all');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroup>('O-');
  
  // EMS Comm Link State
  const [activeCommUnit, setActiveCommUnit] = useState<Ambulance | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied")
      );
    }
  }, []);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessages = [...chatMessages, { role: 'user', content: userInput } as const];
    setChatMessages(newMessages);
    setUserInput('');
    setIsTyping(true);

    try {
      const response = await getTriageChatResponse(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        userInput
      );
      setChatMessages(prev => [...prev, { role: 'ai', content: response || 'I apologize, I am having trouble connecting.' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Emergency services protocol: If you are in immediate danger, call 911/local emergency.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRunTacticalOptimization = async () => {
    setIsCalculating(true);
    const tacticalPatient: any = { 
      symptoms: ['Trauma', 'Hemorrhage'], 
      severity: 10, 
      riskLevel: RiskLevel.CRITICAL 
    };
    
    let resourceLabel = RESOURCE_OPTIONS.find(r => r.id === searchTarget)?.label || 'General Triage';
    if (searchTarget === 'blood') {
      resourceLabel = `${selectedBloodGroup} Blood Units`;
    }
    
    const result = await calculateOptimalHospital(tacticalPatient, externalHospitals, resourceLabel);
    
    setRoutingResult(result);
    const h = externalHospitals.find(eh => eh.id === result.recommendedHospitalId);
    if (h) setSelectedHospital(h);
    setIsCalculating(false);
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tactical Pre-Hospital Orchestration</h2>
          <p className="text-sm text-slate-500 font-medium">Regional resource GIS & AI-optimized transfer command</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <button onClick={() => setActiveTab('citizen')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'citizen' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}>Citizen AI</button>
          <button onClick={() => setActiveTab('ambulance')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'ambulance' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}>Dispatch Hub</button>
          <button onClick={() => setActiveTab('tactical')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'tactical' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}>Tactical GIS</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-8 pb-4">
        {/* Main Interface Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          
          {activeTab === 'citizen' && (
            <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">🤖</div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Citizen Triage AI</h3>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Feed Active • Regional Watch</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                    <div className={`max-w-[80%] px-6 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm border ${
                      msg.role === 'user' ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleChatSubmit} className="p-8 bg-white border-t flex gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                <input 
                  type="text" 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium" 
                  placeholder="Describe your symptoms (e.g. Sharp headache for 2 hours)..."
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  disabled={isTyping}
                />
                <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">Send 🚀</button>
              </form>
            </div>
          )}

          {activeTab === 'ambulance' && (
            <div className="flex-1 flex flex-col bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl relative">
               <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                 <h3 className="text-white text-lg font-black uppercase tracking-tight">Active Dispatches</h3>
                 <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">
                   <span className="w-2 h-2 bg-emerald-400 rounded-full"></span> Telemetry Live
                 </span>
               </div>
               <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
                 {ambulances.map(amb => (
                   <div key={amb.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all group">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center text-xl">🚑</div>
                           <div>
                              <p className="text-[10px] font-black text-blue-400 uppercase mb-0.5">{amb.id}</p>
                              <h4 className="text-white font-black uppercase">{amb.type} Unit</h4>
                           </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          amb.status === 'Idle' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>{amb.status}</span>
                     </div>
                     <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                          <span>Patient Manifest:</span>
                          <span className="text-white">{amb.currentPatientId || 'EMPTY'}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                          <span>Target Terminal:</span>
                          <span className="text-blue-400 font-black">{amb.targetHospitalId || 'WAITING'}</span>
                        </div>
                     </div>
                     <button 
                      onClick={() => setActiveCommUnit(amb)}
                      className="mt-6 w-full py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all group-hover:shadow-lg group-hover:shadow-blue-900/20"
                     >
                       Access Tactical Comm Link
                     </button>
                   </div>
                 ))}
               </div>

               {activeCommUnit && (
                 <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col p-10 animate-fadeIn">
                    <div className="flex justify-between items-start mb-10">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20">📡</div>
                          <div>
                             <h4 className="text-white text-2xl font-black uppercase tracking-tight">EMS Tactical Link: {activeCommUnit.id}</h4>
                             <div className="flex items-center gap-3 mt-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Secure AES-256 Connection Verified</span>
                             </div>
                          </div>
                       </div>
                       <button onClick={() => setActiveCommUnit(null)} className="w-12 h-12 rounded-full bg-white/5 text-white hover:bg-rose-600 transition-all flex items-center justify-center text-xl">✕</button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
                       <div className="lg:col-span-2 flex flex-col gap-6">
                          <div className="bg-white/5 rounded-3xl border border-white/10 p-8 flex-1 overflow-hidden flex flex-col">
                             <div className="flex justify-between items-center mb-6">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En-Route Radio Transcript</h5>
                                <span className="text-[8px] font-bold text-slate-600 uppercase">Live Scribe Feed</span>
                             </div>
                             <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                   <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Paramedic-01 [14:32]</p>
                                   <p className="text-sm text-slate-300 italic">"Patient 45y male, GCS 15. Initial SpO2 recovered to 96% on 2L O2. ETA to City Central is 4 minutes."</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                   <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Dispatcher [14:35]</p>
                                   <p className="text-sm text-slate-300 italic">"Copy that AMB-01. Central is standing by with Cardiology team on Level 2."</p>
                                </div>
                                <div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-500/30 animate-pulse">
                                   <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Paramedic-01 [Just Now]</p>
                                   <p className="text-sm text-white font-bold italic">"Unit is crossing Main St. Initiating pre-arrival report transfer..."</p>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <div className="bg-white/5 rounded-3xl border border-white/10 p-8">
                             <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-6">Live Vitals Stream</h5>
                             <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Heart Rate</span>
                                   <span className="text-2xl font-black text-white">92 <span className="text-[8px] text-slate-500 font-bold uppercase">BPM</span></span>
                                </div>
                                <div className="w-full h-12 bg-white/5 rounded-lg relative overflow-hidden">
                                   <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                                   <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                                      <path d="M0 20 L10 20 L15 5 L20 35 L25 20 L40 20 L45 10 L50 30 L55 20 L70 20 L75 5 L80 35 L85 20 L100 20" fill="none" stroke="#10b981" strokeWidth="2" />
                                   </svg>
                                </div>
                                <div className="flex justify-between items-center">
                                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Oxygen Saturation</span>
                                   <span className="text-2xl font-black text-blue-400">96 <span className="text-[8px] text-slate-500 font-bold uppercase">%</span></span>
                                </div>
                             </div>
                          </div>

                          <div className="bg-white/5 rounded-3xl border border-white/10 p-8 flex-1">
                             <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Location Telemetry</h5>
                             <div className="h-40 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle,_#3b82f6_1px,_transparent_1px)] bg-[size:20px_20px] opacity-10"></div>
                                <div className="relative z-10 text-center">
                                   <p className="text-[10px] font-black text-blue-400 uppercase">GPS Tracking Active</p>
                                   <p className="text-xs text-slate-500 mt-1">12.9600° N, 77.6000° E</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'tactical' && (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
               <div className="shrink-0 bg-indigo-950 p-8 rounded-[2.5rem] border border-indigo-900 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-10 text-8xl transition-transform group-hover:rotate-12">🛰️</div>
                  <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-blue-500/40">🌍</div>
                    <div className="flex-1">
                      <h3 className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-2">Regional Resource GIS</h3>
                      <p className="text-2xl font-black text-white leading-tight uppercase tracking-tight">Orchestra Tactical Routing</p>
                      
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block w-full mb-1">Search Local Resource Target:</span>
                        {RESOURCE_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setSearchTarget(opt.id)}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-2 border ${
                              searchTarget === opt.id 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                                : 'bg-white/5 border-white/10 text-indigo-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{opt.icon}</span>
                            {opt.label}
                          </button>
                        ))}

                        {/* CONTEXTUAL BLOOD GROUP DROPDOWN */}
                        {searchTarget === 'blood' && (
                          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md p-1 rounded-2xl border border-white/10 ml-2 animate-fadeIn">
                             <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest px-3">Target Group:</span>
                             <select 
                               value={selectedBloodGroup}
                               onChange={(e) => setSelectedBloodGroup(e.target.value as BloodGroup)}
                               className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 outline-none border-none cursor-pointer hover:bg-slate-700 transition-colors"
                             >
                               {BLOOD_GROUPS.map(bg => (
                                 <option key={bg} value={bg}>{bg}</option>
                               ))}
                             </select>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={handleRunTacticalOptimization}
                      disabled={isCalculating}
                      className="bg-white text-indigo-950 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                      {isCalculating ? <div className="w-3 h-3 border-2 border-indigo-900/20 border-t-indigo-900 rounded-full animate-spin"></div> : '⚡'}
                      Analyze Nearest Options
                    </button>
                  </div>
               </div>

               <div className="flex-1 flex gap-6 min-h-0">
                  <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <HospitalGISMap 
                      hospitals={externalHospitals} 
                      userLocation={userLocation} 
                      onSelectHospital={setSelectedHospital}
                      selectedId={selectedHospital?.id}
                    />
                  </div>

                  {selectedHospital && (
                    <div className="w-96 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-8 flex flex-col gap-8 animate-slideInRight overflow-y-auto custom-scrollbar">
                       <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">Terminal Feed</span>
                            <h4 className="text-white text-xl font-black uppercase mt-1 tracking-tight">{selectedHospital.name}</h4>
                          </div>
                          <button onClick={() => setSelectedHospital(null)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className={`p-4 rounded-3xl border ${searchTarget === 'oxygen' ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/5'}`}>
                             <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Oxygen Tank</p>
                             <p className={`text-2xl font-black ${selectedHospital.oxygenLevel < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>{selectedHospital.oxygenLevel}%</p>
                          </div>
                          <div className={`p-4 rounded-3xl border ${searchTarget === 'icu' ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/5'}`}>
                             <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">ICU Vacancy</p>
                             <p className="text-2xl font-black text-blue-400">{selectedHospital.icuBedsAvailable}</p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h5 className={`text-[10px] font-black uppercase tracking-widest ${searchTarget === 'blood' ? 'text-blue-400' : 'text-slate-500'}`}>Rare Blood Inventory</h5>
                          <div className="grid grid-cols-2 gap-2">
                             {Object.entries(selectedHospital.bloodInventory).map(([grp, amt]) => {
                               const isTargeted = searchTarget === 'blood' && grp === selectedBloodGroup;
                               return (
                                 <div key={grp} className={`px-4 py-2 rounded-xl flex justify-between items-center transition-all ${isTargeted ? 'bg-blue-600/40 border border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse scale-105' : 'bg-white/5'}`}>
                                    <span className={`text-xs font-black ${isTargeted ? 'text-white' : 'text-slate-300'}`}>{grp}</span>
                                    {/* Fix: Explicitly cast 'amt' to number for comparison to resolve TypeScript operator error. */}
                                    <span className={`text-xs font-black ${(amt as number) < 5 ? 'text-rose-500' : isTargeted ? 'text-blue-200' : 'text-white'}`}>{amt}u</span>
                                 </div>
                               );
                             })}
                             {Object.keys(selectedHospital.bloodInventory).length === 0 && <p className="text-[10px] text-slate-600 italic">No rare units tracked.</p>}
                          </div>
                       </div>

                       {routingResult && routingResult.recommendedHospitalId === selectedHospital.id && (
                          <div className="p-6 bg-blue-600 rounded-3xl shadow-xl shadow-blue-900/40">
                             <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">🤖</span>
                                <p className="text-[10px] font-black uppercase text-blue-100 tracking-widest">AI Rationale</p>
                             </div>
                             <p className="text-xs font-bold text-white leading-relaxed italic">
                                "{routingResult.rationale}"
                             </p>
                          </div>
                       )}

                       <div className="mt-auto flex flex-col gap-3">
                          <button 
                            onClick={() => onDispatchToExternal(selectedHospital.id)}
                            className="w-full py-5 bg-white text-slate-900 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-50 transition-all active:scale-95"
                          >
                             Request Immediate Transfer
                          </button>
                          <button className="w-full py-4 bg-slate-800 text-slate-400 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all">
                             Digital Manifest Export
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* Sidebar Context */}
        <div className="w-80 shrink-0 flex flex-col gap-6 max-h-full overflow-y-auto custom-scrollbar pr-1">
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col gap-8 shrink-0">
              <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Network Readiness</h3>
              <div className="space-y-6">
                 <div>
                    <p className="text-4xl font-black text-white">{externalHospitals.length}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Satellite Facilities</p>
                 </div>
                 <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold uppercase">
                       <span className="text-slate-500">Fleet Coverage</span>
                       <span className="text-emerald-400 font-black">100% Signal</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold uppercase">
                       <span className="text-slate-500">Regional Load</span>
                       <span className="text-amber-400 font-black">Moderate</span>
                    </div>
                 </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Live Weather Radar</p>
                 <div className="flex items-center gap-4">
                    <span className="text-3xl">⛅</span>
                    <p className="text-xs font-bold text-slate-300">Optimal Flight & Road Conditions (VIS: 10km)</p>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6 shrink-0 relative z-10">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Protocol Handshake</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors cursor-default group">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></span>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">EMR Synchronization</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors cursor-default group">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></span>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Blockchain Audit Trail</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 opacity-60 grayscale group">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Air Medical Dispatch</span>
                 </div>
              </div>
              <div className="pt-4 border-t border-slate-50">
                 <p className="text-[8px] font-bold text-slate-400 uppercase text-center leading-relaxed">
                   Authorized Orchestration Personnel Only. <br/> Encryption Layer: Active.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PreHospitalModule;
