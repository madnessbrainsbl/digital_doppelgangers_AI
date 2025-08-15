import React, { createContext, useContext, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { setToastFunctions } from '@/lib/queryClient';

// Создаем контекст
type ToastContextType = {
  showSuccessToast: (message: string, details?: string) => void;
  showErrorToast: (message: string, error?: any) => void;
  showInfoToast: (message: string, details?: string) => void;
  showWarningToast: (message: string, details?: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Тип для обработчика ошибок fetch
type ResponseErrorHandler = (response: Response) => Promise<Response>;

// Создаем провайдер
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  const showSuccessToast = (message: string, details?: string) => {
    // Добавляем задержку для принудительного обновления UI
    setTimeout(() => {
      toast({
        title: message,
        description: details,
        variant: 'default',
      });
      
      // Дополнительно логируем для отладки
      console.log('Success toast:', message, details);
    }, 50);
  };

  const showErrorToast = (message: string, error?: any) => {
    let errorDetails = '';
    
    if (error) {
      if (typeof error === 'string') {
        errorDetails = error;
      } else if (error instanceof Error) {
        errorDetails = error.message;
      } else if (error.message) {
        errorDetails = error.message;
      } else {
        try {
          errorDetails = JSON.stringify(error);
        } catch (e) {
          errorDetails = 'Неизвестная ошибка';
        }
      }
    }

    // Добавляем задержку для принудительного обновления UI
    setTimeout(() => {
      toast({
        title: message,
        description: errorDetails,
        variant: 'destructive',
      });
      
      // Дополнительно логируем для отладки
      console.log('Error toast:', message, errorDetails);
    }, 50);
  };

  const showInfoToast = (message: string, details?: string) => {
    setTimeout(() => {
      toast({
        title: message,
        description: details,
      });
      console.log('Info toast:', message, details);
    }, 50);
  };

  const showWarningToast = (message: string, details?: string) => {
    setTimeout(() => {
      toast({
        title: message,
        description: details,
        // В Shadcn UI есть только 'default' и 'destructive'
        variant: 'default',
      });
      console.log('Warning toast:', message, details);
    }, 50);
  };

  // Инициализируем тосты в queryClient
  useEffect(() => {
    setToastFunctions({
      showSuccessToast,
      showErrorToast,
    });
  }, []);

  // Переопределяем глобальный fetch для отображения ошибок
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async function(input, init) {
      try {
        const response = await originalFetch(input, init);
        
        // Если запрос не успешен, показываем тост с ошибкой
        if (!response.ok) {
          try {
            // Копируем response, чтобы его можно было прочитать дважды
            const clonedResponse = response.clone();
            const contentType = clonedResponse.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              const errorData = await clonedResponse.json();
              const errorMessage = errorData.message || 'Ошибка при выполнении запроса';
              showErrorToast('Ошибка на сервере', errorMessage);
            } else {
              const errorText = await clonedResponse.text();
              showErrorToast('Ошибка на сервере', errorText || `Статус: ${response.status}`);
            }
          } catch (parseError) {
            showErrorToast('Ошибка на сервере', `Статус: ${response.status}, ${response.statusText}`);
          }
        }
        
        return response;
      } catch (error) {
        showErrorToast('Ошибка соединения', error instanceof Error ? error.message : 'Не удалось выполнить запрос');
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccessToast, showErrorToast, showInfoToast, showWarningToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// Хук для использования тостов
export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}