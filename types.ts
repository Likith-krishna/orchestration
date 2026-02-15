
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum UserRole {
  ADMIN = 'Admin',
  NURSE = 'Nurse',
  DOCTOR = 'Doctor',
  OPS_MANAGER = 'Operations Manager'
}

export enum StaffRole {
  NURSE = 'Nurse',
  WARDBOY = 'Wardboy',
  ASSISTANT = 'Assistant',
  PHYSICIAN = 'Physician'
}

export enum StaffStatus {
  ACTIVE = 'Active',
  BREAK = 'On Break',
  OFF = 'Off Duty',
  EMERGENCY = 'Emergency Deployment'
}

export enum PatientStatus {
  PRE_HOSPITAL = 'Pre-Hospital Triage',
  AMBULANCE = 'In Ambulance',
  TRIAGE = 'In Triage',
  QUEUED = 'Queued',
  DIAGNOSIS = 'Under Diagnosis',
  ADMITTED = 'Admitted',
  SURGERY = 'In Surgery',
  DISCHARGED = 'Discharged'
}

export enum SurgicalPriority {
  ELECTIVE = 'Elective',
  URGENT = 'Urgent',
  EMERGENCY = 'Emergency'
}

export enum Department {
  EMERGENCY = 'Emergency',
  CARDIOLOGY = 'Cardiology',
  NEUROLOGY = 'Neurology',
  GENERAL_MEDICINE = 'General Medicine',
  ORTHOPEDICS = 'Orthopedics',
  PEDIATRICS = 'Pediatrics',
  SURGERY = 'Surgery',
  ICU = 'ICU',
  BLOOD_BANK = 'Blood Bank',
  PHARMACY = 'Pharmacy',
  LOGISTICS = 'Logistics'
}

export interface Vitals {
  temp: number;
  bp_sys: number;
  bp_dia: number;
  pulse: number;
  spo2: number;
  resp_rate: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  initials: string;
}

export interface BehavioralVitals {
  stressLevel: 'Low' | 'Moderate' | 'High';
  panicProbability: number; // 0-1
  emotionalDistress: 'Stable' | 'Elevated' | 'Acute';
  speechCharacteristics: {
    rate: 'Normal' | 'Rapid' | 'Slow';
    tremorDetected: boolean;
    hesitations: number;
  };
  confidence: number;
  aiNote: string;
}

export interface CareEvent {
  id: string;
  timestamp: string;
  type: 'clinical' | 'operational' | 'intervention' | 'status_change';
  title: string;
  description: string;
  riskScoreSnapshot: number;
  performedBy: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  coverageType: 'Basic' | 'Premium' | 'Government' | 'None';
  status: 'Verified' | 'Pending' | 'Rejected';
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  assignedWard: Department | 'Triage';
  workload: number; // 0-100
  status: StaffStatus;
  burnoutRisk: number; // 0-100
  shiftStartedAt: string;
  skills: string[];
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  preferredLanguage?: 'en' | 'ml' | 'ta' | 'hi' | 'te' | 'kn';
  symptoms: string[];
  severity: number;
  duration: string;
  history: string;
  medications: string;
  vitals: Vitals;
  behavioralVitals?: BehavioralVitals;
  status: PatientStatus;
  insurance?: InsuranceInfo;
  careHistory: CareEvent[];
  
  riskScore?: number;
  riskLevel?: RiskLevel;
  department?: Department;
  admittedAt?: string;
  queueStartTime?: string;
  deteriorationProb?: number;
  icuLikelihood?: number;
  surgeryLikelihood?: number;
  surgicalPriority?: SurgicalPriority;
  
  isolationRecommended?: boolean;
  contagionScore?: number; 
  infectiousClusterId?: string;

  estLengthOfStay?: number; 
  estTreatmentCost?: number; 
  financialRiskScore?: number; 
  costEffectivePathways?: string[];
  
  // Fix: Added missing suggestedDiagnoses property to the Patient interface
  suggestedDiagnoses?: { name: string; probability: number; rationale: string }[];

  currentLocation?: { lat: number; lng: number };
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type ResourceRequestStatus = 'Requested' | 'Approved' | 'In Transit' | 'Delivered' | 'Cancelled';
export type RefillOrderStatus = 'Requested' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Verified';

export interface ResourceRequest {
  id: string;
  type: 'Oxygen' | 'Blood' | 'Ventilator' | 'Medication';
  subType?: string; 
  quantity: number;
  fromDept: Department;
  toDept: Department;
  urgency: 'Normal' | 'Urgent' | 'Critical';
  status: ResourceRequestStatus;
  timestamp: string;
  requestedBy: string;
}

export interface RefillOrder {
  id: string;
  type: 'Oxygen' | 'Blood' | 'Medication';
  subType?: string;
  quantity: number;
  vendor: string;
  status: RefillOrderStatus;
  timestamp: string;
}

export interface ResourceInventory {
  oxygen: {
    tankPercentage: number;
    cylindersAvailable: number;
    cylindersInUse: number;
    usageRatePerMin: number;
    refillScheduled: boolean;
  };
  blood: Record<BloodGroup, number>;
  medicalSupplies: {
    ventilatorsTotal: number;
    ventilatorsInUse: number;
    emergencyKits: number;
    criticalMeds: { name: string; stock: number; unit: string; minThreshold: number }[];
  };
}

export interface ExternalHospital {
  id: string;
  name: string;
  distance: number;
  loadScore: number; // 0-100
  specialties: Department[];
  availableBeds: { [key in Department]?: number };
  travelTimeMins: number;
  
  // Real-time Resource Telemetry
  oxygenLevel: number; // 0-100
  bloodInventory: Partial<Record<BloodGroup, number>>;
  icuBedsTotal: number;
  icuBedsAvailable: number;
  otCount: number;
  otStatus: 'Ready' | 'Busy' | 'Diverting';
  location: { lat: number; lng: number };
}

export interface TransferRequest {
  id: string;
  patientId: string;
  targetHospitalId: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'In Transit' | 'Completed';
  requiredResources: string[];
  urgency: 'Immediate' | 'Urgent' | 'Routine';
  timestamp: string;
}

export interface AppState {
  patients: Patient[];
  staff: StaffMember[];
  beds: Bed[];
  ots: OT[];
  externalHospitals: ExternalHospital[];
  ambulances: Ambulance[];
  currentUser: User | null;
  auditLogs: AuditLog[];
  resources: ResourceInventory;
  resourceRequests: ResourceRequest[];
  refillOrders: RefillOrder[];
}

export interface Ambulance {
  id: string;
  status: 'Idle' | 'Responding' | 'En-route to Hospital' | 'Maintenance';
  type: 'ALS' | 'BLS' | 'Critical Care';
  currentPatientId?: string;
  targetHospitalId?: string;
  location: { lat: number; lng: number };
}

export interface Bed {
  id: string;
  ward: Department;
  number: string;
  isOccupied: boolean;
  patientId?: string;
  type: 'Standard' | 'ICU' | 'Isolation';
}

export interface OT {
  id: string;
  name: string;
  status: 'Ready' | 'In Use' | 'Cleaning';
  currentPatientId?: string;
  currentSurgery?: string;
  nextAvailable: string;
  capacity?: 'Minor' | 'Major' | 'Specialized';
}

export interface AuditLog {
  timestamp: string;
  action: string;
  user: string;
  details: string;
  severity: 'Info' | 'Warning' | 'Critical';
}
