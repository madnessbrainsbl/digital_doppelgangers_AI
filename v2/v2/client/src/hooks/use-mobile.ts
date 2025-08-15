import { useState, useEffect } from 'react';

export function useIsMobile(): boolean {
  // По умолчанию предполагаем, что не мобильный
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Проверка размера только в браузере
    if (typeof window !== 'undefined') {
      // Устанавливаем начальное значение
      setIsMobile(window.innerWidth < 1024);
      
      // Обработчик изменения размера
      function handleResize() {
        setIsMobile(window.innerWidth < 1024);
      }
      
      // Добавляем обработчик
      window.addEventListener('resize', handleResize);
      
      // Удаляем обработчик при размонтировании
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);
  
  return isMobile;
}