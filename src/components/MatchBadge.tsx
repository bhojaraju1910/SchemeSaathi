import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, HelpCircle } from 'lucide-react';

interface MatchBadgeProps {
  match: 'High' | 'Medium';
  className?: string;
}

export const MatchBadge: React.FC<MatchBadgeProps> = ({ match, className = '' }) => {
  const { t } = useTranslation();

  if (match === 'High') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${className}`}
        title="High alignment: all primary criteria match your recorded profile"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>{t('recommendations.matchHigh')}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 ${className}`}
      title="Medium alignment: some criteria require manual confirmation"
    >
      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
      <span>{t('recommendations.matchMedium')}</span>
    </span>
  );
};

export default MatchBadge;
