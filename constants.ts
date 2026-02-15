
import { Department, RiskLevel, PatientStatus, Bed, OT, Patient, StaffMember, StaffRole, StaffStatus, ExternalHospital, Ambulance, SurgicalPriority, AuditLog, ResourceInventory, User, UserRole } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'U1',
    name: 'Clinical Supervisor',
    email: 'supervisor@orchestra.health',
    role: UserRole.DOCTOR,
    avatar: '👨‍⚕️',
    initials: 'CS'
  }
];

export const INITIAL_BEDS: Bed[] = [
  ...Array.from({ length: 8 }, (_, i) => ({ id: `ICU-${i}`, ward: Department.ICU, number: `ICU-${i+1}`, isOccupied: false, type: 'ICU' as const })),
  ...Array.from({ length: 8 }, (_, i) => ({ id: `ER-${i}`, ward: Department.EMERGENCY, number: `ER-${i+1}`, isOccupied: false, type: 'Standard' as const })),
  ...Array.from({ length: 6 }, (_, i) => ({ id: `CARD-${i}`, ward: Department.CARDIOLOGY, number: `C-${i+1}`, isOccupied: false, type: 'Standard' as const })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `NEUR-${i}`, ward: Department.NEUROLOGY, number: `N-${i+1}`, isOccupied: false, type: 'Standard' as const })),
  ...Array.from({ length: 12 }, (_, i) => ({ id: `GEN-${i}`, ward: Department.GENERAL_MEDICINE, number: `G-${i+1}`, isOccupied: false, type: 'Standard' as const })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: `ORTHO-${i}`, ward: Department.ORTHOPEDICS, number: `O-${i+1}`, isOccupied: false, type: 'Standard' as const })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: `PED-${i}`, ward: Department.PEDIATRICS, number: `P-${i+1}`, isOccupied: false, type: 'Standard' as const })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: `SURG-${i}`, ward: Department.SURGERY, number: `S-${i+1}`, isOccupied: false, type: 'Standard' as const })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `ISO-${i}`, ward: Department.EMERGENCY, number: `ISO-${i+1}`, isOccupied: false, type: 'Isolation' as const })),
];

export const INITIAL_OTS: OT[] = [
  { id: 'OT1', name: 'Main Theatre A', status: 'Ready', nextAvailable: 'Now' },
  { id: 'OT2', name: 'Main Theatre B', status: 'In Use', currentSurgery: 'Appendectomy', nextAvailable: '14:30' },
  { id: 'OT3', name: 'Cardiac Suite', status: 'Ready', nextAvailable: 'Now' },
];

export const INITIAL_RESOURCES: ResourceInventory = {
  oxygen: {
    tankPercentage: 68,
    cylindersAvailable: 142,
    cylindersInUse: 58,
    usageRatePerMin: 12.5,
    refillScheduled: false
  },
  blood: {
    'A+': 45, 'A-': 12,
    'B+': 38, 'B-': 8,
    'AB+': 14, 'AB-': 4,
    'O+': 52, 'O-': 6
  },
  medicalSupplies: {
    ventilatorsTotal: 25,
    ventilatorsInUse: 18,
    emergencyKits: 45,
    criticalMeds: [
      { name: 'Adrenaline', stock: 120, unit: 'amps', minThreshold: 50 },
      { name: 'Amiodarone', stock: 85, unit: 'amps', minThreshold: 30 },
      { name: 'Propofol', stock: 210, unit: 'vials', minThreshold: 100 },
      { name: 'Fentanyl', stock: 45, unit: 'vials', minThreshold: 60 }
    ]
  }
};

