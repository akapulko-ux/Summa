import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Translation, en, ru } from '@/lib/translations';

// Типы доступных языков
type LanguageCode = 'en' | 'ru';

// Контекст для языковых настроек
type TranslationContextType = {
  t: Translation;
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
};

// Создаем контекст
const TranslationContext = createContext<TranslationContextType | null>(null);

// Сохраняем выбор языка в localStorage
const LANGUAGE_KEY = 'saasly-language';

// Провайдер для языковых настроек
export function TranslationProvider({ children }: { children: ReactNode }) {
  // Определяем начальный язык (из localStorage или из настроек браузера)
  const getInitialLanguage = (): LanguageCode => {
    // Пробуем получить из localStorage
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY) as LanguageCode | null;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ru')) {
      return savedLanguage;
    }
    
    // Проверяем настройки браузера
    const browserLanguages = navigator.languages || [navigator.language];
    for (const lang of browserLanguages) {
      if (lang.startsWith('ru')) {
        return 'ru';
      }
    }
    
    // По умолчанию английский
    return 'en';
  };

  // Состояние текущего языка
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);
  
  // Словарь перевода для текущего языка
  const translations: Record<LanguageCode, Translation> = {
    en,
    ru,
  };

  // Установка языка с сохранением в localStorage
  const setLanguage = (lang: LanguageCode) => {
    localStorage.setItem(LANGUAGE_KEY, lang);
    setLanguageState(lang);
  };

  // Эффект для обновления HTML lang атрибута
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Возвращаем контекст с переводом и функциями управления языком
  return (
    <TranslationContext.Provider
      value={{
        t: translations[language],
        language,
        setLanguage,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

// Хук для использования переводов
export function useTranslations() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }
  return context;
}