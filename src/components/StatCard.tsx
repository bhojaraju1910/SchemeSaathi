import React from 'react';
import { LucideIcon } from 'lucide-react';
import CategoryIcon, { getCategoryPalette } from './CategoryIcon';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtext?: string;
  accentColor?: string;
  iconBgColor?: string;
}

function mapMetricKind(label: string): 'schemes' | 'matches' | 'saved' | 'links' {
  const lower = label.toLowerCase();
  if (lower.includes('match')) return 'matches';
  if (lower.includes('saved') || lower.includes('bookmark')) return 'saved';
  if (lower.includes('click') || lower.includes('portal') || lower.includes('application')) return 'links';
  return 'schemes';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
}) => {
  const kind = mapMetricKind(label);
  const palette = getCategoryPalette(kind);

  return (
    <div
      className="p-5 rounded-[6px] border border-[var(--border)] flex items-start justify-between gap-4"
      style={{ backgroundColor: palette.bg }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          {label}
        </p>
        <p className="text-[28px] sm:text-[32px] leading-tight font-bold text-[var(--text-primary)] tabular-nums">
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {subtext}
          </p>
        )}
      </div>

      <span
        className="w-11 h-11 rounded-[6px] border border-[var(--border)] inline-flex items-center justify-center shrink-0"
        style={{ backgroundColor: 'var(--surface)', color: palette.fg }}
      >
        <CategoryIcon kind={kind} size={22} />
      </span>
    </div>
  );
};

export default StatCard;
