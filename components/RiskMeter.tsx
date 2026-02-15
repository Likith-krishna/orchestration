
import React from 'react';

interface RiskMeterProps {
  value: number;
  label: string;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ value, label }) => {
  const getColor = (v: number) => {
    if (v < 30) return 'bg-emerald-500';
    if (v < 70) return 'bg-amber-500';
    return 'bg-rose-600';
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(value)} transition-all duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default RiskMeter;
