import React from 'react';
import { useTranslation } from 'react-i18next';

interface SampleBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export const SampleBadge: React.FC<SampleBadgeProps> = ({ className = '', showIcon: _showIcon = true }) => {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[var(--saffron-tint)] text-[var(--saffron-tint-text)] border border-[var(--saffron-border)] ${className}`}
      title="This is verified synthetic demonstration data for academic and evaluation purposes."
    >
      {t('sampleBadge')}
    </span>
  );
};

export default SampleBadge;
