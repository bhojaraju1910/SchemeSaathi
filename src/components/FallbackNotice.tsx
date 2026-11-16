import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircleIcon } from './Icons';

interface FallbackNoticeProps {
  onRetry?: () => void;
  className?: string;
}

export const FallbackNotice: React.FC<FallbackNoticeProps> = ({
  onRetry,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      data-testid="fallback-notice"
      className={`rounded-[12px] border border-[#E5C17B] bg-[#FFF4DF] text-[#6B3A00] px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2.5 font-semibold">
        <AlertCircleIcon size={17} className="shrink-0 text-[#8F4F00]" />
        <span>
          {t(
            'fallback.savedCopyBanner',
            'Showing a saved copy. Some details may be outdated.'
          )}
        </span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[34px] px-3.5 py-1 rounded-full border border-[#C6933A] bg-[var(--paper)] text-xs font-bold text-[#5C3200] hover:bg-[#FCE8C2] transition-colors cursor-pointer"
        >
          {t('fallback.retryLive', 'Retry live data')}
        </button>
      )}
    </div>
  );
};

export default FallbackNotice;
