import { useState, useEffect } from "react";

// Кэш для изображений в памяти
const imageCache = new Map<string, string>();

// Хук для кэширования изображений сервисов
export const useImageCache = (url: string | null) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setCachedUrl(null);
      return;
    }

    // Проверяем кэш
    if (imageCache.has(url)) {
      setCachedUrl(imageCache.get(url)!);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Создаем объект изображения для предзагрузки
    const img = new Image();
    
    img.onload = () => {
      // Кэшируем URL
      imageCache.set(url, url);
      setCachedUrl(url);
      setIsLoading(false);
    };

    img.onerror = () => {
      setError("Failed to load image");
      setIsLoading(false);
    };

    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return { cachedUrl, isLoading, error };
};

// Функция для предзагрузки изображений
export const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    if (!imageCache.has(url)) {
      const img = new Image();
      img.onload = () => {
        imageCache.set(url, url);
      };
      img.src = url;
    }
  });
};

// Хук для предзагрузки списка изображений
export const usePreloadImages = (urls: string[]) => {
  useEffect(() => {
    preloadImages(urls);
  }, [urls]);
};