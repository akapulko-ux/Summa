import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

// Оптимизированный хук для работы с запросами
export const useOptimizedQuery = <T>(
  key: string | string[],
  fetcher: () => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
  }
) => {
  const defaultOptions = {
    staleTime: 30000, // 30 секунд - данные считаются свежими
    cacheTime: 300000, // 5 минут - время хранения в кэше
    refetchOnWindowFocus: false, // Не перезагружать при фокусе
    refetchOnMount: false, // Не перезагружать при монтировании если есть кэш
    ...options,
  };

  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: fetcher,
    ...defaultOptions,
  });
};

// Хук для предзагрузки данных
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchData = useCallback(
    async (key: string | string[], fetcher: () => Promise<any>) => {
      await queryClient.prefetchQuery({
        queryKey: Array.isArray(key) ? key : [key],
        queryFn: fetcher,
        staleTime: 60000, // 1 минута для предзагруженных данных
      });
    },
    [queryClient]
  );

  return { prefetchData };
};

// Хук для очистки кэша пользователя
export const useClearUserCache = () => {
  const queryClient = useQueryClient();

  const clearUserCache = useCallback((userId: number) => {
    // Очищаем все запросы, связанные с пользователем
    queryClient.removeQueries({ 
      predicate: (query) => {
        const key = query.queryKey;
        return key.some((k) => 
          typeof k === 'string' && k.includes(`user:${userId}`)
        );
      }
    });

    // Очищаем основные пользовательские данные
    queryClient.removeQueries({ queryKey: ['/api/subscriptions'] });
    queryClient.removeQueries({ queryKey: ['/api/cashback/total'] });
    queryClient.removeQueries({ queryKey: ['/api/cashback/balance'] });
    queryClient.removeQueries({ queryKey: ['/api/cashback/transactions'] });
  }, [queryClient]);

  return { clearUserCache };
};