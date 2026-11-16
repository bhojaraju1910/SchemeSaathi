import React from 'react';
import { useTranslation } from 'react-i18next';

interface AccentWordProps {
  children: React.ReactNode;
  className?: string;
}

export const AccentWord: React.FC<AccentWordProps> = ({ children, className = '' }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isNonLatin = lang === 'kn' || lang === 'hi';

  if (isNonLatin) {
    return (
      <span className={`accent-highlight-script inline-block ${className}`}>
        {children}
      </span>
    );
  }

  return (
    <span className={`relative inline-block font-serif-accent text-[1.08em] px-0.5 ${className}`}>
      <span className="relative z-10">{children}</span>
      <svg
        viewBox="0 0 120 14"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 -bottom-1 w-full h-[10px]"
      >
        <path
          d="M2 10.5C32 4.2 84 3.4 118 8.8"
          stroke="var(--accent)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};

export default AccentWord;
