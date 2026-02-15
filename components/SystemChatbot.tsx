
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { getPlatformMentorResponse } from '../services/geminiService';

type ChatMode = 'guide' | 'idea' | 'dev';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const SystemChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('guide');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('orchestra_chat_history');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        { 
          role: 'ai', 
          content: 'Welcome to the Orchestra Health Platform. I am your Platform Mentor. How can I assist with your orchestration workflows today?',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  // Save history
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
      content: 'History cleared. I am ready to assist with a new session.',
      timestamp: new Date().toISOString()
    }] as Message[];
    setMessages(initial);
    localStorage.removeItem('orchestra_chat_history');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[420px] h-[600px] flex flex-col glass-morphism rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="medical-gradient p-6 text-white shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl backdrop-blur-md">🧠</div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Platform Mentor</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-blue-200 uppercase">Gemini 3.0 Real-time</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">✕</button>
            </div>

            {/* Mode Switcher */}
            <div className="bg-black/20 p-1 rounded-xl flex gap-1 border border-white/10 backdrop-blur-md">
              {(['guide', 'idea', 'dev'] as ChatMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all ${
                    mode === m ? 'bg-white text-blue-900 shadow-md' : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  {m === 'guide' ? 'Platform Guide' : m === 'idea' ? 'Idea Lab' : 'Dev Support'}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-4 rounded-[1.8rem] text-xs leading-relaxed shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                    : 'bg-white text-slate-700 border-slate-100 rounded-tl-none prose prose-slate prose-sm'
                }`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  <p className={`text-[8px] mt-2 opacity-40 font-mono ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 px-5 py-3 rounded-[1.5rem] rounded-tl-none shadow-sm flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium transition-all"
                placeholder={mode === 'dev' ? 'Ask about the DB schema...' : mode === 'idea' ? 'How can we improve UX?' : 'Explain the OPI ranking...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                className="bg-slate-900 text-white w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all active:scale-90 disabled:opacity-30"
              >
                🚀
              </button>
            </form>
            <div className="mt-3 flex justify-between items-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                Mode: {mode.toUpperCase()}
              </p>
              <button 
                onClick={clearHistory}
                className="text-[8px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full medical-gradient text-white flex items-center justify-center shadow-[0_20px_50px_rgba(30,64,175,0.3)] transition-all hover:scale-110 active:scale-95 group relative ${isOpen ? 'rotate-90' : ''}`}
      >
        <span className="text-3xl">{isOpen ? '✕' : '💬'}</span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-slate-50 rounded-full animate-pulse flex items-center justify-center text-[10px] font-bold">1</span>
        )}
      </button>
    </div>
  );
};

export default SystemChatbot;
