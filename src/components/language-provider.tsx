'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { dictionaries, interpolate, type Language } from '@/lib/i18n';

const STORAGE_KEY = 'shelby-vault-language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'zh') return stored;
  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLanguageState(readInitialLanguage());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (language === null) return;
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const effectiveLanguage = language ?? 'en';

    function setLanguage(nextLanguage: Language) {
      setLanguageState(nextLanguage);
    }

    function toggleLanguage() {
      setLanguageState((current) => {
        const resolvedCurrent = current ?? readInitialLanguage();
        return resolvedCurrent === 'en' ? 'zh' : 'en';
      });
    }

    function t(key: string, values?: Record<string, string | number>) {
      const template = dictionaries[effectiveLanguage][key] ?? dictionaries.en[key] ?? key;
      return interpolate(template, values);
    }

    return { language: effectiveLanguage, setLanguage, toggleLanguage, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error('useI18n must be used inside LanguageProvider');
  }
  return value;
}
