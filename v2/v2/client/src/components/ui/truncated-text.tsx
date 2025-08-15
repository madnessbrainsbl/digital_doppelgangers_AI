import * as React from "react";
import { cn } from "@/lib/utils";

// Компонент для обрезки длинных текстов с отображением полного текста при наведении
interface TruncatedTextProps {
  text: string | null;
  maxLength?: number;
  className?: string;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxLength = 25,
  className,
}) => {
  // Если текст не определен, возвращаем пустую строку
  if (!text) return <span className={className}>-</span>;

  const isTruncated = text.length > maxLength;

  return (
    <div className={cn("relative group", className)}>
      <span>{isTruncated ? `${text.substring(0, maxLength)}...` : text}</span>

      {isTruncated && (
        <div
          className="absolute z-50 left-0 top-full mt-1 bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm 
          shadow-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
        >
          {text}
        </div>
      )}
    </div>
  );
};
