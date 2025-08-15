import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Переменная для хранения функций контекста тостов
// Будет инициализирована через setToastFunctions
let toastFunctions: {
  showSuccessToast?: (message: string, details?: string) => void;
  showErrorToast?: (message: string, error?: any) => void;
} = {};

// Функция для установки функций тостов извне
export function setToastFunctions(functions: {
  showSuccessToast: (message: string, details?: string) => void;
  showErrorToast: (message: string, error?: any) => void;
}) {
  toastFunctions = functions;
}

// Централизованная обработка ошибок для API запросов
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = '';
    let errorData: any = null;
    try {
      // Пытаемся получить JSON с ошибкой
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await res.clone().json();
        errorMessage = errorData.message || res.statusText;
      } else {
        errorMessage = await res.clone().text() || res.statusText;
      }
    } catch (e) {
      // Если не удалось получить текст, используем стандартный статус
      errorMessage = res.statusText;
    }
    
    // Показываем тост с ошибкой, если есть функция
    if (toastFunctions.showErrorToast) {
      toastFunctions.showErrorToast('Ошибка при выполнении запроса', errorMessage);
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

// Generic apiRequest with object params for better type inference
export async function apiRequest<T = any, D = any>(options: {
  url: string;
  method: string;
  body?: D;
  headers?: Record<string, string>;
  isFormData?: boolean;
  params?: Record<string, string | number>; // Добавляем поддержку URL параметров
}): Promise<T> {
  const { url: baseUrl, method, body, headers: customHeaders = {}, isFormData, params } = options;
  const headers: Record<string, string> = { ...customHeaders };
  let processedBody: any = undefined;
  
  // Добавляем URL параметры если они есть
  let url = baseUrl;
  if (params && Object.keys(params).length > 0) {
    const urlObj = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.append(key, String(value));
    });
    url = urlObj.toString();
  }

  // Добавляем токен авторизации из localStorage
  const token = localStorage.getItem('auth_token');
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (body) {
    if (body instanceof FormData || isFormData) {
      // Для FormData не устанавливаем Content-Type, браузер сам добавит с boundary
      processedBody = body;
    } else {
      headers["Content-Type"] = "application/json";
      processedBody = JSON.stringify(body);
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: processedBody,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Пытаемся распарсить как JSON, если не получается - возвращаем Response
  try {
    const contentType = res.headers.get('content-type');
    let result: any;
    
    if (contentType && contentType.includes('application/json')) {
      result = await res.json();
      
      // Показываем уведомление об успехе для не-GET запросов
      if (method.toUpperCase() !== 'GET' && toastFunctions.showSuccessToast) {
        let successMessage = 'Операция выполнена успешно';
        
        // Определяем сообщение в зависимости от метода
        if (method.toUpperCase() === 'POST') {
          successMessage = 'Данные успешно созданы';
        } else if (method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH') {
          successMessage = 'Данные успешно обновлены';
        } else if (method.toUpperCase() === 'DELETE') {
          successMessage = 'Данные успешно удалены';
        }
        
        // Если в ответе есть message, используем его
        if (result && typeof result === 'object' && result.message) {
          toastFunctions.showSuccessToast(successMessage, result.message);
        } else {
          toastFunctions.showSuccessToast(successMessage);
        }
      }
      
      return result as T;
    }
    
    return res as unknown as T;
  } catch (error) {
    return res as unknown as T;
  }
}

// Backwards compatibility function
export async function apiRequestLegacy(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { isFormData?: boolean }
): Promise<Response> {
  const headers: Record<string, string> = {};
  let body: any = undefined;
  
  // Добавляем токен авторизации из localStorage
  const token = localStorage.getItem('auth_token');
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  if (data) {
    if (options?.isFormData) {
      // Для FormData не устанавливаем Content-Type, браузер сам добавит с boundary
      body = data as FormData;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Добавляем заголовок авторизации
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
