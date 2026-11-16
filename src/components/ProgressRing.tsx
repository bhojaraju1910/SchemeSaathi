import React from 'react';

interface ProgressRingProps {
  passed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  darkSurface?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  passed,
  total,
  size = 56,
  strokeWidth = 5,
  label,
  darkSurface = false,
}) => {
  const safeTotal = Math.max(1, total);
  const ratio = Math.min(1, Math.max(0, passed / safeTotal));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  return (
    <div
      className="inline-flex items-center gap-3 shrink-0"
      aria-label={`${passed} of ${safeTotal} checks passed`}
    >
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={darkSurface ? 'var(--line-dark)' : 'var(--line)'}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span
          className={`absolute text-xs font-bold tabular-nums ${
            darkSurface ? 'text-[var(--cream)]' : 'text-[var(--navy)]'
          }`}
        >
          {passed}/{safeTotal}
        </span>
      </div>
      {label && (
        <span
          className={`text-xs font-semibold leading-tight ${
            darkSurface ? 'text-[var(--muted-dark)]' : 'text-[var(--muted)]'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default ProgressRing;
