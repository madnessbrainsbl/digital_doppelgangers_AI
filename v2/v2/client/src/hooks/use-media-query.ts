import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Создаем медиа-запрос
    const media = window.matchMedia(query);

    // Устанавливаем начальное состояние
    setMatches(media.matches);

    // Обработчик изменения медиа-запроса
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Добавляем слушатель
    media.addEventListener("change", listener);

    // Очищаем при размонтировании
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}
