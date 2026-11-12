import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

interface SampleBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export const SampleBadge: React.FC<SampleBadgeProps> = ({ className = '', showIcon = true }) => {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/30 ${className}`}
      title="This is verified synthetic demonstration data for academic and evaluation purposes."
    >
      {showIcon && <Sparkles className="w-3 h-3 text-amber-400" />}
      <span>{t('sampleBadge')}</span>
    </span>
  );
};

export default SampleBadge;
