
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientStatus, Department } from '../types';

type Language = 'en' | 'hi' | 'ta' | 'te' | 'ml' | 'kn';

interface TranslationSet {
  portalTitle: string;
  portalSubtitle: string;
  selectLanguage: string;
  viewStatus: string;
  noPatients: string;
  backToList: string;
  currentStatus: string;
  patientId: string;
  queuePosition: string;
  ofPatients: string;
  estWaitTime: string;
  mins: string;
  na: string;
  subjectToPriority: string;
  assignedWard: string;
  followSigns: string;
  disclaimer: string;
  getSms: string;
  sendingSms: string;
  msgNow: string;
  smsTemplate: (name: string, id: string, pos: string | number, wait: string | number, ward: string, risk: string, status: string) => string;
  statusMap: Record<PatientStatus, string>;
  deptMap: Record<string, string>;
}

const translations: Record<Language, TranslationSet> = {
  en: {
    portalTitle: 'Patient Portal',
    portalSubtitle: 'Live clinical status tracking for patients and families.',
    selectLanguage: 'Language',
    viewStatus: 'View Status →',
    noPatients: 'No active patients found in the system.',
    backToList: '← Back to Patient List',
    currentStatus: 'Current Status',
    patientId: 'Patient ID',
    queuePosition: 'Queue Position',
    ofPatients: 'of patients',
    estWaitTime: 'Est. Wait Time',
    mins: 'mins',
    na: 'N/A',
    msgNow: 'MESSAGES • NOW',
    subjectToPriority: 'subject to clinical priority',
    assignedWard: 'Assigned Ward',
    followSigns: 'Follow building signs',
    disclaimer: 'Wait times are estimates and may change based on emergency cases. If you experience worsening symptoms (e.g. chest pain, difficulty breathing), please notify a staff member immediately.',
    getSms: 'Get SMS Notification Updates',
    sendingSms: 'Transmitting Update...',
    smsTemplate: (name, id, pos, wait, ward, risk, status) => `ORCHESTRA HEALTH [REF: ${id}] | ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
Hi ${name}. Status: ${status} in ${ward}. 
Urgency: ${risk}. Queue: #${pos} | Est: ${wait}m.
Protocol: Targeted Clinical Pathway Activated.
Track Live: https://orch.ai/track/${id}
⚠️ SAFETY: Notify staff IMMEDIATELY if experiencing: Chest Pain, Severe Dizziness, or Shortness of Breath.`,
    statusMap: {
      [PatientStatus.PRE_HOSPITAL]: 'Pre-Hospital Triage',
      [PatientStatus.AMBULANCE]: 'In Ambulance',
      [PatientStatus.TRIAGE]: 'In Triage',
      [PatientStatus.QUEUED]: 'Queued',
      [PatientStatus.DIAGNOSIS]: 'Under Diagnosis',
      [PatientStatus.ADMITTED]: 'Admitted',
      [PatientStatus.SURGERY]: 'In Surgery',
      [PatientStatus.DISCHARGED]: 'Discharged'
    },
    deptMap: {
      [Department.EMERGENCY]: 'Emergency',
      [Department.CARDIOLOGY]: 'Cardiology',
      [Department.NEUROLOGY]: 'Neurology',
      [Department.GENERAL_MEDICINE]: 'General Medicine',
      [Department.ORTHOPEDICS]: 'Orthopedics',
      [Department.PEDIATRICS]: 'Pediatrics',
      [Department.SURGERY]: 'Surgery',
      [Department.ICU]: 'ICU',
      'Triage': 'Triage Area'
    }
  },
  hi: {
    portalTitle: 'पेशेंट पोर्टल',
    portalSubtitle: 'रोगियों और उनके परिवारों के लिए लाइव क्लिनिकल स्थिति ट्रैकिंग।',
    selectLanguage: 'भाषा',
    viewStatus: 'स्थिति देखें →',
    noPatients: 'सिस्टम में कोई सक्रिय रोगी नहीं मिला।',
    backToList: '← रोगी सूची पर वापस जाएं',
    currentStatus: 'वर्तमान स्थिति',
    patientId: 'रोगी आईडी',
    queuePosition: 'कतार की स्थिति',
    ofPatients: 'मरीजों में से',
    estWaitTime: 'अनुमानित प्रतीक्षा समय',
    mins: 'मिनट',
    na: 'अनुपलब्ध',
    msgNow: 'संदेश • अभी',
    subjectToPriority: 'क्लिनिकल प्राथमिकता के अधीन',
    assignedWard: 'सौंपा गया वार्ड',
    followSigns: 'भवन के संकेतों का पालन करें',
    disclaimer: 'प्रतीक्षा समय अनुमानित है और आपातकालीन मामलों के आधार पर बदल सकता है। यदि आपके लक्षण बिगड़ते हैं, तो तुरंत स्टाफ को सूचित करें।',
    getSms: 'एसएमएस अपडेट प्राप्त करें',
    sendingSms: 'अपडेट भेज रहे हैं...',
    smsTemplate: (name, id, pos, wait, ward, risk, status) => `ORCHESTRA HEALTH [रिफ: ${id}] | ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
नमस्ते ${name}। स्थिति: ${status} (${ward})।
प्राथमिकता: ${risk}। कतार: #${pos} | प्रतीक्षा: ${wait} मिनट।
लाइव ट्रैक करें: https://orch.ai/track/${id}
⚠️ सुरक्षा: यदि सीने में दर्द, चक्कर आना या सांस लेने में कठिनाई हो, तो तुरंत स्टाफ को बताएं।`,
    statusMap: {
      [PatientStatus.PRE_HOSPITAL]: 'अस्पताल पूर्व ट्राइएज',
      [PatientStatus.AMBULANCE]: 'एम्बुलेंस में',
      [PatientStatus.TRIAGE]: 'ट्राइएज में',
      [PatientStatus.QUEUED]: 'कतार में',
      [PatientStatus.DIAGNOSIS]: 'निदान के तहत',
      [PatientStatus.ADMITTED]: 'भर्ती',
      [PatientStatus.SURGERY]: 'सर्जरी में',
      [PatientStatus.DISCHARGED]: 'डिस्चार्ज'
    },
    deptMap: {
      [Department.EMERGENCY]: 'आपातकालीन (ER)',
      [Department.CARDIOLOGY]: 'हृदय रोग विभाग',
      [Department.NEUROLOGY]: 'तंत्रिका विज्ञान',
      [Department.GENERAL_MEDICINE]: 'सामान्य चिकित्सा',
      [Department.ORTHOPEDICS]: 'हड्डी रोग विभाग',
      [Department.PEDIATRICS]: 'बाल रोग विभाग',
      [Department.SURGERY]: 'सर्जरी',
      [Department.ICU]: 'आईसीयू (ICU)',
      'Triage': 'ट्राइएज क्षेत्र'
    }
  },
  ta: {
    portalTitle: 'நோயாளி போர்டல்',
    portalSubtitle: 'நோயாளிகள் மற்றும் குடும்பத்தினருக்கான நேரடி மருத்துவ நிலை கண்காணிப்பு.',
    selectLanguage: 'மொழி',
    viewStatus: 'நிலையைப் பார்க்கவும் →',
    noPatients: 'கணினியில் செயலில் உள்ள நோயாளிகள் யாரும் இல்லை.',
    backToList: '← நோயாளி பட்டியலுக்குத் திரும்பு',
    currentStatus: 'தற்போதைய நிலை',
    patientId: 'நோயாளி ஐடி',
    queuePosition: 'வரிசை நிலை',
    ofPatients: 'நோயாளிகளில்',
    estWaitTime: 'மதிப்பிடப்பட்ட காத்திருப்பு நேரம்',
    mins: 'நிமிடம்',
    na: 'இல்லை',
    msgNow: 'செய்திகள் • இப்போது',
    subjectToPriority: 'மருத்துவ முன்னுரிமைக்கு உட்பட்டது',
    assignedWard: 'ஒதுக்கப்பட்ட வார்டு',
    followSigns: 'கட்டிட அடையாளங்களைப் பின்பற்றவும்',
    disclaimer: 'காத்திருப்பு நேரங்கள் மதிப்பீடுகள் மற்றும் அவசர நிலைகளைப் பொறுத்து மாறக்கூடும். அறிகுறிகள் மோசமடைந்தால் உடனடியாக ஊழியர்களிடம் தெரிவிக்கவும்.',
    getSms: 'SMS அறிவிப்பு புதுப்பிப்புகளைப் பெறுக',
    sendingSms: 'புதுப்பிப்பு அனுப்பப்படுகிறது...',
    smsTemplate: (name, id, pos, wait, ward, risk, status) => `ORCHESTRA HEALTH [REF: ${id}] | ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
வணக்கம் ${name}. நிலை: ${status} (${ward}).
முன்னுரிமை: ${risk}. வரிசை: #${pos} | காத்திருப்பு: ${wait} நிமிடங்கள்.
நேரடி கண்காணிப்பு: https://orch.ai/track/${id}
⚠️ பாதுகாப்பு: நெஞ்சு வலி அல்லது மூச்சுத் திணறல் ஏற்பட்டால் உடனடியாக ஊழியர்களிடம் தெரிவிக்கவும்.`,
    statusMap: {
      [PatientStatus.PRE_HOSPITAL]: 'மருத்துவமனைக்கு முந்தைய பரிசோதனை',
      [PatientStatus.AMBULANCE]: 'ஆம்புலன்ஸில்',
      [PatientStatus.TRIAGE]: 'பரிசோதனையில்',
      [PatientStatus.QUEUED]: 'வரிசையில்',
      [PatientStatus.DIAGNOSIS]: 'நோய் கண்டறிதலில்',
      [PatientStatus.ADMITTED]: 'அனுமதிக்கப்பட்டார்',
      [PatientStatus.SURGERY]: 'அறுவை சிகிச்சையில்',
      [PatientStatus.DISCHARGED]: 'டிஸ்சார்ஜ்'
    },
    deptMap: {
      [Department.EMERGENCY]: 'அவசர சிகிச்சை',
      [Department.CARDIOLOGY]: 'இதയவியல்',
      [Department.NEUROLOGY]: 'நரம்பியல்',
      [Department.GENERAL_MEDICINE]: 'பொது மருத்துவம்',
      [Department.ORTHOPEDICS]: 'எலும்பியல்',
      [Department.PEDIATRICS]: 'குழந்தை மருத்துவம்',
      [Department.SURGERY]: 'அறுவை சிகிச்சை',
      [Department.ICU]: 'தீவிர சிகிச்சை பிரிவு (ICU)',
      'Triage': 'பரிசோதனை பகுதி'
    }
  },
  te: {
    portalTitle: 'పేషెంట్ పోర్టల్',
    portalSubtitle: 'రోగులు మరియు కుటుంబాల కోసం ప్రత్యక్ష క్లినికల్ స్థితి ట్రాకింగ్.',
    selectLanguage: 'భాష',
    viewStatus: 'స్థితిని చూడండి →',
    noPatients: 'సిస్టమ్‌లో క్రియాశీల రోగులెవరూ కనుగొనబడలేదు.',
    backToList: '← రోగుల జాబితాకు తిరిగి వెళ్లు',
    currentStatus: 'ప్రస్తుత స్థితి',
    patientId: 'పేషెంట్ ఐడి',
    queuePosition: 'క్యూ స్థానం',
    ofPatients: 'రోగులలో',
    estWaitTime: 'అంచనా వేయబడిన నిరీక్షణ సమయం',
    mins: 'నిమిషాలు',
    na: 'సమాచారం లేదు',
    msgNow: 'మెసేజ్ • ఇప్పుడు',
    subjectToPriority: 'క్లినికల్ ప్రాధాన్యతకు లోబడి ఉంటుంది',
    assignedWard: 'కేటాయించిన వార్డు',
    followSigns: 'భవనం సంకేతాలను అనుసరించండి',
    disclaimer: 'వేచి ఉండే సమయాలు అంచనాలు మరియు అత్యవసర కేసుల ఆధారంగా మారవచ్చు. లక్షణాలు తీవ్రమైతే వెంటనే సిబ్బందికి తెలియజేయండి.',
    getSms: 'SMS నోటిఫికేషన్ అప్‌డేట్‌లను పొందండి',
    sendingSms: 'అప్‌డేట్ పంపిస్తోంది...',
    smsTemplate: (name, id, pos, wait, ward, risk, status) => `ORCHESTRA HEALTH [REF: ${id}] | ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
నమస్కారం ${name}. స్థితి: ${status} (${ward}).
ప్రాధాన్యత: ${risk}. క్యూ: #${pos} | నిరీక్షణ: ${wait} నిమిషాలు.
లైవ్ ట్రాకింగ్: https://orch.ai/track/${id}
⚠️ భద్రత: శ్వాస తీసుకోవడంలో ఇబ్బందిగా అనిపిస్తే వెంటనే సిబ్బందికి తెలియజేయండి.`,
    statusMap: {
      [PatientStatus.PRE_HOSPITAL]: 'ప్రీ-హాస్పిటల్ ట్రియేజ్',
      [PatientStatus.AMBULANCE]: 'అంబులెన్స్‌లో',
      [PatientStatus.TRIAGE]: 'ట్రయేజ్‌లో',
      [PatientStatus.QUEUED]: 'క్యూలో ఉన్నారు',
      [PatientStatus.DIAGNOSIS]: 'రోగ నిర్ధారణలో',
      [PatientStatus.ADMITTED]: 'అడ్మిట్ అయ్యారు',
      [PatientStatus.SURGERY]: 'సర్జరీలో',
      [PatientStatus.DISCHARGED]: 'డిశ్చార్జ్'
    },
    deptMap: {
      [Department.EMERGENCY]: 'అత్యవసర విభాగం',
      [Department.CARDIOLOGY]: 'కార్డియాలజీ',
      [Department.NEUROLOGY]: 'న్యూరాలజీ',
      [Department.GENERAL_MEDICINE]: 'జనరల్ మెడిసిన్',
      [Department.ORTHOPEDICS]: 'ఆర్థోపెడిక్స్',
      [Department.PEDIATRICS]: 'పీడియాట్రిక్స్',
      [Department.SURGERY]: 'సర్జరీ',
      [Department.ICU]: 'ఐసియు (ICU)',
      'Triage': 'ట్రయేజ్ ఏరియా'
    }
  },
  ml: {
    portalTitle: 'പേഷ്യന്റ് പോർട്ടൽ',
    portalSubtitle: 'രോഗികൾക്കും കുടുംബങ്ങൾക്കുമായി തത്സമയ ക്ലിനിക്കൽ സ്റ്റാറ്റസ് ട്രാക്കിംഗ്.',
    selectLanguage: 'ഭാഷ',
    viewStatus: 'നില പരിശോധിക്കുക →',
    noPatients: 'സിസ്റ്റത്തിൽ സജീവമായ രോഗികളെയൊന്നും കണ്ടെത്തിയില്ല.',
    backToList: '← രോഗികളുടെ പട്ടികയിലേക്ക് മടങ്ങുക',
    currentStatus: 'നിലവിലെ നില',
    patientId: 'പേഷ്യന്റ് ഐഡി',
    queuePosition: 'ക്യൂ സ്ഥാനം',
    ofPatients: 'രോഗികളിൽ',
    estWaitTime: 'പ്രതീക്ഷിക്കുന്ന കാത്തിരിപ്പ് സമയം',
    mins: 'മിനിറ്റ്',
    na: 'ലഭ്യമല്ല',
    msgNow: 'സന്ദേശങ്ങൾ • ഇപ്പോൾ',
    subjectToPriority: 'മുൻഗണനയ്ക്ക് വിധേയമാണ്',
    assignedWard: 'അനുവദിച്ച വാർഡ്',
    followSigns: 'കെട്ടിടത്തിലെ അടയാളങ്ങൾ ശ്രദ്ധിക്കുക',
    disclaimer: 'കാത്തിരിപ്പ് സമയം ഏകദേശമാണ്, അത് മാറാൻ സാധ്യതയുണ്ട്. ലക്ഷണങ്ങൾ കൂടുകയാണെങ്കിൽ ഉടൻ സ്റ്റാഫിനെ അറിയിക്കുക.',
    getSms: 'SMS അറിയിപ്പുകൾ ലഭിക്കാൻ',
    sendingSms: 'സന്ദേശം അയക്കുന്നു...',
    smsTemplate: (name, id, pos, wait, ward, risk, status) => `ORCHESTRA HEALTH [REF: ${id}] | ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
നമസ്കാരം ${name}. നില: ${status} (${ward}).
മുൻഗണന: ${risk}. ക്യൂ: #${pos} | കാത്തിരിപ്പ്: ${wait} മിനിറ്റ്.
ലൈവ് ട്രാക്കിംഗ്: https://orch.ai/track/${id}
⚠️ മുന്നറിയിപ്പ്: ശ്വാസതടസ്സം അനുഭവപ്പെട്ടാൽ ഉടൻ സ്റ്റാഫിനെ അറിയിക്കുക.`,
    statusMap: {
      [PatientStatus.PRE_HOSPITAL]: 'പ്രീ-ഹോസ്പിറ്റൽ ട്രയേജ്',
      [PatientStatus.AMBULANCE]: 'ആംബുലൻസിൽ',
      [PatientStatus.TRIAGE]: 'ട്രയേജിൽ',
      [PatientStatus.QUEUED]: 'ക്യൂവിൽ',
      [PatientStatus.DIAGNOSIS]: 'പരിശോധനയിൽ',
      [PatientStatus.ADMITTED]: 'അഡ്മിറ്റ് ചെയ്തു',
      [PatientStatus.SURGERY]: 'ശസ്ത്രക്രിയയിൽ',
      [PatientStatus.DISCHARGED]: 'ഡിസ്ചാർജ് ചെയ്തു'
    },
    deptMap: {
      [Department.EMERGENCY]: 'എമർജൻസി വിഭാഗം',
      [Department.CARDIOLOGY]: 'കാർഡിയോളജി',
      [Department.NEUROLOGY]: 'ന്യൂറോളജി',
      [Department.GENERAL_MEDICINE]: 'ജനറൽ മെഡിസിൻ',
      [Department.ORTHOPEDICS]: 'ഓർത്തോപീഡിക്സ്',
      [Department.PEDIATRICS]: 'പീഡിയാട്രിക്സ്',
      [Department.SURGERY]: 'ശസ്ത്രക്രിയ വിഭാഗം',
      [Department.ICU]: 'ഐ.സി.യു (ICU)',
      'Triage': 'ട്രയേജ് ഏരിയ'
    }
  },
  kn: {
    portalTitle: 'ರೋಗಿಯ ಪೋರ್ಟಲ್',
    portalSubtitle: 'ರೋಗಿಗಳು ಮತ್ತು ಕುಟುಂಬಗಳಿಗೆ ನೇರ ವೈದ್ಯಕೀಯ ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕಿಂಗ್.',
    selectLanguage: 'ಭಾಷೆ',
    viewStatus: 'ಸ್ಥಿತಿ ನೋಡಿ →',
    noPatients: 'ಸಿಸ್ಟಮ್‌ನಲ್ಲಿ ಯಾವುದೇ ಸಕ್ರಿಯ ರೋಗಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ.',
    backToList: '← ರೋಗಿಗಳ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ',
    currentStatus: 'ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ',
    patientId: 'ರೋಗಿಯ ಐಡಿ',
    queuePosition: 'ಕ್ಯೂ ಸ್ಥಾನ',
    ofPatients: 'ರೋಗಿಗಳಲ್ಲಿ',
    estWaitTime: 'ಅಂದಾಜು ಕಾಯುವ ಸಮಯ',
    mins: 'ನಿಮಿಷ',
    na: 'ಮಾಹಿತಿ ಇಲ್ಲ',
    msgNow: 'ಸಂದೇಶಗಳು • ಈಗ',
    subjectToPriority: 'ವೈದ್ಯಕೀಯ ಆದ್ಯತೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ',
    assignedWard: 'ನಿಗದಿಪಡಿಸಿದ ವಾರ್ಡ್',
    followSigns: 'ಕಟ್ಟಡದ ಚಿಹ್ನೆಗಳನ್ನು ಅನುಸರಿಸಿ',
    disclaimer: 'ಕಾಯುವ ಸಮಯಗಳು ಕೇವಲ ಅಂದಾಜು ಮತ್ತು ತುರ್ತು ಪ್ರಕರಣಗಳ ಆಧಾರದ ಮೇಲೆ ಬದಲಾಗಬಹುದು. ಲಕ್ಷಣಗಳು ಉಲ್ಬಣಗೊಂಡರೆ ತಕ್ಷಣ ಸಿಬ್ಬಂದಿಗೆ ತಿಳಿಸಿ.',
    getSms: 'SMS ಅಧಿಸೂಚನೆ ಅಪ್‌ಡೇಟ್ ಪಡೆಯಿರಿ',
    sendingSms: 'ಮಾಹಿತಿ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...',
    smsTemplate: (name, id, pos, wait, ward, risk, status) => `ORCHESTRA HEALTH [REF: ${id}] | ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
ನಮಸ್ಕಾರ ${name}. ಸ್ಥಿತಿ: ${status} (${ward}).
ಆದ್ಯತೆ: ${risk}. ಸ್ಥಾನ: #${pos} | ಸಮಯ: ${wait} ನಿಮಿಷಗಳು.
ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್: https://orch.ai/track/${id}
⚠️ ಎಚ್ಚರಿಕೆ: ಉಸಿರಾಟದ ತೊಂದರೆ ಕಂಡುಬಂದಲ್ಲಿ ತಕ್ಷಣ ಸಿಬ್ಬಂದಿಗೆ ತಿಳಿಸಿ.`,
    statusMap: {
      [PatientStatus.PRE_HOSPITAL]: 'ಪ್ರೀ-ಹಾಸ್ಪಿಟಲ್ ಟ್ರಯೇಜ್',
      [PatientStatus.AMBULANCE]: 'ಆಂಬ್ಯುಲೆನ್ಸ್‌ನಲ್ಲಿ',
      [PatientStatus.TRIAGE]: 'ಟ್ರಯೇಜ್‌ನಲ್ಲಿ',
      [PatientStatus.QUEUED]: 'ಕ್ಯೂನಲ್ಲಿದ್ದಾರೆ',
      [PatientStatus.DIAGNOSIS]: 'ತಪಾಸಣೆಯಲ್ಲಿದ್ದಾರೆ',
      [PatientStatus.ADMITTED]: 'ದಾಖಲಾಗಿದ್ದಾರೆ',
      [PatientStatus.SURGERY]: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯಲ್ಲಿದ್ದಾರೆ',
      [PatientStatus.DISCHARGED]: 'ಬಿಡುಗಡೆಯಾಗಿದ್ದಾರೆ'
    },
    deptMap: {
      [Department.EMERGENCY]: 'ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗ',
      [Department.CARDIOLOGY]: 'ಹೃದಯರೋಗ ವಿಭಾಗ',
      [Department.NEUROLOGY]: 'ನರರೋಗ ವಿಭಾಗ',
      [Department.GENERAL_MEDICINE]: 'ಸಾಮಾನ್ಯ ವೈದ್ಯಕೀಯ',
      [Department.ORTHOPEDICS]: 'ಮೂಳೆರೋಗ ವಿಭಾಗ',
      [Department.PEDIATRICS]: 'ಮಕ್ಕಳ ವೈದ್ಯಕೀಯ',
      [Department.SURGERY]: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ',
      [Department.ICU]: 'ಐ.ಸಿ.ಯು (ICU)',
      'Triage': 'ಟ್ರಯೇಜ್ ಏರಿಯಾ'
    }
  }
};