export const EXTERNAL_HOSPITALS: ExternalHospital[] = [
  { 
    id: 'H2', name: 'City Central Medical', distance: 4.2, loadScore: 88, 
    specialties: [Department.EMERGENCY, Department.CARDIOLOGY, Department.SURGERY],
    availableBeds: { [Department.ICU]: 0, [Department.EMERGENCY]: 2 },
    travelTimeMins: 12,
    oxygenLevel: 45,
    bloodInventory: { 'O-': 2, 'AB-': 0, 'A+': 15 },
    icuBedsTotal: 20,
    icuBedsAvailable: 0,
    otCount: 5,
    otStatus: 'Busy',
    location: { lat: 12.9716, lng: 77.5946 }
  },
  { 
    id: 'H3', name: 'North Shore Wellness', distance: 12.5, loadScore: 34, 
    specialties: [Department.PEDIATRICS, Department.ORTHOPEDICS, Department.GENERAL_MEDICINE],
    availableBeds: { [Department.GENERAL_MEDICINE]: 14, [Department.ICU]: 5 },
    travelTimeMins: 28,
    oxygenLevel: 92,
    bloodInventory: { 'O-': 12, 'O+': 40, 'B-': 8 },
    icuBedsTotal: 15,
    icuBedsAvailable: 8,
    otCount: 3,
    otStatus: 'Ready',
    location: { lat: 12.9800, lng: 77.6100 }
  },
  { 
    id: 'H4', name: 'St. Jude Specialty', distance: 8.1, loadScore: 45, 
    specialties: [Department.NEUROLOGY, Department.SURGERY, Department.ICU],
    availableBeds: { [Department.ICU]: 3, [Department.SURGERY]: 1 },
    travelTimeMins: 18,
    oxygenLevel: 78,
    bloodInventory: { 'A-': 5, 'AB-': 4, 'O-': 0 },
    icuBedsTotal: 30,
    icuBedsAvailable: 4,
    otCount: 8,
    otStatus: 'Ready',
    location: { lat: 12.9500, lng: 77.5800 }
  }
];

export const AMBULANCES: Ambulance[] = [
  { id: 'AMB-01', status: 'En-route to Hospital', type: 'ALS', location: { lat: 12.9600, lng: 77.6000 }, currentPatientId: 'P-9832', targetHospitalId: 'H1' },
  { id: 'AMB-02', status: 'Idle', type: 'BLS', location: { lat: 12.9700, lng: 77.5900 } },
  { id: 'AMB-03', status: 'Responding', type: 'Critical Care', location: { lat: 12.9800, lng: 77.6200 } },
];

