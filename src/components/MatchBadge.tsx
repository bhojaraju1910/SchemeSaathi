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
        className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-[var(--saffron-tint)] text-[var(--saffron-tint-text)] border border-[var(--saffron-border)] whitespace-nowrap ${className}`}
        title="High alignment: all primary criteria match your recorded profile"
      >
        {t('recommendations.matchHigh')}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-[var(--medium-bg)] text-[var(--medium-text)] border border-[var(--medium-border)] whitespace-nowrap ${className}`}
      title="Medium alignment: some criteria require manual confirmation"
    >
      {t('recommendations.matchMedium')}
    </span>
  );
};

export default MatchBadge;
