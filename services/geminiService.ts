
import { Patient, RiskLevel, Department, ExternalHospital, OT, AuditLog, ResourceInventory, BehavioralVitals, SurgicalPriority, BloodGroup } from "../types";
import { GoogleGenAI } from "@google/genai";

// Initialize Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- CONTRACT INTERFACES (FROZEN) ---

export interface TriageResponse {
  riskScore: number;
  riskLevel: RiskLevel;
  deteriorationProb: number;
  icuLikelihood: number;
  surgeryLikelihood: number;
  primaryDepartment: Department;
  reasoning: string;
  suggestedDiagnoses: { name: string; probability: number; rationale: string }[];
  redFlags: string[];
  estLengthOfStay: number;
  estTreatmentCost: number;
  financialRiskScore: number;
  costEffectivePathways: string[];
}

export interface VoiceTriageAnalysis {
  symptoms_detected: string[];
  severity_score: number;
  behavioral_vitals: BehavioralVitals;
  recommendation: string;
}

export interface ResourceIntelligence {
  oxygenDepletionHours: number;
  criticalBloodShortages: string[];
  resourceStrainIndex: number;
  predictedDemand24h: string;
  recommendedAction: string;
}

export interface OptimalHospitalResponse {
  recommendedHospitalId: string;
  travelTimeMins: number;
  rationale: string;
  isDiversionRecommended: boolean;
  alternativeHospitalId?: string;
  availableResources: {
    icu: number;
    oxygen: number;
    bloodOminus: number;
  };
}

export interface CopilotAnalysis {
  summary10Sec: string;
  sbar: {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  };
  dangerousMimics: { condition: string; whyOverlooked: string; check: string; }[];
  clinicalPearls: string[];
  suggestedLiterature: { title: string; year: string; keyFinding: string; }[];
}

export interface FinancialAudit {
  revenueIntegrityScore: number;
  unbilledRevenueEst: number;
  strategicAdvice: string;
  billingAnomalies: { patientId: string; issue: string; financialImpact: number; }[];
  reportSummary: string;
}

export interface LiaisonRequest {
  priority: 'Immediate' | 'Urgent' | 'Routine';
  clinicalJustification: string;
  suggestedNextSteps: string[];
}

export interface OTEfficiencyAudit {
  utilizationScore: number;
  savingsMinutes: number;
  bottleneckReason: string;
  optimizedSchedule: string[];
}

export interface ClinicalDocument {
  title: string;
  content: string;
  icdCodes: { code: string; description: string }[];
  billingCodes: { code: string; description: string; estAmount: number }[];
}

// --- DATA DICTIONARIES FOR HEURISTICS ---

const CLINICAL_KNOWLEDGE_BASE = {
  diagnoses: [
    { keywords: ['chest pain', 'pressure', 'heart'], name: 'Acute Coronary Syndrome', icd: 'I21.9', dept: Department.CARDIOLOGY, mimics: [{ condition: 'Aortic Dissection', whyOverlooked: 'Similar tearing pain profile.', check: 'CT Angiography' }, { condition: 'GERD', whyOverlooked: 'Retrosternal burning.', check: 'PPI Trial/Endoscopy' }] },
    { keywords: ['abdominal pain', 'stomach', 'vomiting'], name: 'Acute Appendicitis', icd: 'K35.80', dept: Department.SURGERY, mimics: [{ condition: 'Ectopic Pregnancy', whyOverlooked: 'Lower quadrant pain in females.', check: 'hCG Test' }, { condition: 'Mesenteric Adenitis', whyOverlooked: 'Common in viral pro-drome.', check: 'US Abdomen' }] },
    { keywords: ['headache', 'weakness', 'speech', 'stroke'], name: 'Ischemic Stroke', icd: 'I63.9', dept: Department.NEUROLOGY, mimics: [{ condition: 'Hypoglycemia', whyOverlooked: 'Mimics focal neuro deficits.', check: 'Fingerstick Glucose' }, { condition: 'Todd\'s Paralysis', whyOverlooked: 'Post-ictal state.', check: 'EEG' }] },
    { keywords: ['cough', 'fever', 'chills', 'breath'], name: 'Pneumonia', icd: 'J18.9', dept: Department.GENERAL_MEDICINE, mimics: [{ condition: 'Heart Failure', whyOverlooked: 'Congestion and dyspnea.', check: 'BNP / Echo' }] }
  ],
  billing: {
    [Department.CARDIOLOGY]: { base: 8500, codes: [{ code: '93000', desc: 'EKG Interpretation', amt: 150 }, { code: '93452', desc: 'Left Heart Catheterization', amt: 2100 }] },
    [Department.SURGERY]: { base: 12000, codes: [{ code: '44950', desc: 'Appendectomy', amt: 4500 }, { code: '49505', desc: 'Inguinal Hernia Repair', amt: 1800 }] },
    [Department.EMERGENCY]: { base: 2500, codes: [{ code: '99285', desc: 'ER Visit Level 5', amt: 850 }] },
    [Department.ICU]: { base: 15000, codes: [{ code: '99291', desc: 'Critical Care First Hour', amt: 1200 }] },
    [Department.GENERAL_MEDICINE]: { base: 4000, codes: [{ code: '99223', desc: 'Initial Hospital Care', amt: 350 }] }
  }
};

