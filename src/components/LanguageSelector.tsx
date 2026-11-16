import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const languages = [
  { code: 'en', short: 'EN', full: 'English' },
  { code: 'kn', short: 'ಕ', full: 'ಕನ್ನಡ (Kannada)' },
  { code: 'hi', short: 'हि', full: 'हिन्दी (Hindi)' },
] as const;

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const { setLanguage } = useAuth();

  const currentLang = (['en', 'kn', 'hi'].includes(i18n.language) ? i18n.language : 'en') as
    | 'en'
    | 'kn'
    | 'hi';

  return (
    <div
      role="group"
      aria-label="Select Application Language"
      className={`inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--paper)] p-0.5 ${className}`}
    >
      {languages.map((lang) => {
        const active = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            aria-label={lang.full}
            aria-pressed={active}
            title={lang.full}
            className={`min-h-[36px] min-w-[36px] px-2.5 rounded-full text-xs font-bold transition-colors duration-150 cursor-pointer ${
              active
                ? 'bg-[var(--navy)] text-[var(--cream)]'
                : 'text-[var(--navy)] hover:bg-[var(--cream)]'
            }`}
          >
            {lang.short}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSelector;
