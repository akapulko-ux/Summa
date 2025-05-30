import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { en, ru, Translation } from '@/lib/translations';

type LanguageCode = 'en' | 'ru';

type TranslationContextType = {
  t: (key: string, params?: Record<string, string>) => string;
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  translations: Translation;
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

  // Функция для получения перевода по ключу с поддержкой параметров
  const t = (key: string, params?: Record<string, string>): string => {
    // Если ключ пустой, возвращаем пустую строку
    if (!key) return "";
    
    // Разбиваем ключ на части (например, "common.loading" -> ["common", "loading"])
    const keys = key.split('.');
    if (keys.length === 0) return key;

    try {
      // Перебираем вложенные объекты, следуя по пути ключа
      let result: any = translations;
      for (const k of keys) {
        if (result === undefined || result[k] === undefined) {
          console.log(`Missing translation for key: ${key}`);
          return key; // Ключ не найден
        }
        result = result[k];
      }
      
      if (typeof result !== 'string') {
        console.log(`Translation result for key ${key} is not a string:`, result);
        return key;
      }
      
      // Если есть параметры, заменяем {paramName} на значение параметра
      if (params) {
        return Object.entries(params).reduce((text, [paramName, paramValue]) => {
          return text.replace(new RegExp(`{${paramName}}`, 'g'), paramValue || '');
        }, result);
      }
      
      return result;
    } catch (error) {
      console.error('Translation error for key:', key, error);
      return key;
    }
  };

  // Установка языка при монтировании компонента
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <TranslationContext.Provider value={{ t, language, setLanguage, translations }}>
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