// --- LOGIC ENGINES ---

/**
 * AI Scribe and Documentation Generator
 */
export const generateClinicalDocumentation = async (patient: Patient, type: string): Promise<ClinicalDocument> => {
  const v = patient.vitals;
  const prompt = `Generate a professional, highly detailed medical ${type.toUpperCase()} for the following patient.
  
  PATIENT DATA:
  Name: ${patient.name}
  Age/Gender: ${patient.age}y ${patient.gender}
  Symptoms: ${patient.symptoms.join(', ')}
  Vitals: Temp ${v.temp}C, BP ${v.bp_sys}/${v.bp_dia}, Pulse ${v.pulse}bpm, SpO2 ${v.spo2}%
  Medical History: ${patient.history || 'None'}
  AI Risk Score: ${patient.riskScore}%
  
  DOCUMENT TYPE SPECIFICS:
  - If Triage: Focus on intake presentation and immediate nursing plan.
  - If Admission: Focus on diagnostic plan, consultants, and ward placement.
  - If Surgery: Create an 'Operative Draft' procedure note relevant to the patient's department.
  - If Discharge: Focus on follow-up, medications, and stability criteria.
  
  Format: Clinical, concise, and professional medical terminology.`;

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert hospital scribe generating documentation for a top-tier medical orchestration platform. Output clear, well-structured clinical notes.",
      }
    });

    const content = response.text || "Automatic transcription failed. Please check clinician manual input.";
    const dept = patient.department || Department.GENERAL_MEDICINE;
    const billing = CLINICAL_KNOWLEDGE_BASE.billing[dept] || CLINICAL_KNOWLEDGE_BASE.billing[Department.GENERAL_MEDICINE];

    return {
      title: `${type.toUpperCase()} SUMMARY - ${patient.id}`,
      content: content,
      icdCodes: [{ code: 'R07.9', description: 'Differential: Undifferentiated complaint' }],
      billingCodes: billing.codes.map(c => ({ ...c, estAmount: c.amt }))
    };

  } catch (error) {
    console.error("Documentation Generation Error:", error);
    // Graceful fallback logic
    return {
      title: `${type.toUpperCase()} SUMMARY (LOCAL DRAFT)`,
      content: `CLINICAL NOTE: ${patient.name} presented with ${patient.symptoms.join(', ')}. Current vitals show BP ${v.bp_sys}/${v.bp_dia} and pulse ${v.pulse}. The patient is classified as ${patient.riskLevel} risk. Clinical course suggests management in ${patient.department || 'Internal Medicine'}.`,
      icdCodes: [{ code: 'Z00.00', description: 'General medical examination' }],
      billingCodes: []
    };
  }
};

