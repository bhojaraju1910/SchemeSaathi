import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import kn from './kn.json';
import hi from './hi.json';

const savedLang = localStorage.getItem('schemesaathi_lang') || 'en';

function syncHtmlLang(lng: string) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = ['en', 'kn', 'hi'].includes(lng) ? lng : 'en';
  }
}

syncHtmlLang(savedLang);

i18n.on('languageChanged', (lng) => {
  syncHtmlLang(lng);
});

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    kn: { translation: kn },
    hi: { translation: hi },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
