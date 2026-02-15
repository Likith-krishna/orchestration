
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { getPlatformMentorResponse } from '../services/geminiService';

type ChatMode = 'guide' | 'idea' | 'dev';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const MentorModule: React.FC = () => {
  const [mode, setMode] = useState<ChatMode>('guide');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history from global chatbot storage
  useEffect(() => {
    const saved = localStorage.getItem('orchestra_chat_history');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        { 
          role: 'ai', 
          content: '# Orchestra Health Platform Mentor\nI am your dedicated product consultant and architecture advocate. \n\n**Select a mode above to begin:**\n- **Guide Mode:** Walkthrough features and workflows.\n- **Idea Lab:** Innovate on UI/UX and reporting.\n- **Dev Support:** Database schemas and API design.',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  // Save history to global chatbot storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('orchestra_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { 
      role: 'user', 
      content: input, 
      timestamp: new Date().toISOString() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getPlatformMentorResponse(
        messages.map(m => ({ role: m.role, content: m.content })),
        input,
        mode
      );
      
      const aiMsg: Message = { 
        role: 'ai', 
        content: response || 'I encountered a processing gap. Please try again.', 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'System error: AI Core handshake failed. Redirecting to documentation logs.', 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = () => {
    const initial = [{ 
      role: 'ai', 
      content: 'History cleared. Ready for a fresh consultation.',
      timestamp: new Date().toISOString()
    }] as Message[];
    setMessages(initial);
    localStorage.removeItem('orchestra_chat_history');
  };

  const getModeLabel = (m: ChatMode) => {
    switch(m) {
      case 'guide': return { label: 'Platform Guide', icon: '📖', desc: 'Explaining features & workflows' };
      case 'idea': return { label: 'Idea Lab', icon: '💡', desc: 'UI/UX & Feature Innovation' };
      case 'dev': return { label: 'Dev Support', icon: '🛠️', desc: 'API & Database Architecture' };
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">AI Platform Mentor</h2>
          <p className="text-sm text-slate-500">Professional orchestration consultant and technical advocate</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {(['guide', 'idea', 'dev'] as ChatMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                mode === m ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {getModeLabel(m).icon} {getModeLabel(m).label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-8">
        {/* Chat Main Area */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col relative">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">🧠</div>
               <div>
                 <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{getModeLabel(mode).label}</h3>
                 <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{getModeLabel(mode).desc}</p>
               </div>
             </div>
             <button 
               onClick={clearHistory}
               className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
             >
               Reset Session
             </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-slate-50/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-8 py-6 rounded-[2.5rem] text-sm leading-relaxed shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                    : 'bg-white text-slate-700 border-slate-100 rounded-tl-none prose prose-slate prose-sm'
                }`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  <p className={`text-[9px] mt-4 opacity-40 font-mono tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    VERIFIED RESPONSE • {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 px-8 py-6 rounded-[2.5rem] rounded-tl-none shadow-sm flex gap-2 items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Orchestrating...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 bg-white border-t flex gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
            <input 
              type="text" 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium transition-all" 
              placeholder={
                mode === 'dev' ? 'Ask about inter-facility transfer APIs or DB scaling...' :
                mode === 'idea' ? 'How can we improve the command center dashboard?' :
                'Explain how OPI prioritization works...'
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !input.trim()}
              className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 disabled:opacity-30 transition-all active:scale-95 flex items-center gap-3"
            >
              Consult 🚀
            </button>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="w-80 shrink-0 space-y-6 flex flex-col">
           <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl flex flex-col gap-6">
              <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Mentor Intelligence</h3>
              <div className="space-y-6">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Core Persona</p>
                    <p className="text-sm font-medium leading-relaxed italic text-slate-300">
                      "I analyze hospital workflows through the lens of efficiency, safety, and enterprise scalability."
                    </p>
                 </div>
                 <div className="pt-6 border-t border-white/5 space-y-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Knowledge Base</p>
                    <ul className="space-y-3">
                       {['OPI Algorithm', 'BIOSurveillance Clustering', 'Revenue Integrity Logs', 'Ambulance GPS Relay'].map(k => (
                         <li key={k} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {k}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 flex flex-col gap-4">
              <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Guide Prompt Ideas</h3>
              <div className="space-y-3">
                 {[
                   'Explain the bed allocation logic',
                   'How does the contagion score work?',
                   'Suggest a new feature for the ER',
                   'API for external hospital data'
                 ].map(prompt => (
                   <button 
                     key={prompt}
                     onClick={() => setInput(prompt)}
                     className="w-full text-left p-3 bg-white border border-indigo-200 rounded-xl text-[10px] font-bold text-indigo-600 hover:border-indigo-400 transition-all uppercase tracking-tight"
                   >
                     {prompt} →
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MentorModule;