export const analyzeTriageData = async (patient: Patient): Promise<TriageResponse> => {
  await new Promise(r => setTimeout(r, 800));

  let riskPoints = 0;
  const v = patient.vitals;

  if (v.temp > 38.5 || v.temp < 36.0) riskPoints += 20;
  if (v.spo2 < 94) riskPoints += 30;
  if (v.bp_sys > 160 || v.bp_sys < 90) riskPoints += 25;
  if (v.pulse > 100 || v.pulse < 50) riskPoints += 15;
  if (patient.severity > 7) riskPoints += 10;

  const score = Math.min(100, riskPoints);
  const level = score > 75 ? RiskLevel.CRITICAL : score > 50 ? RiskLevel.HIGH : score > 25 ? RiskLevel.MEDIUM : RiskLevel.LOW;

  const matches = CLINICAL_KNOWLEDGE_BASE.diagnoses.filter(d =>
    patient.symptoms.some(s => d.keywords.some(k => s.toLowerCase().includes(k)))
  );

  const primaryDept = matches[0]?.dept || Department.EMERGENCY;
  const billingData = CLINICAL_KNOWLEDGE_BASE.billing[primaryDept] || CLINICAL_KNOWLEDGE_BASE.billing[Department.EMERGENCY];

  return {
    riskScore: score,
    riskLevel: level,
    deteriorationProb: Math.round(score * 0.8),
    icuLikelihood: score > 60 ? Math.round(score * 0.5) : 5,
    surgeryLikelihood: patient.symptoms.some(s => s.toLowerCase().includes('pain')) ? 45 : 10,
    primaryDepartment: primaryDept,
    reasoning: `Score of ${score} derived from vital instabilities. Primary concern: ${matches[0]?.name || 'Undifferentiated acute illness'}.`,
    redFlags: score > 70 ? ['Hemodynamic Instability', 'Respiratory Distress'] : [],
    suggestedDiagnoses: matches.length > 0
      ? matches.map(m => ({ name: m.name, probability: 85, rationale: 'Clinical symptom cluster match.' }))
      : [{ name: 'Nonspecific Viral Syndrome', probability: 40, rationale: 'Default broad classification.' }],
    estLengthOfStay: level === RiskLevel.CRITICAL ? 7 : 2,
    estTreatmentCost: billingData.base + (score * 100),
    financialRiskScore: patient.insurance?.provider ? 20 : 85,
    costEffectivePathways: ['Direct ward admission', 'Standardized order set 4A']
  };
};

export const generateClinicalCopilotData = async (patient: Patient): Promise<CopilotAnalysis> => {
  await new Promise(r => setTimeout(r, 1000));

  const mainSymptom = patient.symptoms[0] || 'Unspecified complaint';
  const match = CLINICAL_KNOWLEDGE_BASE.diagnoses.find(d =>
    d.keywords.some(k => mainSymptom.toLowerCase().includes(k))
  );

  return {
    summary10Sec: `${patient.riskLevel}-risk ${patient.age}y ${patient.gender} presenting with ${mainSymptom}. Vitals show ${patient.vitals.spo2 < 94 ? 'hypoxia' : 'stability'}.`,
    sbar: {
      situation: `${patient.name} (${patient.id}) presents with ${patient.symptoms.join(', ')}.`,
      background: `Medical History: ${patient.history || 'None significant'}. Medications: ${patient.medications || 'None'}.`,
      assessment: `Patient is currently ${patient.riskLevel} risk (OPI: ${patient.riskScore}). Primary suspicion: ${match?.name || 'Inconclusive'}.`,
      recommendation: `Immediate consult with ${patient.department || 'Internal Medicine'}. Order labs and stabilize vitals.`
    },
    dangerousMimics: (match?.mimics as any[]) || [{ condition: 'Sepsis', whyOverlooked: 'Systemic inflammatory response.', check: 'Lactate / Cultures' }],
    clinicalPearls: [
      `Maintain ${mainSymptom.includes('breath') ? 'SpO2 > 94%' : 'normotension'}.`,
      'Re-evaluate OPI score every 30 minutes.'
    ],
    suggestedLiterature: [
      { title: `Management of ${match?.name || 'Acute Illness'}`, year: '2023', keyFinding: 'Early intervention reduces 30-day mortality.' }
    ]
  };
};

export const generateFinancialAudit = async (patients: Patient[]): Promise<FinancialAudit> => {
  await new Promise(r => setTimeout(r, 1000));

  const totalPotential = patients.reduce((sum, p) => sum + (p.estTreatmentCost || 0), 0);
  const unbilled = patients
    .filter(p => p.insurance?.status !== 'Verified')
    .reduce((sum, p) => sum + (p.estTreatmentCost || 0), 0);

  const verifiedCount = patients.filter(p => p.insurance?.status === 'Verified').length;
  const integrityScore = Math.round((verifiedCount / Math.max(1, patients.length)) * 100);

  const anomalies = patients
    .filter(p => (p.riskScore || 0) > 70 && !p.insurance?.provider)
    .map(p => ({
      patientId: p.id,
      issue: 'High-acuity case with no insurance on file.',
      financialImpact: p.estTreatmentCost || 5000
    }));

  return {
    revenueIntegrityScore: integrityScore,
    unbilledRevenueEst: unbilled,
    strategicAdvice: unbilled > 5000 ? "High volume of unverified insurance. Deploy financial counselors to ER intake immediately." : "Revenue flow is stable.",
    billingAnomalies: anomalies,
    reportSummary: `Audit of ${patients.length} active records shows ${integrityScore}% verification rate. Potential loss of $${unbilled} detected in unbilled services.`
  };
};

