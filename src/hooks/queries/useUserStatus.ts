import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userStatusService, UpdateUserStatusRequest, ReactivateUserRequest } from '@/services/api/userStatusService'
import { useToast } from '@/hooks/use-toast'

// Query Keys
export const userStatusKeys = {
  all: ['userStatus'] as const,
  history: (userId: string) => ['userStatus', 'history', userId] as const,
  pendingTerminations: () => ['userStatus', 'pending-terminations'] as const,
}

// Query Hook - Get User Status History
export function useUserStatusHistory(userId: string, limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: [...userStatusKeys.history(userId), limit, offset],
    queryFn: () => userStatusService.getUserStatusHistory(userId, limit, offset),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Query Hook - Get Pending Terminations
export function usePendingTerminations() {
  return useQuery({
    queryKey: userStatusKeys.pendingTerminations(),
    queryFn: () => userStatusService.getPendingTerminations(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Mutation Hook - Update User Status
export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserStatusRequest }) =>
      userStatusService.updateUserStatus(userId, data),
    onSuccess: (_, { userId, data }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['profile', 'user', userId] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'user-details', userId] })
      queryClient.invalidateQueries({ queryKey: userStatusKeys.history(userId) })
      queryClient.invalidateQueries({ queryKey: userStatusKeys.pendingTerminations() })
      queryClient.invalidateQueries({ queryKey: ['employees'] })

      toast({
        title: 'Success',
        description: `User status updated to ${data.status}`,
        variant: 'default',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user status',
        variant: 'destructive',
      })
    },
  })
}

// Mutation Hook - Reactivate User
export function useReactivateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ReactivateUserRequest }) =>
      userStatusService.reactivateUser(userId, data),
    onSuccess: (_, { userId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['profile', 'user', userId] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'user-details', userId] })
      queryClient.invalidateQueries({ queryKey: userStatusKeys.history(userId) })
      queryClient.invalidateQueries({ queryKey: userStatusKeys.pendingTerminations() })
      queryClient.invalidateQueries({ queryKey: ['employees'] })

      toast({
        title: 'Success',
        description: 'User has been reactivated successfully',
        variant: 'default',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reactivate user',
        variant: 'destructive',
      })
    },
  })
}
