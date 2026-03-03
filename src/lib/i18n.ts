'use client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from '@/dictionaries/en.json';
import viTranslation from '@/dictionaries/vi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      vi: { translation: viTranslation },
    },
    fallbackLng: 'en',
    detection: {
      order: ['navigator', 'localStorage', 'cookie', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
    interpolation: {
      escapeValue: false,
    },
    debug: true,
  });

export default i18n;
