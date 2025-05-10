import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Проверяет ответ API и выбрасывает ошибку если статус не ОК
 * Добавляет дополнительную информацию об ошибке для помощи в отладке
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Добавляем специальную обработку для 401 ошибки
    if (res.status === 401) {
      console.error("Authentication error detected (401 Unauthorized)");
      
      // Дополнительная диагностика
      try {
        const isPreviewMode = window.location.hostname.includes('.replit.dev') || 
                           window.location.hostname.includes('.replit.app');
        console.error(`Additional diagnostic info: Preview mode: ${isPreviewMode}, URL: ${window.location.href}`);
      } catch (e) {
        console.error("Failed to gather additional diagnostics", e);
      }
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    console.log(`API Request: ${method} ${url}`);
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`API Response: ${res.status} ${res.statusText} for ${method} ${url}`);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Error for ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Extract base URL and params
      const baseUrl = queryKey[0] as string;
      const params = queryKey[1] as Record<string, any> | undefined;
      
      // Build URL with query params
      let url = baseUrl;
      if (params) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
          }
        }
        const queryString = searchParams.toString();
        if (queryString) {
          url = `${baseUrl}?${queryString}`;
        }
      }

      console.log(`Query Request: GET ${url}`);
      const res = await fetch(url, {
        credentials: "include",
      });
      console.log(`Query Response: ${res.status} ${res.statusText} for ${url}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Returning null for 401 response on ${url} (as configured)`);
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      console.log(`Query Data for ${url}:`, data);
      return data;
    } catch (error) {
      console.error(`Query Error for ${queryKey[0]}:`, error);
      throw error;
    }
  };

/**
 * Конфигурация Query Client для работы с TanStack Query
 * 
 * - Настраивает функцию получения данных (queryFn)
 * - Устанавливает стратегию при 401 ошибках
 * - Конфигурирует повторные попытки и кэширование
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ 
        // В режиме Preview возвращаем null вместо выброса ошибки при 401
        // Это гарантирует перенаправление на страницу входа вместо бесконечной загрузки
        on401: window.location.hostname.includes('.replit.dev') || 
               window.location.hostname.includes('.replit.app') ? 
               "returnNull" : "throw" 
      }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      // Добавим 1 повторную попытку для борьбы с нестабильным сетевым соединением
      retry: 1,
      retryDelay: 1000, // 1 секунда между повторами
    },
    mutations: {
      retry: false,
    },
  },
});