interface PatientPortalProps {
  patients: Patient[];
}

const PatientPortal: React.FC<PatientPortalProps> = ({ patients }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSMS, setShowSMS] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [lang, setLang] = useState<Language>('en');
  
  const smsTimeoutRef = useRef<number | null>(null);

  const activePatients = patients.filter(p => p.status !== PatientStatus.DISCHARGED);
  const selectedPatient = activePatients.find(p => p.id === selectedId);

  useEffect(() => {
    if (selectedPatient?.preferredLanguage) {
      setLang(selectedPatient.preferredLanguage as Language);
    }
  }, [selectedId, selectedPatient?.preferredLanguage]);

  const t = translations[lang];

  const queuedPatients = activePatients
    .filter(p => p.status === PatientStatus.QUEUED || p.status === PatientStatus.DIAGNOSIS)
    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

  const queueIndex = selectedId ? queuedPatients.findIndex(p => p.id === selectedId) : -1;
  const queuePosition = queueIndex !== -1 ? queueIndex + 1 : null;
  const estWaitTimeValue = queuePosition ? (queuePosition - 1) * 8 + 5 : null;

  const simulateSMS = async () => {
    if (!selectedPatient || isSendingSms) return;

    setIsSendingSms(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Enhanced handshake simulation

    const name = selectedPatient.name.split(' ')[0];
    const patientId = selectedPatient.id;
    const wardRaw = selectedPatient.department || 'Triage';
    const wardTranslated = t.deptMap[wardRaw] || wardRaw;
    const riskLevel = selectedPatient.riskLevel || 'Standard';
    const statusTranslated = t.statusMap[selectedPatient.status];
    
    const pos = queuePosition || 'Active Management';
    const wait = estWaitTimeValue || '---';

    setSmsMessage(t.smsTemplate(name, patientId, pos, wait, wardTranslated, riskLevel, statusTranslated));
    setShowSMS(true);
    setIsSendingSms(false);

    if (smsTimeoutRef.current) window.clearTimeout(smsTimeoutRef.current);
    smsTimeoutRef.current = window.setTimeout(() => {
      setShowSMS(false);
    }, 12000); // Extended visibility for high-detail message
  };

  const getTranslatedWard = (dept?: Department) => {
    if (!dept) return t.deptMap['Triage'];
    return t.deptMap[dept] || dept;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn relative pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{t.portalTitle}</h2>
          <p className="text-sm text-slate-500 font-medium">{t.portalSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t.selectLanguage}</span>
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी' },
              { id: 'ta', label: 'தமிழ்' },
              { id: 'te', label: 'తెలుగు' },
              { id: 'ml', label: 'മലയാളം' },
              { id: 'kn', label: 'ಕನ್ನಡ' }
            ].map(l => (
              <button
                key={l.id}
                onClick={() => setLang(l.id as Language)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-tighter transition-all rounded-xl ${lang === l.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePatients.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 text-left hover:border-blue-500 hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-slate-800 group-hover:text-blue-600 text-lg transition-colors">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.id}</p>
                    {p.preferredLanguage && (
                      <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-black uppercase">{p.preferredLanguage}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all uppercase tracking-widest">{t.viewStatus}</span>
              </div>
            </button>
          ))}
          {activePatients.length === 0 && (
            <div className="col-span-2 py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400 italic">
              {t.noPatients}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          <button 
            onClick={() => setSelectedId(null)}
            className="text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-2 uppercase tracking-widest transition-colors mb-4 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> {t.backToList}
          </button>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
            <div className="medical-gradient p-12 text-white relative">
              <div className="absolute top-0 right-0 p-12 opacity-10 text-9xl">🩺</div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                  <h3 className="text-5xl font-black tracking-tight mb-4">{selectedPatient?.name}</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]"></div>
                    <p className="text-blue-100 uppercase text-xs font-black tracking-[0.2em]">
                      {t.currentStatus}: {selectedPatient ? t.statusMap[selectedPatient.status] : ''}
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-2xl px-10 py-6 rounded-[2rem] border border-white/20 text-right">
                  <p className="text-[10px] font-black uppercase text-blue-200 tracking-[0.3em] mb-2">{t.patientId}</p>
                  <p className="text-2xl font-mono font-bold">{selectedPatient?.id}</p>
                </div>
              </div>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-blue-50/50 rounded-[2rem] p-10 text-center border border-blue-100/50 flex flex-col items-center justify-center space-y-3 hover:bg-blue-50 transition-colors group">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t.queuePosition}</span>
                <span className="text-7xl font-black text-blue-700 group-hover:scale-110 transition-transform">{queuePosition || '--'}</span>
                <span className="text-xs font-bold text-blue-400 opacity-60">{t.ofPatients} {queuedPatients.length}</span>
              </div>

              <div className="bg-slate-50/50 rounded-[2rem] p-10 text-center border border-slate-200/50 flex flex-col items-center justify-center space-y-3 hover:bg-slate-50 transition-colors group">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.estWaitTime}</span>
                <span className="text-7xl font-black text-slate-800">
                  {estWaitTimeValue ? `${estWaitTimeValue}${t.mins.charAt(0)}` : t.na}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-60">{t.subjectToPriority}</span>
              </div>

              <div className="bg-emerald-50/50 rounded-[2rem] p-10 text-center border border-emerald-100/50 flex flex-col items-center justify-center space-y-3 hover:bg-emerald-50 transition-colors group">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.assignedWard}</span>
                <span className="text-3xl font-black text-emerald-800 break-words leading-tight uppercase tracking-tight">{getTranslatedWard(selectedPatient?.department)}</span>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest opacity-60">{t.followSigns}</span>
              </div>
            </div>

            <div className="px-12 pb-12 flex flex-col gap-8">
              <div className="p-8 bg-amber-50/50 rounded-[2rem] border border-amber-100 flex items-start gap-6">
                <div className="w-14 h-14 bg-amber-100 rounded-[1.2rem] flex items-center justify-center text-3xl shrink-0">⚠️</div>
                <p className="text-xs text-amber-900 leading-relaxed font-bold opacity-70">
                  {t.disclaimer}
                </p>
              </div>

              <button 
                onClick={simulateSMS}
                disabled={isSendingSms}
                className="w-full bg-slate-900 text-white py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-200 disabled:opacity-50"
              >
                {isSendingSms ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                     <span>{t.sendingSms}</span>
                   </>
                ) : (
                  <>
                    <span className="text-2xl">📱</span>
                    <span>{t.getSms}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSMS && (
        <div className="fixed bottom-12 right-12 z-[200] w-[32rem] animate-slideInRight">
          <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] border border-white/10 flex flex-col gap-6 relative overflow-hidden backdrop-blur-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-[shimmer_2s_infinite]"></div>
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">{t.msgNow}</span>
              </div>
              <button onClick={() => setShowSMS(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">✕</button>
            </div>
            <div className="flex gap-6">
               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl shrink-0 shadow-xl border border-white/10">🏥</div>
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Orchestra Medical • Verified</p>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">Just Now</span>
                  </div>
                  <p className="text-[14px] font-bold leading-relaxed tracking-tight text-slate-100 whitespace-pre-wrap">
                    {smsMessage}
                  </p>
               </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex justify-between items-center">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digital Healthcare Gateway</p>
               <span className="text-[8px] font-bold text-blue-500 uppercase">HIPAA Encrypted</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;
