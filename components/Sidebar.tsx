
import React from 'react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: any) => void;
  role: UserRole;
  onAction: (action: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, role, onAction }) => {
  const navSections = [
    {
      title: 'Operations',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: '🏠' },
        { id: 'pre-hospital', label: 'Pre-Hospital Triage', icon: '🚑' },
        { id: 'intake', label: 'Patient Intake', icon: '📝', restricted: [UserRole.DOCTOR, UserRole.NURSE] },
        { id: 'emergency', label: 'Emergency Ops', icon: '🚨' },
        { id: 'queue', label: 'Clinical Queue', icon: '⌛' },
      ]
    },
    {
      title: 'Clinical Intelligence',
      items: [
        { id: 'care-journey', label: 'Care Journey', icon: '🛤️' },
        { id: 'documentation', label: 'AI Summaries', icon: '🖋️', restricted: [UserRole.DOCTOR, UserRole.NURSE] },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'beds', label: 'Bed Management', icon: '🛏️' },
        { id: 'ot', label: 'Surgery Suite', icon: '🔬', restricted: [UserRole.DOCTOR, UserRole.ADMIN, UserRole.OPS_MANAGER] },
        { id: 'resources', label: 'Resource Availability', icon: '📦' },
        { id: 'staffing', label: 'Staffing AI', icon: '👥', restricted: [UserRole.ADMIN, UserRole.OPS_MANAGER] },
        { id: 'finance', label: 'Finance & Ops', icon: '💰', restricted: [UserRole.ADMIN, UserRole.OPS_MANAGER] },
      ]
    },
    {
      title: 'Platform',
      items: [
        { id: 'patient', label: 'Patient Portal', icon: '📱' },
        { id: 'mentor', label: 'AI Platform Mentor', icon: '🧠' },
        { id: 'governance', label: 'Governance', icon: '⚖️', restricted: [UserRole.ADMIN] },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-6 flex-1">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-900/50">
            H
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">ORCHESTRA</h1>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Clinical AI Platform</p>
          </div>
        </div>

        <nav className="space-y-6">
          {navSections.map(section => {
            // Filter section items based on user role
            const visibleItems = section.items.filter(item => 
              !item.restricted || item.restricted.includes(role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <h3 className="px-4 text-[10px] font-black uppercase text-slate-600 tracking-widest mb-2">{section.title}</h3>
                {visibleItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`
                      w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all font-medium text-sm relative
                      ${currentView === item.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                        : 'hover:bg-slate-800 hover:text-slate-200'}
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                    {(item.id === 'staffing' || item.id === 'emergency') && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse border border-slate-900 ${item.id === 'emergency' ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 shrink-0 border-t border-slate-800">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">
          v3.1 Secure Node
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
