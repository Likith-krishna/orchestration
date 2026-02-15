
import React, { useState } from 'react';
import { Patient, PatientStatus, Department, Vitals, InsuranceInfo, BehavioralVitals } from '../types';
import VoiceSymptomInput from './VoiceSymptomInput';
import { VoiceTriageAnalysis } from '../services/geminiService';

type Language = 'en' | 'hi' | 'ta' | 'te' | 'ml' | 'kn';

interface TranslationSet {
  title: string;
  subtitle: string;
  basicInfo: string;
  fullName: string;
  age: string;
  gender: string;
  prefLang: string;
  severity: string;
  vitals: string;
  temp: string;
  spo2: string;
  bpSys: string;
  bpDia: string;
  insurance: string;
  provider: string;
  policy: string;
  coverage: string;
  complaints: string;
  symptomPlaceholder: string;
  commonSymptoms: string;
  selectSymptom: string;
  add: string;
  clinicalContext: string;
  history: string;
  meds: string;
  completeness: string;
  submit: string;
  male: string;
  female: string;
  other: string;
  mild: string;
  moderate: string;
  severe: string;
  noSymptoms: string;
}

const translations: Record<Language, TranslationSet> = {
  en: {
    title: 'New Patient Intake',
    subtitle: 'Complete all fields for AI-assisted clinical and operational triage.',
    basicInfo: 'Basic Information',
    fullName: 'Full Name',
    age: 'Age',
    gender: 'Gender',
    prefLang: 'Preferred Language',
    severity: 'Symptom Severity',
    vitals: 'Vitals & Measurements',
    temp: 'Temperature (°C)',
    spo2: 'SpO₂ (%)',
    bpSys: 'BP Systolic',
    bpDia: 'BP Diastolic',
    insurance: 'Insurance & Coverage',
    provider: 'Provider',
    policy: 'Policy #',
    coverage: 'Coverage Type',
    complaints: 'Symptoms & Presentation',
    symptomPlaceholder: 'Type and describe symptoms here...',
    commonSymptoms: 'Common Symptoms',
    selectSymptom: 'Select common symptom...',
    add: 'Add',
    clinicalContext: 'Clinical Context',
    history: 'Medical History',
    meds: 'Current Medications',
    completeness: 'DATA COMPLETENESS',
    submit: 'Start AI Orchestration 🚀',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    mild: 'MILD',
    moderate: 'MODERATE',
    severe: 'SEVERE',
    noSymptoms: 'No symptoms recorded yet'
  },
  hi: {
    title: 'नया रोगी पंजीकरण',
    subtitle: 'एआई-सहायता प्राप्त नैदानिक और परिचालन ट्राइएज के लिए सभी फ़ील्ड भरें।',
    basicInfo: 'मूल जानकारी',
    fullName: 'पूरा नाम',
    age: 'आयु',
    gender: 'लिंग',
    prefLang: 'पसंदीदा भाषा',
    severity: 'लक्षणों की गंभीरता',
    vitals: 'महत्वपूर्ण लक्षण और माप',
    temp: 'तापमान (°C)',
    spo2: 'SpO₂ (%)',
    bpSys: 'बीपी सिस्टोलिक',
    bpDia: 'बीपी डायस्टोलिक',
    insurance: 'बीमा और कवरेज',
    provider: 'प्रदाता',
    policy: 'पॉलिसी नंबर',
    coverage: 'कवरेज का प्रकार',
    complaints: 'लक्षण और प्रस्तुति',
    symptomPlaceholder: 'यहां लक्षणों का वर्णन करें...',
    commonSymptoms: 'सामान्य लक्षण',
    selectSymptom: 'सामान्य लक्षण चुनें...',
    add: 'जोड़ें',
    clinicalContext: 'नैदानिक संदर्भ',
    history: 'चिकित्सा इतिहास',
    meds: 'वर्तमान दवाएं',
    completeness: 'डेटा पूर्णता',
    submit: 'एआई ऑर्केस्ट्रेशन शुरू करें 🚀',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    mild: 'हल्का',
    moderate: 'मध्यम',
    severe: 'गंभीर',
    noSymptoms: 'अभी तक कोई लक्षण दर्ज नहीं किया गया'
  },
  ta: {
    title: 'புதிய நோயாளி சேர்க்கை',
    subtitle: 'AI-உதவியுடன் கூடிய மருத்துவ மற்றும் செயல்பாட்டு பரிசோதனைக்கு அனைத்து புலங்களையும் நிரப்பவும்.',
    basicInfo: 'അടിസ്ഥാന വിവരങ്ങൾ',
    fullName: 'முழு பெயர்',
    age: 'வயது',
    gender: 'பாலினம்',
    prefLang: 'விருப்பமான மொழி',
    severity: 'அறிகுறியின் தீவிரம்',
    vitals: 'உயிர் குறிகள் மற்றும் அளவீடுகள்',
    temp: 'வெப்பநிலை (°C)',
    spo2: 'SpO₂ (%)',
    bpSys: 'இரத்த அழுத்தம் (சிஸ்டாலிக்)',
    bpDia: 'இரத்த அழுத்தம் (டயஸ்டாலிக்)',
    insurance: 'காப்பீடு மற்றும் கவரேஜ்',
    provider: 'வழங்குநர்',
    policy: 'பாலிசி எண்',
    coverage: 'கவரேஜ் வகை',
    complaints: 'அறிகுறிகள் & விளக்கக்காட்சி',
    symptomPlaceholder: 'அறிகுறிகளை இங்கே விவரிக்கவும்...',
    commonSymptoms: 'பொதுவான அறிகுறிகள்',
    selectSymptom: 'பொதுவான அறிகுறியைத் தேர்ந்தெடுக்கவும்...',
    add: 'சேர்',
    clinicalContext: 'மருத்துவ சூழல்',
    history: 'மருத்துவ வரலாறு',
    meds: 'தற்போதைய மருந்தకులు',
    completeness: 'தரவு முழுமை',
    submit: 'AI ஒருங்கிணைப்பைத் தொடங்கு 🚀',
    male: 'ஆண்',
    female: 'பெண்',
    other: 'மற்றவை',
    mild: 'லேசானது',
    moderate: 'மிதமானது',
    severe: 'கடுமையானது',
    noSymptoms: 'இன்னும் அறிகுறிகள் எதுவும் பதிவு செய்யப்படவில்லை'
  },
  te: {
    title: 'కొత్త పేషెంట్ ఇన్టేక్',
    subtitle: 'AI-సహాయక క్లినికల్ మరియు ఆపరేషనల్ ట్రియేజ్ కోసం అన్ని ఫీల్డ్‌లను పూర్తి చేయండి.',
    basicInfo: 'ప్రాథమిక సమాచారం',
    fullName: 'పూర్తి పేరు',
    age: 'వయస్సు',
    gender: 'లింగం',
    prefLang: 'ప్రాధాన్య భాష',
    severity: 'లక్షణాల తీవ్రత',
    vitals: 'వైటల్స్ & కొలతలు',
    temp: 'ఉష్ణోగ్రత (°C)',
    spo2: 'SpO₂ (%)',
    bpSys: 'బిపి సిస్టోలిక్',
    bpDia: 'బిపి డయాస్టోలిక్',
    insurance: 'భీమా & కవరేజ్',
    provider: 'ప్రొవైడర్',
    policy: 'పాలసీ నంబర్',
    coverage: 'కవరేజ్ రకం',
    complaints: 'లక్షణాలు & ప్రెజెంటేషన్',
    symptomPlaceholder: 'లక్షణాలను ఇక్కడ వివరించండి...',
    commonSymptoms: 'సాధారణ లక్షణాలు',
    selectSymptom: 'సాధారణ లక్షణాన్ని ఎంచుకోండి...',
    add: 'జోడించు',
    clinicalContext: 'క్లినికల్ సందర్భం',
    history: 'వైద్య చరిత్ర',
    meds: 'ప్రస్తుత మందులు',
    completeness: 'డేటా పరిపూర్ణత',
    submit: 'AI ఆర్కెస్ట్రేషన్‌ను ప్రారంభించండి 🚀',
    male: 'పురుషుడు',
    female: 'స్త్రీ',
    other: 'ఇతర',
    mild: 'తక్కువ',
    moderate: 'మధ్యస్థం',
    severe: 'తీవ్రమైనది',
    noSymptoms: 'ఇంకా ఎటువంటి లక్షణాలు నమోదు కాలేదు'
  },
  ml: {
    title: 'പുതിയ രോഗി രജിസ്ട്രേഷൻ',
    subtitle: 'AI സഹായത്തോടെയുള്ള പരിശോധനയ്ക്കായി എല്ലാ വിവരങ്ങളും പൂരിപ്പിക്കുക.',
    basicInfo: 'അടിസ്ഥാന വിവരങ്ങൾ',
    fullName: 'പൂർണ്ണനാമം',
    age: 'പ്രായം',
    gender: 'ലിംഗം',
    prefLang: 'മുൻഗണനാ ഭാഷ',
    severity: 'ലക്ഷണങ്ങളുടെ തീവ്രത',
    vitals: 'വൈറ്റൽസ് & അളവുകൾ',
    temp: 'താപനില (°C)',
    spo2: 'SpO₂ (%)',
    bpSys: 'ബിപി സിസ്റ്റോളിക്',
    bpDia: 'ബിപി ഡയയസ്റ്റോളിക്',
    insurance: 'ഇൻഷുറൻസ് & കവറേജ്',
    provider: 'ദാതാവ്',
    policy: 'പോളിസി നമ്പർ',
    coverage: 'കവേജ് തരം',
    complaints: 'ലക്ഷണങ്ങളും പ്രകടനവും',
    symptomPlaceholder: 'ലക്ഷണങ്ങൾ ഇവിടെ വിവരിക്കുക...',
    commonSymptoms: 'സാധാരണ ലക്ഷണങ്ങൾ',
    selectSymptom: 'ലക്ഷണം തിരഞ്ഞെടുക്കുക...',
    add: 'ചേർക്കുക',
    clinicalContext: 'ക്ലിനിക്കൽ പശ്ചാത്തലം',
    history: 'രോഗചരിത്രം',
    meds: 'നിലവിലെ മരുന്നുകൾ',
    completeness: 'വിവരങ്ങളുടെ പൂർണ്ണത',
    submit: 'AI ഓർക്കസ്ട്രേഷൻ തുടങ്ങുക 🚀',
    male: 'പുരുഷൻ',
    female: 'സ്ത്രീ',
    other: 'മറ്റുള്ളവ',
    mild: 'മിതമായത്',
    moderate: 'ഇടത്തരം',
    severe: 'കഠിനമായത്',
    noSymptoms: 'ലക്ഷണങ്ങളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല'
  },
  kn: {
    title: 'ಹೊಸ ರೋಗಿಯ ನೋಂದಣಿ',
    subtitle: 'AI-ಸಹಾಯದ ಕ್ಲಿನಿಕಲ್ ಪರೀಕ್ಷೆಗಾಗಿ ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.',
    basicInfo: 'ಮೂಲ ಮಾಹಿತಿ',
    fullName: 'ಪೂರ್ಣ ಹೆಸರು',
    age: 'ವಯಸ್ಸು',
    gender: 'ಲಿಂಗ',
    prefLang: 'ಆದ್ಯತೆಯ ಭಾಷೆ',
    severity: 'ಲಕ್ಷಣಗಳ ತೀವ್ರತೆ',
    vitals: 'ವೈಟಲ್ಸ್ ಮತ್ತು ಅಳತೆಗಳು',
    temp: 'ತಾಪಮಾನ (°C)',
    spo2: 'SpO₂ (%)',
    bpSys: 'ಬಿಪಿ ಸಿಸ್ಟೊಲಿಕ್',
    bpDia: 'ಬಿಪಿ ಡಯಾಸ್ಟೊಲಿಕ್',
    insurance: 'ವಿಮೆ ಮತ್ತು ಕವರೇಜ್',
    provider: 'ವಿಮಾ ಸಂಸ್ಥೆ',
    policy: 'ಪಾಲಿಸಿ ಸಂಖ್ಯೆ',
    coverage: 'ಕವರೇಜ್ ವಿಧ',
    complaints: 'ಲಕ್ಷಣಗಳು ಮತ್ತು ಪ್ರಸ್ತುತಿ',
    symptomPlaceholder: 'ಲಕ್ಷಣಗಳನ್ನು ಇಲ್ಲಿ ವಿವರಿಸಿ...',
    commonSymptoms: 'ಸಾಮಾನ್ಯ ಲಕ್ಷಣಗಳು',
    selectSymptom: 'ಸಾಮಾನ್ಯ ಲಕ್ಷಣವನ್ನು ಆರಿಸಿ...',
    add: 'ಸೇರಿಸಿ',
    clinicalContext: 'ಕ್ಲಿನಿಕಲ್ ಮಾಹಿತಿ',
    history: 'ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ',
    meds: 'ಪ್ರಸ್ತುತ ಔಷಧಿಗಳು',
    completeness: 'ಮಾಹಿತಿ ಪೂರ್ಣತೆ',
    submit: 'AI ಆರ್ಕೆಸ್ಟ್ರೇಶನ್ ಪ್ರಾರಂಭಿಸಿ 🚀',
    male: 'ಪುರುಷ',
    female: 'ಮಹಿಳೆ',
    other: 'ಇತರ',
    mild: 'ಕಡಿಮೆ',
    moderate: 'ಮಧ್ಯಮ',
    severe: 'ತೀವ್ರ',
    noSymptoms: 'ಇನ್ನೂ ಯಾವುದೇ ಲಕ್ಷಣಗಳು ದಾಖಲಾಗಿಲ್ಲ'
  }
};

