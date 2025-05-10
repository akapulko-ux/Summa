import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
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