export const createLiaisonRequest = async (patient: Patient): Promise<LiaisonRequest> => {
  await new Promise(r => setTimeout(r, 800));
  const isHighRisk = (patient.riskScore || 0) > 60;

  return {
    priority: isHighRisk ? 'Immediate' : 'Routine',
    clinicalJustification: `Requesting authorization for admission of ${patient.name}. Patient presents with ${patient.symptoms.join(', ')} and an AI-calculated risk score of ${patient.riskScore}%. This exceeds the threshold for safe outpatient management.`,
    suggestedNextSteps: [
      'Submit OPI score documentation',
      'Confirm secondary insurance coverage',
      'Contact case manager for transition planning'
    ]
  };
};

export const analyzeVoiceTriage = async (
  transcription: string,
  metadata: { rate: string, tremor: boolean, hesitations: number }
): Promise<VoiceTriageAnalysis> => {
  await new Promise(r => setTimeout(r, 1200));
  const text = transcription.toLowerCase();
  const symptoms = [];
  for (const d of CLINICAL_KNOWLEDGE_BASE.diagnoses) {
    if (d.keywords.some(k => text.includes(k))) symptoms.push(d.name);
  }
  const stressMap: Record<string, 'Low' | 'Moderate' | 'High'> = { 'Rapid': 'High', 'Normal': 'Low', 'Slow': 'Moderate' };
  return {
    symptoms_detected: symptoms.length > 0 ? symptoms : ['Unspecified pain'],
    severity_score: metadata.tremor || metadata.rate === 'Rapid' ? 8 : 4,
    behavioral_vitals: {
      stressLevel: stressMap[metadata.rate] || 'Moderate',
      panicProbability: metadata.tremor ? 0.75 : 0.1,
      emotionalDistress: metadata.hesitations > 2 ? 'Elevated' : 'Stable',
      speechCharacteristics: { rate: metadata.rate as any, tremorDetected: metadata.tremor, hesitations: metadata.hesitations },
      confidence: 0.85,
      aiNote: `Patient exhibited ${metadata.rate} speech patterns.`
    },
    recommendation: metadata.tremor ? 'Flag for immediate psych/clinical review.' : 'Process via standard workflow.'
  };
};

export const calculateOptimalHospital = async (patient: Patient, hospitals: ExternalHospital[], resource?: string): Promise<OptimalHospitalResponse> => {
  await new Promise(r => setTimeout(r, 500));
  const ranked = hospitals.map(h => {
    let score = h.travelTimeMins * 2;
    score += (h.loadScore / 10);
    if (resource === 'ICU' && h.icuBedsAvailable === 0) score += 1000;
    return { ...h, score };
  }).sort((a, b) => a.score - b.score);
  const best = ranked[0];
  return {
    recommendedHospitalId: best.id,
    travelTimeMins: best.travelTimeMins,
    rationale: `Optimal choice based on ${best.travelTimeMins}min travel time and available ${resource || 'capacity'}.`,
    isDiversionRecommended: best.loadScore > 90,
    availableResources: { icu: best.icuBedsAvailable, oxygen: best.oxygenLevel, bloodOminus: best.bloodInventory['O-'] || 0 }
  };
};

export const analyzeResourceIntelligence = async (resources: ResourceInventory, patients: Patient[], ots: OT[]): Promise<ResourceIntelligence> => {
  const usageRate = resources.oxygen.usageRatePerMin;
  const currentLevel = resources.oxygen.tankPercentage;
  const hoursRemaining = Math.round((currentLevel / (usageRate * 0.1)) / 60);
  const lowBlood = Object.entries(resources.blood).filter(([, amt]) => (amt as number) < 10).map(([group]) => group);
  return {
    oxygenDepletionHours: hoursRemaining,
    criticalBloodShortages: lowBlood,
    resourceStrainIndex: Math.min(100, (patients.length * 5) + (ots.filter(o => o.status === 'In Use').length * 10)),
    predictedDemand24h: "Stable, with slight increase expected in respiratory cases.",
    recommendedAction: hoursRemaining < 24 ? "ORDER OXYGEN IMMEDIATELY" : "Normal monitoring."
  };
};

