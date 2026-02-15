
import React from 'react';
import { Bed, Department } from '../types';

interface BedManagementProps {
  beds: Bed[];
  onAllocate?: (bedId: string) => void;
}

const BedManagement: React.FC<BedManagementProps> = ({ beds, onAllocate }) => {
  const wards = Array.from(new Set(beds.map(b => b.ward)));

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Ward & Bed Orchestration</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="w-3 h-3 bg-emerald-500 rounded"></span> Available
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="w-3 h-3 bg-slate-300 rounded"></span> Occupied
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="w-3 h-3 bg-blue-500 rounded"></span> Reserved
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {wards.map(ward => {
          const wardBeds = beds.filter(b => b.ward === ward);
          const occupied = wardBeds.filter(b => b.isOccupied).length;
          
          return (
            <div key={ward} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {ward === Department.ICU ? '🏥' : ward === Department.CARDIOLOGY ? '🫀' : '📋'}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800">{ward}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Level 4 • Central Building</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-700">{wardBeds.length - occupied} Available</div>
                  <div className="text-[10px] font-bold text-slate-400">Total {wardBeds.length} Beds</div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-5 gap-3">
                {wardBeds.map(bed => (
                  <div 
                    key={bed.id}
                    title={bed.isOccupied ? `Occupied (Patient ${bed.patientId})` : 'Available'}
                    className={`
                      relative h-12 rounded-lg border-2 flex items-center justify-center font-bold text-sm cursor-pointer transition-all
                      ${bed.isOccupied 
                        ? 'bg-slate-50 border-slate-200 text-slate-400' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:scale-105 shadow-sm hover:shadow-emerald-100'}
                    `}
                    onClick={() => !bed.isOccupied && onAllocate?.(bed.id)}
                  >
                    {bed.number}
                    {bed.type === 'ICU' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BedManagement;
