import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  plan?: string | null;
  balance?: number | null;
  referrerId?: number | null;
  managerId?: number | null;
  referralCode?: string | null;
  totalSpent?: number;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  sendVerificationCode: (email: string) => Promise<void>;
  sendSmsVerificationCode: (phone: string) => Promise<void>;
  verifyCode: (identifier: string, code: string, referralCode?: string, isPhone?: boolean) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      if (!token) return null;
      
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          throw new Error('Failed to get user data');
        }
        
        return await res.json();
      } catch (error) {
        // Если запрос не удался, сбрасываем токен
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        return null;
      }
    },
    enabled: !!token, // Запрос выполняется только при наличии токена
  });

  // Мутация для отправки кода подтверждения на email
  const sendCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      try {
        const res = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          throw new Error('Не удалось отправить код подтверждения');
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error sending code:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Код отправлен',
        description: 'Проверьте вашу электронную почту для получения кода подтверждения.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить код подтверждения.',
        variant: 'destructive'
      });
    },
  });
  
  // Мутация для отправки SMS-кода подтверждения на телефон
  const sendSmsCodeMutation = useMutation({
    mutationFn: async (phone: string) => {
      try {
        const res = await fetch('/api/auth/send-sms-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone }),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          throw new Error('Не удалось отправить SMS-код подтверждения');
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error sending SMS code:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // В тестовом режиме сервер может вернуть код
      if (data.testMode && data.code) {
        toast({
          title: 'SMS-код отправлен',
          description: `Тестовый режим: используйте код ${data.code}`,
          duration: 10000, // Увеличиваем время отображения для тестового кода
        });
      } else {
        toast({
          title: 'SMS-код отправлен',
          description: 'Проверьте ваш телефон для получения кода подтверждения.'
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить SMS-код подтверждения.',
        variant: 'destructive'
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ 
      identifier, 
      code, 
      referralCode,
      isPhone = false 
    }: { 
      identifier: string; 
      code: string; 
      referralCode?: string;
      isPhone?: boolean;
    }) => {
      try {
        // Определяем, какие данные отправлять в зависимости от типа идентификатора
        const payload = isPhone 
          ? { phone: identifier, code, referralCode }
          : { email: identifier, code, referralCode };
        
        const res = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          throw new Error('Не удалось проверить код подтверждения');
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error verifying code:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Сохраняем токен в localStorage
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      
      // Обновляем данные пользователя
      queryClient.setQueryData(['/api/auth/me'], data.user);
      
      toast({
        title: 'Успешный вход',
        description: `Добро пожаловать, ${data.user.name || data.user.email}!`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка входа',
        description: error.message || 'Не удалось выполнить вход.',
        variant: 'destructive'
      });
    },
  });

  // Функции для работы с аутентификацией
  const sendVerificationCode = async (email: string) => {
    await sendCodeMutation.mutateAsync(email);
  };
  
  const sendSmsVerificationCode = async (phone: string) => {
    await sendSmsCodeMutation.mutateAsync(phone);
  };

  const verifyCode = async (identifier: string, code: string, referralCode?: string, isPhone: boolean = false) => {
    await verifyCodeMutation.mutateAsync({ 
      identifier, 
      code, 
      referralCode, 
      isPhone 
    });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    queryClient.setQueryData(['/api/auth/me'], null);
    
    toast({
      title: 'Выход выполнен',
      description: 'Вы успешно вышли из системы.',
    });
  };

  // Добавляем токен к запросам
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      if (typeof input === 'string' && input.startsWith('/api') && token) {
        init = init || {};
        init.headers = {
          ...init.headers,
          'Authorization': `Bearer ${token}`,
        };
      }
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    token,
    sendVerificationCode,
    sendSmsVerificationCode,
    verifyCode,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}