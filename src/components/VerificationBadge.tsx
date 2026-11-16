import React from 'react';
import { useTranslation } from 'react-i18next';

interface VerificationBadgeProps {
  verified?: boolean;
  lastVerified?: string | Date | null;
  isSample?: boolean;
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verified = false,
  lastVerified,
  isSample = false,
  className = '',
}) => {
  const { t } = useTranslation();

  if (isSample) {
    return null;
  }

  if (verified) {
    const formatted =
      lastVerified && !Number.isNaN(new Date(lastVerified).getTime())
        ? new Date(lastVerified).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : null;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)] whitespace-nowrap ${className}`}
        title={
          formatted
            ? `${t('badges.verifiedOn', 'Verified on')} ${formatted}`
            : t('badges.verified', 'Verified')
        }
      >
        {formatted
          ? `${t('badges.verifiedOn', 'Verified on')} ${formatted}`
          : t('badges.verified', 'Verified')}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF4DF] text-[#7D4500] border border-[#E5C17B] whitespace-nowrap ${className}`}
      title="Rules and portal details should be confirmed directly on the official government website."
    >
      {t('badges.verifyOfficial', 'Verify on official site')}
    </span>
  );
};

export default VerificationBadge;
