import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtext?: string;
  accentColor?: string;
  iconBgColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  accentColor = 'text-[#5AA9FF]',
  iconBgColor = 'bg-[#5AA9FF]/10',
}) => {
  return (
    <div className="bg-[#14213B] border border-[#243A63] rounded-2xl p-6 transition-all hover:border-[#5AA9FF]/40 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9FB0C8] mb-1">
            {label}
          </p>
          <p className={`text-3xl font-extrabold font-heading ${accentColor}`}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-[#9FB0C8] mt-1.5 flex items-center gap-1">
              {subtext}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center border border-[#243A63]`}>
          <Icon className={`w-6 h-6 ${accentColor}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