export const getOTEfficiencyAudit = async (ots: OT[], patients: Patient[]): Promise<OTEfficiencyAudit> => {
  const ready = ots.filter(o => o.status === 'Ready').length;
  return {
    utilizationScore: Math.round((ready / ots.length) * 100),
    savingsMinutes: ready * 15,
    bottleneckReason: ready === 0 ? "Cleaning delays." : "No bottlenecks.",
    optimizedSchedule: patients.filter(p => (p.surgeryLikelihood || 0) > 40).map(p => `Suite ${Math.floor(Math.random() * ots.length) + 1}: ${p.name}`)
  };
};

/**
 * Uses Gemini 3 Pro to generate intelligent platform mentor responses.
 */
export const getPlatformMentorResponse = async (history: any[], userMessage: string, mode: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'models/gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: `You are the Orchestra Health Platform Mentor in ${mode} mode. 
        Assist users with clinical orchestration, system architecture, or hospital workflows. 
        Knowledge point: OPI (Orchestra Priority Index) = 60% clinical risk + 20% wait time + 20% deterioration probability.`,
      },
    });
    return response.text || "I apologize, I am experiencing a brief processing delay. How else can I assist?";
  } catch (error) {
    console.error("Gemini Platform Mentor Error:", error);

    // Enhanced intelligent fallback responses
    const msg = userMessage.toLowerCase();

    // OPI-related questions
    if (msg.includes('opi') || msg.includes('priority index')) {
      return `# Orchestra Priority Index (OPI)

The **OPI** is our core triage metric that determines patient priority across the entire platform.

## Formula
\`\`\`
OPI = (60% × Clinical Risk) + (20% × Wait Time) + (20% × Deterioration Probability)
\`\`\`

## Components
- **Clinical Risk (60%)**: Vital signs, symptoms, medical history
- **Wait Time (20%)**: How long the patient has been waiting
- **Deterioration Probability (20%)**: ML-predicted likelihood of condition worsening

## Usage
OPI scores range from 0-100 and automatically update every 30 minutes based on real-time vitals and wait time.`;
    }

    // Bed allocation questions
    if (msg.includes('bed') && (msg.includes('allocation') || msg.includes('assign'))) {
      return `# Bed Allocation System

Our **AI-powered bed allocation** optimizes patient placement based on multiple factors:

## Key Factors
1. **Patient Acuity**: Critical patients get ICU beds automatically
2. **Isolation Requirements**: Contagion scores trigger isolation protocols
3. **Department Matching**: Patients routed to specialty departments
4. **Bed Availability**: Real-time tracking of all bed statuses

## Automation
The system automatically suggests optimal bed assignments when a patient is admitted, considering proximity to nursing stations for high-risk patients.`;
    }

    // Contagion score questions
    if (msg.includes('contagion') || msg.includes('isolation')) {
      return `# Contagion Scoring

The **Contagion Score** determines isolation requirements and infection control protocols.

## Scoring Criteria
- Respiratory symptoms + fever = High contagion risk
- Known infectious disease history = Automatic isolation flag
- Recent travel to endemic areas = Elevated score

## Triggered Actions
- **Score > 70**: Automatic isolation bed assignment
- **Score 40-70**: Droplet precautions recommended
- **Score < 40**: Standard precautions

The system integrates with bed management to allocate isolation rooms when needed.`;
    }

    // ER features questions
    if (msg.includes('er') || msg.includes('emergency') || msg.includes('features')) {
      return `# Emergency Room Features

## Core ER Capabilities
1. **Real-Time Triage**: Automated OPI calculation on patient arrival
2. **Voice Symptom Input**: AI-powered speech-to-triage conversion
3. **Critical Alerts**: Automatic escalation for chest pain, stroke symptoms
4. **Resource Intelligence**: Track oxygen, blood, ICU bed availability

## Workflow Automation
- **Fast-track for Low Acuity**: Automated routing for minor cases
- **Trauma Protocols**: One-click activation of trauma teams
- **Pre-hospital Integration**: GPS tracking of incoming ambulances

The system is designed for sub-1-minute triage times in high-volume scenarios.`;
    }

    // API/External sync questions
    if (msg.includes('api') || msg.includes('external') || msg.includes('sync') || msg.includes('integration')) {
      return `# External API Integration

## Available APIs
1. **Hospital Network API**: Real-time bed availability across external hospitals
2. **Lab Integration**: Bidirectional sync for test orders and results
3. **Insurance Verification**: Real-time eligibility checks
4. **EHR Sync**: HL7/FHIR-compliant data exchange

## Implementation
Use our RESTful API endpoints with OAuth 2.0 authentication. The platform supports webhooks for real-time updates.

## Rate Limits
- Standard tier: 1000 req/hour
- Enterprise: Unlimited with SLA

Documentation available at \`/api/docs\` when running locally.`;
    }

    // Surgery/OT questions
    if (msg.includes('surgery') || msg.includes('ot') || msg.includes('operating') || msg.includes('theatre')) {
      return `# Surgical Orchestration

## OT Management Features
1. **AI Scheduling**: Optimizes theatre utilization using ML
2. **Pre-op Readiness**: Tracks patient preparation status
3. **Resource Allocation**: Manages surgical teams, equipment
4. **Efficiency Audits**: Real-time bottleneck detection

## Intelligence Layer
The system calculates expected surgery duration, accounts for cleaning time, and suggests optimal patient-to-theatre assignments to maximize throughput while maintaining quality standards.`;
    }

    // Architecture/Development questions
    if (mode === 'dev' || msg.includes('architecture') || msg.includes('tech') || msg.includes('stack')) {
      return `# Platform Architecture

## Tech Stack
- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **AI Layer**: Google Gemini API for reasoning & documentation
- **State Management**: React hooks + localStorage
- **Real-time**: WebSocket support for live updates

## Design Patterns
- **Module-based**: Each feature is a self-contained component
- **Service Layer**: All AI logic abstracted to \`geminiService.ts\`
- **Type-safe**: Full TypeScript coverage

## Key Files
- \`App.tsx\`: Main orchestration logic
- \`services/geminiService.ts\`: AI integration layer
- \`components/\`: Feature modules (Triage, OT, Finance, etc.)`;
    }

    // Default helpful response
    return `# Platform Mentor Active

I'm your **Orchestra Health Platform Mentor** in **${mode.toUpperCase()}** mode.

## I can help with:
- **OPI & Triage**: How our priority scoring works
- **Bed Allocation**: Smart patient placement algorithms
- **ER Workflows**: Emergency department features
- **Surgery Orchestration**: OT scheduling and optimization
- **System Architecture**: Tech stack and design patterns
- **API Integration**: External system connections

**Ask me anything about the platform!** Try questions like:
- "Explain bed allocation"
- "How does contagion score work?"
- "What ER features are available?"
- "Tell me about the tech stack"`;
  }
};

