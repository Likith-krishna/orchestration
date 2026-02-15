
import React, { useState } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const standardUser = MOCK_USERS[0];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    // Simulate enterprise SSO/LDAP Handshake
    setTimeout(() => {
      onLogin(standardUser);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
      </div>

      <div className="relative w-full max-w-lg p-8 animate-fadeIn">
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 shadow-2xl overflow-hidden relative group">
          {/* Scanning Line Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 animate-[scan_4s_linear_infinite]"></div>

          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/40 mb-6 group-hover:scale-110 transition-transform duration-500">
              H
            </div>
            <h1 className="text-white text-3xl font-black tracking-tight uppercase leading-none">Orchestra Health</h1>
            <p className="text-blue-400 text-xs font-black tracking-[0.3em] uppercase mt-2">Clinical Intelligence Platform</p>
          </div>

          <div className="mb-10 p-6 bg-white/5 border border-white/5 rounded-3xl text-center">
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Establishing secure connection to regional clinical node. <br/> Access restricted to authorized medical personnel only.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-6 bg-white text-slate-950 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                  <span>Securing Access...</span>
                </>
              ) : (
                <>
                  <span>Initialize Command Center</span>
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center border-t border-white/5 pt-8">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              HIPAA COMPLIANT GATEWAY • SECURE SESSION ENCRYPTION ACTIVE <br/>
              NODE: GCP-WEST-ORCH-31
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(-20px); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(600px); opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default LoginPage;
