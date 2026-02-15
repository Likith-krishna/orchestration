
import React, { useState, useEffect, useRef } from 'react';
import { analyzeVoiceTriage, VoiceTriageAnalysis } from '../services/geminiService';

interface VoiceSymptomInputProps {
  onResult: (analysis: VoiceTriageAnalysis, rawTranscript: string) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
}

const VoiceSymptomInput: React.FC<VoiceSymptomInputProps> = ({ onResult, onRecordingStateChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isRecognitionActive = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        isRecognitionActive.current = true;
      };

      recognition.onend = () => {
        isRecognitionActive.current = false;
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') setMicError("Microphone access was denied.");
      };

      recognitionRef.current = recognition;
    }

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isRecording) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current?.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#f8fafc'; // Matches bg-slate-50
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      setIsRecording(true);
      onRecordingStateChange(true);
      setTranscript('');
      setDuration(0);
      
      if (recognitionRef.current && !isRecognitionActive.current) {
        recognitionRef.current.start();
      }
      
      drawWaveform();

      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access denied", err);
      setMicError("Permissions Required: Please enable your microphone to use voice triage.");
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    onRecordingStateChange(false);
    setIsProcessing(true);
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (audioContextRef.current) await audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    // Call AI to analyze behavioral state and extract symptoms
    const analysis = await analyzeVoiceTriage(transcript || "No speech detected", {
      rate: duration < 5 && transcript.split(' ').length > 15 ? 'Rapid' : 'Normal',
      tremor: transcript.includes('...') || (transcript.length > 40 && duration > 20),
      hesitations: (transcript.match(/\.\.\./g) || []).length
    });

    onResult(analysis, transcript);
    setIsProcessing(false);
  };

  return (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center gap-6 relative overflow-hidden group min-h-[220px]">
      {!isRecording && !isProcessing && (
        <div className="text-center animate-fadeIn w-full">
          {micError ? (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 mb-4 animate-fadeIn">
              <p className="text-[10px] font-black uppercase tracking-widest">{micError}</p>
              <button onClick={startRecording} className="mt-2 text-[8px] font-black underline uppercase">Try Again</button>
            </div>
          ) : (
            <div className="w-20 h-20 bg-white shadow-2xl rounded-full flex items-center justify-center text-3xl mb-4 mx-auto group-hover:scale-110 transition-transform cursor-pointer border border-slate-100" onClick={startRecording}>
              🎙️
            </div>
          )}
          <h4 className="text-slate-800 font-black uppercase text-xs tracking-widest mb-2">Voice Symptom Triage</h4>
          <p className="text-slate-500 text-[10px] font-bold uppercase max-w-[240px] mx-auto leading-relaxed">
            Press the mic to describe symptoms. <br/>
            <span className="text-blue-500 opacity-60">Speech rate and patterns are analyzed for behavioral triage indicators.</span>
          </p>
        </div>
      )}

      {isRecording && (
        <div className="w-full flex flex-col items-center gap-6 animate-fadeIn">
           <canvas ref={canvasRef} width={400} height={80} className="w-full h-20 rounded-xl" />
           <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-rose-600 rounded-full animate-pulse shadow-[0_0_12px_rgba(225,29,72,0.6)]"></div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Recording Clinical Feed: {duration}s</span>
           </div>
           <p className="text-sm font-medium text-slate-600 italic px-6 text-center line-clamp-2 min-h-[3rem] max-w-md">
              {transcript || 'Listening for symptoms and vocal characteristics...'}
           </p>
           <button 
            onClick={stopRecording}
            className="bg-slate-900 text-white px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-600 transition-all active:scale-95"
           >
              Finalize Transcription
           </button>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center gap-6 animate-pulse p-10">
           <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
           <div className="text-center">
              <h4 className="text-blue-600 font-black uppercase text-xs tracking-widest">AI Behavioral Ingest</h4>
              <p className="text-slate-400 text-[9px] font-black uppercase mt-2">Extracting Stress & Panic Markers...</p>
           </div>
        </div>
      )}

      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none px-8">
        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
          Behavioral indicators are estimations based on speech patterns, not clinical diagnoses.
        </p>
      </div>

      <div className="absolute top-4 right-6 flex items-center gap-2">
         <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
         <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{isRecording ? 'Live Stream' : 'Voice Guard'}</span>
      </div>
    </div>
  );
};

export default VoiceSymptomInput;
