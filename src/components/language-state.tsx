'use client';

import { useCallback, useEffect, useState } from 'react';

export type Language = 'zh' | 'en';

const STORAGE_KEY = 'shelby_vault_language';
const EVENT_NAME = 'shelby-language-change';

function readLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'zh';
  }

  return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>('zh');

  useEffect(() => {
    const sync = () => setLanguageState(readLanguage());

    sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(readLanguage() === 'zh' ? 'en' : 'zh');
  }, [setLanguage]);

  return { language, setLanguage, toggleLanguage };
}