const COMMON_SYMPTOMS_LIST = [
  'Fever', 'Cough', 'Cold', 'Vomiting', 'Diarrhea', 'Headache', 'Chest Pain', 
  'Shortness of Breath', 'Abdominal Pain', 'Fatigue', 'Dizziness', 'Nausea',
  'Body Ache', 'Sore Throat', 'Loss of Appetite', 'Joint Pain'
];

interface IntakeFormProps {
  onSubmit: (patient: Patient) => void;
}

const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit }) => {
  const [lang, setLang] = useState<Language>('en');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    age: 0,
    gender: 'Other',
    contact: '',
    preferredLanguage: 'en',
    symptoms: [],
    severity: 5,
    duration: '',
    history: '',
    medications: '',
    insurance: {
      provider: '',
      policyNumber: '',
      coverageType: 'Basic',
      status: 'Pending'
    },
    vitals: {
      temp: 36.6,
      bp_sys: 120,
      bp_dia: 80,
      pulse: 72,
      spo2: 98,
      resp_rate: 16
    },
    behavioralVitals: undefined
  });

  const [symptomInput, setSymptomInput] = useState('');
  const t = translations[lang];

  const handleVoiceResult = (analysis: VoiceTriageAnalysis, rawTranscript: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: [...(prev.symptoms || []), ...analysis.symptoms_detected],
      severity: analysis.severity_score,
      behavioralVitals: analysis.behavioral_vitals,
      history: (prev.history || '') + (prev.history ? '\n' : '') + `[VOICE TRANSCRIPT]: ${rawTranscript}`
    }));
    setInputMode('text');
  };

  const addSymptom = (symptom: string) => {
    const trimmed = symptom.trim();
    if (trimmed && !formData.symptoms?.includes(trimmed)) {
      setFormData(prev => ({ ...prev, symptoms: [...(prev.symptoms || []), trimmed] }));
      setSymptomInput('');
    }
  };

  const handleVitalsChange = (key: keyof Vitals, val: string) => {
    const num = parseFloat(val);
    setFormData(prev => ({
      ...prev,
      vitals: { ...prev.vitals!, [key]: num }
    }));
  };

  const handleInsuranceChange = (key: keyof InsuranceInfo, val: string) => {
    setFormData(prev => ({
      ...prev,
      insurance: { ...prev.insurance!, [key]: val } as InsuranceInfo
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPatient: Patient = {
      ...formData as Patient,
      id: `P-${Math.floor(Math.random() * 10000)}`,
      status: PatientStatus.TRIAGE,
      careHistory: formData.careHistory || []
    };
    onSubmit(newPatient);
  };

  const completeness = Object.values(formData).filter(v => !!v).length / 13 * 100;

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn relative">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="medical-gradient p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{t.title}</h2>
            <p className="text-blue-100 text-sm mt-1">{t.subtitle}</p>
          </div>
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/20">
            {(['en', 'hi', 'ta', 'te', 'ml', 'kn'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setFormData(prev => ({ ...prev, preferredLanguage: l }));
                }}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${
                  lang === l ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-100 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-tight">{t.basicInfo}</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t.fullName}</label>
                <input 
                  type="text" required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black font-medium"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.age}</label>
                  <input 
                    type="number" required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black font-medium"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.gender}</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black font-medium"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="Male">{t.male}</option>
                    <option value="Female">{t.female}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t.severity} (1-10)</label>
                <input 
                  type="range" min="1" max="10" 
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={formData.severity}
                  onChange={e => setFormData({...formData, severity: parseInt(e.target.value)})}
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                  <span>{t.mild}</span>
                  <span>{t.moderate}</span>
                  <span>{t.severe}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-tight">{t.vitals}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.temp}</label>
                  <input 
                    type="number" step="0.1"
                    className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none text-black font-medium ${formData.vitals?.temp! > 38 ? 'border-rose-300 bg-rose-50' : ''}`}
                    value={formData.vitals?.temp}
                    onChange={e => handleVitalsChange('temp', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.spo2}</label>
                  <input 
                    type="number"
                    className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none text-black font-medium ${formData.vitals?.spo2! < 94 ? 'border-rose-300 bg-rose-50' : ''}`}
                    value={formData.vitals?.spo2}
                    onChange={e => handleVitalsChange('spo2', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.bpSys}</label>
                  <input 
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-black font-medium"
                    value={formData.vitals?.bp_sys}
                    onChange={e => handleVitalsChange('bp_sys', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.bpDia}</label>
                  <input 
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-black font-medium"
                    value={formData.vitals?.bp_dia}
                    onChange={e => handleVitalsChange('bp_dia', e.target.value)}
                  />
                </div>
              </div>
              
              {formData.behavioralVitals && (
                <div className="mt-4 p-5 bg-blue-50 border border-blue-100 rounded-[2rem] animate-fadeIn relative">
                   <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Acoustic Behavioral Signals</h4>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Non-Diagnostic Estimation</span>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                         <p className="text-[8px] font-bold text-slate-500 uppercase">Stress Signal</p>
                         <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              formData.behavioralVitals.stressLevel === 'High' ? 'bg-rose-100 text-rose-600' :
                              formData.behavioralVitals.stressLevel === 'Moderate' ? 'bg-amber-100 text-amber-600' :
                              'bg-emerald-100 text-emerald-600'
                            }`}>{formData.behavioralVitals.stressLevel}</span>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[8px] font-bold text-slate-500 uppercase">Panic Probability</p>
                         <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${Math.round(formData.behavioralVitals.panicProbability * 100)}%` }} />
                            </div>
                            <p className="text-xs font-black text-slate-800">{Math.round(formData.behavioralVitals.panicProbability * 100)}%</p>
                         </div>
                      </div>
                   </div>
                   <div className="mt-4 p-3 bg-white/60 rounded-xl border border-blue-100/50">
                     <p className="text-[9px] text-blue-700 italic leading-relaxed">
                       "{formData.behavioralVitals.aiNote}"
                     </p>
                   </div>
                   <div className="mt-3 text-[7px] text-slate-400 font-bold uppercase tracking-widest text-center">
                     ⚠️ Behavioral markers are used only for prioritization assistance.
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-tight">{t.insurance}</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.provider}</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black font-medium"
                      value={formData.insurance?.provider}
                      onChange={e => handleInsuranceChange('provider', e.target.value)}
                      placeholder="e.g. BlueCross"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.policy}</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black font-medium"
                      value={formData.insurance?.policyNumber}
                      onChange={e => handleInsuranceChange('policyNumber', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.coverage}</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black font-medium"
                      value={formData.insurance?.coverageType}
                      onChange={e => handleInsuranceChange('coverageType', e.target.value)}
                    >
                      <option value="Basic">Basic Plan</option>
                      <option value="Premium">Premium / Private</option>
                      <option value="Government">Government / Medicaid</option>
                      <option value="None">Self-Pay</option>
                    </select>
                  </div>
               </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{t.complaints}</h3>
                <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                   <button 
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1 text-[8px] font-black uppercase rounded-md transition-all ${inputMode === 'text' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >Text Mode</button>
                   <button 
                    type="button"
                    onClick={() => setInputMode('voice')}
                    className={`px-3 py-1 text-[8px] font-black uppercase rounded-md transition-all ${inputMode === 'voice' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >Voice Triage</button>
                </div>
              </div>

              {inputMode === 'voice' ? (
                <VoiceSymptomInput 
                  onRecordingStateChange={setIsRecording}
                  onResult={handleVoiceResult} 
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.commonSymptoms}</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black font-medium"
                      onChange={e => e.target.value && addSymptom(e.target.value)}
                      value=""
                    >
                      <option value="" disabled>{t.selectSymptom}</option>
                      {COMMON_SYMPTOMS_LIST.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.symptomPlaceholder}</label>
                    <div className="flex flex-col gap-2">
                      <textarea 
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-black font-medium focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                        placeholder={t.symptomPlaceholder}
                        value={symptomInput}
                        onChange={e => setSymptomInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addSymptom(symptomInput);
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => addSymptom(symptomInput)} 
                        className="self-end bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
                      >
                        <span>➕</span> {t.add}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 min-h-[40px] p-3 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                {formData.symptoms?.length === 0 ? (
                  <span className="text-[10px] text-slate-400 italic font-medium uppercase tracking-widest px-2">{t.noSymptoms}</span>
                ) : (
                  formData.symptoms?.map(s => (
                    <span key={s} className="bg-white text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border border-blue-100 flex items-center gap-2 group hover:bg-blue-50 transition-all shadow-sm">
                      {s}
                      <button type="button" onClick={() => setFormData(p => ({ ...p, symptoms: p.symptoms?.filter(x => x !== s) }))} className="text-slate-300 hover:text-rose-600 transition-colors">&times;</button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-tight">{t.clinicalContext}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t.history}</label>
                <textarea 
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm h-24 text-black font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.history}
                  onChange={e => setFormData({...formData, history: e.target.value})}
                  placeholder="Known allergies, previous surgeries, chronic conditions..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t.meds}</label>
                <textarea 
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm h-24 text-black font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.medications}
                  onChange={e => setFormData({...formData, medications: e.target.value})}
                  placeholder="List all current prescriptions and OTC medications..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-4">
              <div className="w-48 h-2 bg-slate-100 rounded-full">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${completeness}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.completeness} {Math.round(completeness)}%</span>
            </div>
            <button 
              type="submit"
              disabled={isRecording}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-10 rounded-xl shadow-xl shadow-blue-200 transition-all flex items-center gap-3 uppercase tracking-widest active:scale-95 disabled:opacity-50"
            >
              {t.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntakeForm;
