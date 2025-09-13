// Central query keys file for better organization and consistency
// This file exports all query keys from different modules

export { roleKeys } from './useRoles'
export { permissionKeys } from './usePermissions'
export { taskKeys, taskGroupKeys } from './useTasks'
export { holidayKeys, holidayTypeKeys } from './useHolidays'
export { payrollKeys } from './usePayroll'
export { billingKeys } from './useBilling'
export { notificationKeys } from './useNotifications'
export { authKeys, publicKeys } from './authKeys'
export { employeeKeys } from './employeeKeys'
export { attendanceKeys } from './attendanceKeys'

// Global query patterns for common invalidation
export const globalKeys = {
  // Invalidate all user-specific data
  user: (userId: string) => ['user', userId] as const,
  
  // Invalidate all organization-specific data
  organization: (orgId: string) => ['organization', orgId] as const,
  
  // Invalidate all stats/analytics
  stats: () => ['stats'] as const,
  
  // Invalidate all lists across modules
  lists: () => ['lists'] as const,
  
  // Common patterns
  all: ['all'] as const,
  infinite: (key: string) => [key, 'infinite'] as const,
  
  // Real-time data that updates frequently
  realtime: () => ['realtime'] as const,
} as const

// Helper functions for query invalidation patterns
export const invalidationHelpers = {
  // Invalidate all data for a specific user
  invalidateUserData: (queryClient: any, userId: string) => {
    queryClient.invalidateQueries({ queryKey: globalKeys.user(userId) })
  },
  
  // Invalidate all data for a specific organization
  invalidateOrgData: (queryClient: any, orgId: string) => {
    queryClient.invalidateQueries({ queryKey: globalKeys.organization(orgId) })
  },
  
  // Invalidate all stats across the application
  invalidateAllStats: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: globalKeys.stats() })
  },
  
  // Invalidate all list views
  invalidateAllLists: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: globalKeys.lists() })
  },
  
  // Common pattern for invalidating after user actions
  invalidateAfterUserAction: (queryClient: any, userId: string, orgId: string) => {
    queryClient.invalidateQueries({ queryKey: globalKeys.user(userId) })
    queryClient.invalidateQueries({ queryKey: globalKeys.organization(orgId) })
    queryClient.invalidateQueries({ queryKey: globalKeys.stats() })
  }
} as const

// Query options presets for common scenarios
export const queryOptions = {
  // For real-time data that changes frequently
  realtime: {
    staleTime: 0,
    refetchInterval: 30 * 1000, // 30 seconds
  },
  
  // For data that changes occasionally
  dynamic: {
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  },
  
  // For relatively stable data
  stable: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  },
  
  // For very stable data (like configuration)
  static: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: false,
  },
  
  // For authentication-related queries
  auth: {
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  },
  
  // For public data that doesn't require auth
  public: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  },
  
  // For background data that doesn't block UI
  background: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  }
} as const
