import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Функция для проверки размера экрана
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Проверяем размер экрана при загрузке
    checkScreenSize();

    // Добавляем слушатель изменения размера окна
    window.addEventListener('resize', checkScreenSize);

    // Очистка слушателя при размонтировании компонента
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  return isMobile;
}