export const INITIAL_STAFF: StaffMember[] = [
  { id: 'S1', name: 'Nurse Joy', role: StaffRole.NURSE, assignedWard: Department.EMERGENCY, workload: 85, status: StaffStatus.ACTIVE, burnoutRisk: 72, shiftStartedAt: '08:00', skills: ['Triage', 'IV Access', 'ACLS'] },
  { id: 'S2', name: 'James Miller', role: StaffRole.WARDBOY, assignedWard: Department.EMERGENCY, workload: 92, status: StaffStatus.ACTIVE, burnoutRisk: 88, shiftStartedAt: '08:00', skills: ['Patient Transport', 'Equipment Setup'] },
  { id: 'S3', name: 'Nurse Ratched', role: StaffRole.NURSE, assignedWard: Department.ICU, workload: 45, status: StaffStatus.ACTIVE, burnoutRisk: 20, shiftStartedAt: '10:00', skills: ['Ventilator Management', 'ICU Care'] },
  { id: 'S4', name: 'Tom Wilson', role: StaffRole.ASSISTANT, assignedWard: Department.GENERAL_MEDICINE, workload: 20, status: StaffStatus.BREAK, burnoutRisk: 10, shiftStartedAt: '09:00', skills: ['Vital Signs', 'Patient Feeding'] },
  { id: 'S5', name: 'Nurse Kelly', role: StaffRole.NURSE, assignedWard: Department.GENERAL_MEDICINE, workload: 35, status: StaffStatus.ACTIVE, burnoutRisk: 15, shiftStartedAt: '07:00', skills: ['Wound Care', 'Phlebotomy'] },
  { id: 'S6', name: 'Sarah Page', role: StaffRole.ASSISTANT, assignedWard: Department.ICU, workload: 65, status: StaffStatus.ACTIVE, burnoutRisk: 40, shiftStartedAt: '12:00', skills: ['Critical Monitoring'] },
  { id: 'S7', name: 'Bob Vance', role: StaffRole.WARDBOY, assignedWard: Department.GENERAL_MEDICINE, workload: 15, status: StaffStatus.ACTIVE, burnoutRisk: 5, shiftStartedAt: '11:00', skills: ['Logistics'] },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { 
    timestamp: new Date(Date.now() - 3600000).toISOString(), 
    action: 'SYSTEM_BOOT', 
    user: 'SYS_DAEMON', 
    details: 'Orchestra AI Core v3.1 initialized with HIPAA-compliant encryption standards.', 
    severity: 'Info' 
  },
  { 
    timestamp: new Date(Date.now() - 3000000).toISOString(), 
    action: 'INTEGRITY_CHECK', 
    user: 'ComplianceBot', 
    details: 'Biometric access logs successfully synced with regional health authority blockchain.', 
    severity: 'Info' 
  },
  { 
    timestamp: new Date(Date.now() - 1800000).toISOString(), 
    action: 'AI_PRIORITY_CALIBRATION', 
    user: 'Gemini-3-Flash', 
    details: 'Recalibrated priority for P-5501 due to surgical bed unavailability. Urgency: CRITICAL.', 
    severity: 'Critical' 
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'P-9832',
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    contact: '555-0101',
    symptoms: ['Chest Pain', 'Shortness of breath'],
    severity: 8,
    duration: '2 hours',
    history: 'Hypertension',
    medications: 'Lisinopril',
    vitals: { temp: 37.2, bp_sys: 165, bp_dia: 95, pulse: 92, spo2: 94, resp_rate: 22 },
    status: PatientStatus.QUEUED,
    riskScore: 82,
    riskLevel: RiskLevel.HIGH,
    department: Department.CARDIOLOGY,
    deteriorationProb: 35,
    icuLikelihood: 15,
    surgeryLikelihood: 10,
    queueStartTime: new Date(Date.now() - 15 * 60000).toISOString(),
    careHistory: [
      { id: 'e1', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), type: 'status_change', title: 'Arrival at Triage', description: 'Patient presented with acute chest pain.', riskScoreSnapshot: 45, performedBy: 'Triage Nurse' },
      { id: 'e2', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), type: 'clinical', title: 'Initial Vitals Captured', description: 'Abnormal BP detected (165/95). Tachycardia present.', riskScoreSnapshot: 65, performedBy: 'System Auto-Capture' },
      { id: 'e3', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), type: 'status_change', title: 'AI Risk Calibration', description: 'Orchestra AI flagged high risk for Myocardial Infarction. Routed to Cardiology.', riskScoreSnapshot: 82, performedBy: 'Gemini 3.0 Core' }
    ]
  },
  {
    id: 'P-5501',
    name: 'Marcus Flint',
    age: 58,
    gender: 'Male',
    contact: '555-9090',
    symptoms: ['Acute Abdominal Pain', 'Vomiting'],
    severity: 9,
    duration: '6 hours',
    history: 'Cholecystitis',
    medications: 'None',
    vitals: { temp: 38.8, bp_sys: 110, bp_dia: 70, pulse: 105, spo2: 96, resp_rate: 24 },
    status: PatientStatus.QUEUED,
    riskScore: 88,
    riskLevel: RiskLevel.CRITICAL,
    department: Department.SURGERY,
    deteriorationProb: 55,
    icuLikelihood: 20,
    surgeryLikelihood: 95,
    surgicalPriority: SurgicalPriority.EMERGENCY,
    queueStartTime: new Date(Date.now() - 45 * 60000).toISOString(),
    careHistory: [
      { id: 'e5', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), type: 'status_change', title: 'Emergency Intake', description: 'Patient presented with suspected perforated gallbladder.', riskScoreSnapshot: 88, performedBy: 'ER Resident' }
    ]
  }
];
