import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
] as const;

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const { setLanguage } = useAuth();

  const currentLang = i18n.language || 'en';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as 'en' | 'kn' | 'hi';
    setLanguage(lang);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={currentLang}
        onChange={handleChange}
        aria-label="Select Application Language"
        className="appearance-none min-h-[40px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium rounded-[6px] pl-3 pr-8 py-1.5 cursor-pointer transition-colors duration-150 hover:border-[var(--teal)]"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} className="bg-[var(--surface)] text-[var(--text-primary)]">
            {l.native}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-[var(--text-muted)] text-[10px]" aria-hidden="true">
        ▼
      </span>
    </div>
  );
};

export default LanguageSelector;