/**
 * Uses Gemini 3 Flash for quick virtual triage chat responses.
 */
export const getTriageChatResponse = async (history: any[], userMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'models/gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: "You are the Orchestra Virtual Triage Assistant. Provide clinical guidance. Always prioritize life-saving alerts if chest pain or stroke symptoms are mentioned.",
      },
    });
    return response.text || "Please describe your symptoms so I can assist you.";
  } catch (error) {
    console.error("Gemini Triage Chat Error:", error);
    const msg = userMessage.toLowerCase();
    if (msg.includes('chest pain')) return "🚨 EMERGENCY: Seek immediate care.";
    return "Please describe your symptoms so I can assist you.";
  }
};

/**
 * Uses Gemini 3 Flash to synthesize audit logs for compliance reporting.
 */
export const generateComplianceReport = async (logs: AuditLog[]): Promise<string> => {
  try {
    const logSummary = logs.map(l => `[${l.timestamp}] ${l.action}: ${l.details}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'models/gemini-2.5-flash',
      contents: `Synthesize a HIPAA compliance audit summary from these logs:\n\n${logSummary}`,
      config: {
        systemInstruction: "You are a professional healthcare compliance auditor.",
      },
    });
    return response.text || `Compliance Audit: ${logs.length} events processed.`;
  } catch (error) {
    console.error("Gemini Compliance Report Error:", error);
    return `Compliance Audit: ${logs.length} events processed.`;
  }
};
