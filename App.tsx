
import React, { useState, useEffect } from 'react';
import { 
  AppState, Patient, UserRole, PatientStatus, AuditLog, CareEvent, Department, Bed, ResourceInventory, ResourceRequest, RefillOrder, User 
} from './types';
import { INITIAL_BEDS, INITIAL_OTS, INITIAL_PATIENTS, INITIAL_STAFF, EXTERNAL_HOSPITALS, AMBULANCES, INITIAL_AUDIT_LOGS, INITIAL_RESOURCES } from './constants';
import { analyzeTriageData } from './services/geminiService';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import IntakeForm from './components/IntakeForm';
import QueueBoard from './components/QueueBoard';
import BedManagement from './components/BedManagement';
import PatientPortal from './components/PatientPortal';
import PatientDetailsModal from './components/PatientDetailsModal';
import FinanceModule from './components/FinanceModule';
import StaffingModule from './components/StaffingModule';
import EmergencyModule from './components/EmergencyModule';
import OTManagement from './components/OTManagement';
import GovernanceModule from './components/GovernanceModule';
import CareJourneyView from './components/CareJourneyView';
import DocumentationModule from './components/DocumentationModule';
import PreHospitalModule from './components/PreHospitalModule';
import SystemChatbot from './components/SystemChatbot';
import MentorModule from './components/MentorModule';
import ResourceModule from './components/ResourceModule';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'pre-hospital' | 'intake' | 'queue' | 'beds' | 'ot' | 'patient' | 'finance' | 'staffing' | 'emergency' | 'governance' | 'care-journey' | 'documentation' | 'mentor' | 'resources'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [state, setState] = useState<AppState & { lockdownActive: boolean }>({
    patients: INITIAL_PATIENTS,
    staff: INITIAL_STAFF,
    beds: INITIAL_BEDS,
    ots: INITIAL_OTS,
    externalHospitals: EXTERNAL_HOSPITALS,
    ambulances: AMBULANCES,
    currentUser: null,
    auditLogs: INITIAL_AUDIT_LOGS,
    resources: INITIAL_RESOURCES,
    resourceRequests: [],
    refillOrders: [],
    lockdownActive: false
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const addAuditLog = (action: string, details: string, severity: AuditLog['severity'] = 'Info') => {
    const newLog: AuditLog = {
      timestamp: new Date().toISOString(),
      action,
      user: state.currentUser?.name || 'SYSTEM',
      details,
      severity
    };
    setState(prev => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs]
    }));
  };

  const addCareEvent = (patientId: string, event: Omit<CareEvent, 'id' | 'timestamp'>) => {
    const newEvent: CareEvent = {
      ...event,
      id: `CE-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      patients: prev.patients.map(p => 
        p.id === patientId ? { ...p, careHistory: [...p.careHistory, newEvent] } : p
      )
    }));
  };

  const updateResources = (updater: (prev: ResourceInventory) => ResourceInventory) => {
    setState(prev => ({
      ...prev,
      resources: updater(prev.resources)
    }));
  };

  const handleCreateResourceRequest = (req: Omit<ResourceRequest, 'id' | 'timestamp' | 'requestedBy' | 'status'>) => {
    const newRequest: ResourceRequest = {
      ...req,
      id: `REQ-${Date.now()}`,
      timestamp: new Date().toISOString(),
      requestedBy: state.currentUser?.name || 'Unknown',
      status: 'Requested'
    };
    setState(prev => ({
      ...prev,
      resourceRequests: [newRequest, ...prev.resourceRequests]
    }));
    addAuditLog('RESOURCE_REQUESTED', `${req.type} (${req.subType}) requested for ${req.toDept}`, 'Info');
  };

  const handleUpdateResourceRequestStatus = (id: string, status: ResourceRequest['status']) => {
    setState(prev => {
      const nextRequests = prev.resourceRequests.map(r => r.id === id ? { ...r, status } : r);
      let nextResources = { ...prev.resources };

      if (status === 'Delivered') {
        const req = prev.resourceRequests.find(r => r.id === id);
        if (req) {
          if (req.type === 'Blood' && req.subType) {
            const group = req.subType as any;
            nextResources.blood[group] = Math.max(0, nextResources.blood[group] - req.quantity);
          } else if (req.type === 'Oxygen') {
            nextResources.oxygen.cylindersAvailable = Math.max(0, nextResources.oxygen.cylindersAvailable - req.quantity);
          }
          addAuditLog('RESOURCE_DELIVERED', `Resource transfer ${id} completed. Inventory updated.`, 'Info');
        }
      }

      return {
        ...prev,
        resourceRequests: nextRequests,
        resources: nextResources
      };
    });
  };

  const handleCreateRefillOrder = (order: Omit<RefillOrder, 'id' | 'timestamp' | 'status'>) => {
    const newOrder: RefillOrder = {
      ...order,
      id: `REF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'Requested'
    };
    setState(prev => ({
      ...prev,
      refillOrders: [newOrder, ...prev.refillOrders]
    }));
    addAuditLog('REFILL_ORDERED', `${order.type} refill ordered from ${order.vendor}`, 'Warning');
  };

  const handleUpdateRefillOrderStatus = (id: string, status: RefillOrder['status']) => {
    setState(prev => {
      const nextOrders = prev.refillOrders.map(o => o.id === id ? { ...o, status } : o);
      let nextResources = { ...prev.resources };

      if (status === 'Verified') {
        const order = prev.refillOrders.find(o => o.id === id);
        if (order) {
          if (order.type === 'Oxygen') {
            nextResources.oxygen.tankPercentage = Math.min(100, nextResources.oxygen.tankPercentage + order.quantity);
          } else if (order.type === 'Medication' && order.subType) {
            nextResources.medicalSupplies.criticalMeds = nextResources.medicalSupplies.criticalMeds.map(m => 
              m.name === order.subType ? { ...m, stock: m.stock + order.quantity } : m
            );
          } else if (order.type === 'Blood' && order.subType) {
            const group = order.subType as any;
            nextResources.blood[group] = nextResources.blood[group] + order.quantity;
          }
          addAuditLog('REFILL_VERIFIED', `Refill ${id} verified and added to stock.`, 'Info');
        }
      }

      return {
        ...prev,
        refillOrders: nextOrders,
        resources: nextResources
      };
    });
  };

  const handleNewPatient = async (patient: Patient) => {
    if (state.lockdownActive) {
      alert("SYSTEM LOCKDOWN ACTIVE: New intakes are restricted to life-threatening emergencies only via manual override.");
      return;
    }

    setIsAnalyzing(true);
    setView('dashboard');
    
    const patientWithHistory: Patient = { ...patient, careHistory: [
      { id: `E-INITIAL`, timestamp: new Date().toISOString(), type: 'status_change', title: 'Clinical Intake', description: 'Patient entered system via triage portal.', riskScoreSnapshot: 0, performedBy: 'Self-Intake System' }
    ] };

    setState(prev => ({ ...prev, patients: [...prev.patients, patientWithHistory] }));
    addAuditLog('PATIENT_INTAKE', `Registered patient ${patient.name} (${patient.id})`);

    const analysis = await analyzeTriageData(patient);
    
    setState(prev => ({
      ...prev,
      patients: prev.patients.map(p => p.id === patient.id ? {
        ...p,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        department: analysis.primaryDepartment,
        deteriorationProb: analysis.deteriorationProb,
        icuLikelihood: analysis.icuLikelihood,
        surgeryLikelihood: analysis.surgeryLikelihood,
        estLengthOfStay: analysis.estLengthOfStay,
        estTreatmentCost: analysis.estTreatmentCost,
        financialRiskScore: analysis.financialRiskScore,
        costEffectivePathways: analysis.costEffectivePathways,
        // Fix: Populating suggestedDiagnoses from the AI analysis result
        suggestedDiagnoses: analysis.suggestedDiagnoses,
        isolationRecommended: analysis.redFlags.some(f => f.toLowerCase().includes('contagion') || f.toLowerCase().includes('infection')),
        contagionScore: Math.floor(Math.random() * 100),
        status: PatientStatus.QUEUED,
        queueStartTime: new Date().toISOString(),
        careHistory: [
          ...p.careHistory,
          { id: `E-AI-${Date.now()}`, timestamp: new Date().toISOString(), type: 'status_change', title: 'AI Clinical Analysis', description: `AI identified ${analysis.riskLevel} urgency and recommended routing to ${analysis.primaryDepartment}.`, riskScoreSnapshot: analysis.riskScore || 0, performedBy: 'Orchestra AI Core' }
        ]
      } : p)
    }));

    addAuditLog('AI_ORCHESTRATION', `Analysis completed for ${patient.name}. Est. Cost: $${analysis.estTreatmentCost}`);
    setIsAnalyzing(false);
  };

  const toggleLockdown = () => {
    const nextActive = !state.lockdownActive;
    setState(prev => ({ ...prev, lockdownActive: nextActive }));
    if (nextActive) addAuditLog('SYSTEM_LOCKDOWN', "FULL HOSPITAL LOCKDOWN ACTIVATED.", 'Critical');
    else addAuditLog('LOCKDOWN_LIFTED', "System lockdown deactivated.", 'Info');
  };

  const updatePatientStatus = (patientId: string, status: PatientStatus) => {
    const patient = state.patients.find(p => p.id === patientId);
    if (!patient) return;
    let allocationSuccess = true;
    setState(prev => {
      let nextBeds = [...prev.beds];
      if (status === PatientStatus.ADMITTED || status === PatientStatus.SURGERY) {
        const targetWard = patient.department || Department.GENERAL_MEDICINE;
        const currentBed = nextBeds.find(b => b.patientId === patientId);
        if (!currentBed) {
          let availableBed = nextBeds.find(b => !b.isOccupied && b.ward === targetWard);
          if (!availableBed && targetWard !== Department.ICU) availableBed = nextBeds.find(b => !b.isOccupied && b.ward === Department.GENERAL_MEDICINE);
          if (!availableBed) availableBed = nextBeds.find(b => !b.isOccupied && b.type === 'Standard');
          if (availableBed) nextBeds = nextBeds.map(b => b.id === availableBed.id ? { ...b, isOccupied: true, patientId } : b);
          else if (status !== PatientStatus.SURGERY) { allocationSuccess = false; return prev; }
        }
      }
      if (status === PatientStatus.DISCHARGED) nextBeds = nextBeds.map(b => b.patientId === patientId ? { ...b, isOccupied: false, patientId: undefined } : b);
      return { ...prev, beds: nextBeds, patients: prev.patients.map(p => p.id === patientId ? { ...p, status } : p) };
    });
    if (!allocationSuccess) alert("CRITICAL CAPACITY ALERT: No available beds.");
    addCareEvent(patientId, { type: 'status_change', title: 'Status Update', description: `Patient status transitioned to ${status}.`, riskScoreSnapshot: patient.riskScore || 0, performedBy: state.currentUser?.name || 'Unknown' });
  };

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
    setIsLoggedIn(true);
    addAuditLog('USER_LOGIN', `Authenticated user ${user.name} session started.`, 'Info');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden animate-fadeIn">
      <Sidebar currentView={view} setView={setView} role={state.currentUser?.role || UserRole.DOCTOR} onAction={() => {}} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 relative z-20 shadow-sm">
          <div className="flex items-center gap-4">
             <h2 className="font-black text-slate-800 uppercase tracking-tighter text-sm">{view.replace('-', ' ')}</h2>
             <span className="w-1 h-4 bg-slate-200 rounded-full"></span>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Node Activated</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Global Sync: Online</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 relative custom-scrollbar">
          {view === 'dashboard' && <Dashboard patients={state.patients} beds={state.beds} ots={state.ots} />}
          {view === 'pre-hospital' && <PreHospitalModule ambulances={state.ambulances} externalHospitals={state.externalHospitals} onDispatchToExternal={(id) => addAuditLog('DIVERSION', `Diverted to ${id}`)} />}
          {view === 'intake' && <IntakeForm onSubmit={handleNewPatient} />}
          {view === 'queue' && <QueueBoard patients={state.patients} onSelect={setSelectedPatient} />}
          {view === 'care-journey' && <CareJourneyView patients={state.patients} />}
          {view === 'documentation' && <DocumentationModule patients={state.patients} />}
          {view === 'beds' && <BedManagement beds={state.beds} />}
          {view === 'patient' && <PatientPortal patients={state.patients} />}
          {view === 'finance' && <FinanceModule patients={state.patients} />}
          {view === 'staffing' && <StaffingModule staff={state.staff} patients={state.patients} onRedeploy={() => {}} />}
          {view === 'emergency' && <EmergencyModule patients={state.patients} beds={state.beds} onIsolatePatient={() => {}} onTriggerLockdown={toggleLockdown} isLockdownActive={state.lockdownActive} />}
          {view === 'ot' && <OTManagement ots={state.ots} patients={state.patients} onSchedule={() => {}} onBatchSchedule={() => {}} />}
          {view === 'governance' && <GovernanceModule logs={state.auditLogs} />}
          {view === 'mentor' && <MentorModule />}
          {view === 'resources' && (
            <ResourceModule 
              resources={state.resources} 
              patients={state.patients} 
              ots={state.ots} 
              requests={state.resourceRequests}
              refills={state.refillOrders}
              onLog={addAuditLog} 
              onUpdateResources={updateResources}
              onCreateRequest={handleCreateResourceRequest}
              onUpdateRequestStatus={handleUpdateResourceRequestStatus}
              onCreateRefill={handleCreateRefillOrder}
              onUpdateRefillStatus={handleUpdateRefillOrderStatus}
            />
          )}
        </div>
      </main>
      <SystemChatbot />
      {selectedPatient && <PatientDetailsModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} onAction={(a) => {
        if (a === 'admit') updatePatientStatus(selectedPatient.id, PatientStatus.ADMITTED);
        if (a === 'discharge') updatePatientStatus(selectedPatient.id, PatientStatus.DISCHARGED);
        if (a === 'ot') updatePatientStatus(selectedPatient.id, PatientStatus.SURGERY);
      }} />}
    </div>
  );
};

export default App;
