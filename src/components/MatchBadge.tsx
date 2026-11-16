import React from 'react';
import { useTranslation } from 'react-i18next';

interface MatchBadgeProps {
  match: 'High' | 'Medium';
  className?: string;
}

export const MatchBadge: React.FC<MatchBadgeProps> = ({ match, className = '' }) => {
  const { t } = useTranslation();

  if (match === 'High') {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--badge-high-bg)] text-[var(--badge-high-text)] border border-[var(--line)] whitespace-nowrap ${className}`}
        title="High match: recorded profile details align with primary scheme rules"
      >
        {t('recommendations.matchHigh')}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--badge-medium-bg)] text-[var(--badge-medium-text)] border border-[var(--line)] whitespace-nowrap ${className}`}
      title="Medium match: some criteria require manual confirmation"
    >
      {t('recommendations.matchMedium')}
    </span>
  );
};

export default MatchBadge;
