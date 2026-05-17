import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient configuration for React Query.
 * Stale time: 5 minutes - data is considered fresh for 5 min before refetch
 * GC time: 10 minutes - unused query data is garbage collected after 10 min
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
