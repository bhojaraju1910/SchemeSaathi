import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Languages } from 'lucide-react';

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
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <Languages className="w-4 h-4 text-[#9FB0C8] pointer-events-none absolute left-2.5" />
      <select
        value={currentLang}
        onChange={handleChange}
        aria-label="Select Application Language"
        className="appearance-none bg-[#14213B] border border-[#243A63] text-[#EAF1FB] text-xs font-medium rounded-lg pl-8 pr-7 py-1.5 focus:outline-none focus:border-[#5AA9FF] cursor-pointer transition-colors hover:border-[#5AA9FF]/50"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} className="bg-[#14213B] text-[#EAF1FB]">
            {l.native}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2.5 text-[#9FB0C8] text-[10px]">▼</div>
    </div>
  );
};

export default LanguageSelector;
