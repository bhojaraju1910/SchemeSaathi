import React from 'react';
import CategoryIcon from './CategoryIcon';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: unknown;
  subtext?: string;
  accentColor?: string;
  iconBgColor?: string;
}

function mapMetricKind(label: string): 'schemes' | 'matches' | 'saved' | 'links' {
  const lower = label.toLowerCase();
  if (lower.includes('match')) return 'matches';
  if (lower.includes('saved') || lower.includes('bookmark')) return 'saved';
  if (lower.includes('click') || lower.includes('portal') || lower.includes('application')) return 'links';
  if (lower.includes('document') || lower.includes('ready')) return 'schemes';
  return 'schemes';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext }) => {
  const kind = mapMetricKind(label);

  return (
    <div className="editorial-card editorial-card-lift p-5 sm:p-6 flex items-start justify-between gap-4 hover:border-[var(--navy)] transition-colors">
      <div className="min-w-0">
        <p className="eyebrow text-[var(--muted)] mb-2">{label}</p>
        <p className="font-display text-4xl sm:text-5xl leading-none font-bold text-[var(--navy)] tabular-nums">
          {value}
        </p>
        {subtext && <p className="text-xs text-[var(--muted)] mt-2.5">{subtext}</p>}
      </div>

      <CategoryIcon kind={kind} size={22} withChip />
    </div>
  );
};

export default StatCard;
