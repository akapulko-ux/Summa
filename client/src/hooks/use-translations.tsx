import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { en, ru, Translation } from '@/lib/translations';

type LanguageCode = 'en' | 'ru';

type TranslationContextType = {
  t: Translation;
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
};

export const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  // Функция для получения начального языка из localStorage или из языка браузера
  const getInitialLanguage = (): LanguageCode => {
    // Проверяем наличие сохраненного языка в localStorage
    const savedLanguage = localStorage.getItem('language') as LanguageCode;
    if (savedLanguage && ['en', 'ru'].includes(savedLanguage)) {
      return savedLanguage;
    }

    // Если в localStorage ничего не сохранено, проверяем язык браузера
    const browserLanguage = navigator.language.substring(0, 2);
    if (browserLanguage === 'ru') {
      return 'ru';
    }

    // По умолчанию используем английский
    return 'en';
  };

  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage());
  const [translations, setTranslations] = useState<Translation>(language === 'ru' ? ru : en);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    setTranslations(lang === 'ru' ? ru : en);
    document.documentElement.lang = lang;
  };

  // Установка языка при монтировании компонента
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <TranslationContext.Provider value={{ t: translations, language, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }
  return context;
}