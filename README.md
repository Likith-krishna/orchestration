# AI Clinical Triage & Hospital Orchestration Platform

An advanced, AI-powered healthcare orchestration system designed to optimize patient flow, resource allocation, and clinical decision-making in real-time. This platform integrates predictive analytics, real-time monitoring, and intelligent automation to streamline hospital operations.



## 🚀 Key Features

### 🧠 AI Platform Mentor
- **Real-time Assistance**: Intelligent chatbot for clinical guidance, system architecture, and operational support.
- **Smart Fallback**: Robust offline capabilities with pre-programmed answers for critical queries (OPI, Bed Allocation, Contagion Protocols).
- **Context-Aware**: Adapts responses based on the active mode (Guide, Idea Lab, Dev Support).

### 🏥 Clinical Triage & Emergency Response
- **Orchestra Priority Index (OPI)**: Proprietary algorithm calculating patient priority based on clinical risk (60%), wait time (20%), and deterioration probability (20%).
- **Virtual Triage Assistant**: AI-powered chat interface for initial symptom assessment and risk stratification.
- **Real-time Queues**: Live tracking of ER wait times, patient status, and resource availability.

### 🛏️ Intelligent Resource Management
- **Smart Bed Allocation**: Automated suggestions for patient placement considering acuity, contagion risk, and specialty requirements.
- **Surgical Orchestration**: AI-optimized OT scheduling, predicting duration and turnover times.
- **Supply Chain integration**: Real-time tracking of critical resources (Oxygen, Blood Bank, ICU capacity).

### 📊 Operational Intelligence
- **Live Governance Dashboard**: Central command center for hospital-wide monitoring.
- **Compliance Automation**: AI-generated HIPAA compliance audit summaries.
- **Financial Analytics**: Real-time revenue cycle monitoring and prediction.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (Custom Design System)
- **AI Integration**: Google Gemini API (Models: `gemini-2.5-flash`)
- **State Management**: React Hooks + Context API
- **Data Visualization**: Recharts
- **Icons**: Lucide React

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Likith-krishna/orchestration.git
   cd orchestration
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to `http://localhost:3000` to access the platform.

## 🧪 Testing

The platform includes comprehensive test scripts for the AI integration:
```bash
npx tsx test-gemini.ts  # Test Gemini API connectivity
```

## 🔒 Security & Compliance

- **HIPAA Compliant Architecture**: Designed with privacy-first principles.
- **Role-Based Access Control**: Granular permissions for different hospital staff.
- **Audit Logging**: Comprehensive tracking of all system actions.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
