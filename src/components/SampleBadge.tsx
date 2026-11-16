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
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[var(--badge-high-bg)] text-[var(--badge-high-text)] border border-[var(--line)] whitespace-nowrap ${className}`}
      title="This is verified synthetic demonstration data for academic and evaluation purposes."
    >
      {t('sampleBadge')}
    </span>
  );
};

export default SampleBadge;
