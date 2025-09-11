// Centralized TanStack Query client configuration
import { QueryClient } from '@tanstack/react-query'

// Create a single shared QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute fresh
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        // Do not retry on 404/401
        const status = error?.response?.status
        if (status === 401 || status === 404) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: 0,
    },
  },
})
