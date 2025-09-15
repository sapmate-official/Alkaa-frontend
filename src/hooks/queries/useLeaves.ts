import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import { useToast } from '@/hooks/use-toast'

// Types
export interface LeaveType {
  id: string
  orgId: string
  name: string
  description: string
  annualLimit: number
  requiresApproval: boolean
  isPaid: boolean
  carryForward: boolean
  maxCarryForward: number
  createdAt: string
  updatedAt: string
}

export interface LeaveBalance {
  id: string
  userId: string
  leaveTypeId: string
  usedDays: number
  remainingDays: number
  carryForward: number
  year: number
  createdAt: string
  updatedAt: string
  leaveType: LeaveType
}

export interface LeaveRequest {
  id: string
  userId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  numberOfDays: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  reason: string
  approvedBy: string | null
  approvedAt: string | null
  rejectedReason: string | null
  attachments: string | null
  createdAt: string
  updatedAt: string
  leaveType?: LeaveType
  user?: {
    firstName: string
    lastName: string
    email?: string
  }
}

// Query Keys
export const leaveQueryKeys = {
  all: ['leaves'] as const,
  types: ['leave-types'] as const,
  typesByOrg: (orgId: string) => ['leave-types', 'org', orgId] as const,
  type: (id: string) => ['leave-types', 'detail', id] as const,
  requests: ['leave-requests'] as const,
  requestsByUser: (userId: string) => ['leave-requests', 'user', userId] as const,
  requestsByManager: (userId: string) => ['leave-requests', 'manager', userId] as const,
  request: (id: string) => ['leave-requests', 'detail', id] as const,
  balances: ['leave-balances'] as const,
  balancesByUser: (userId: string) => ['leave-balances', 'user', userId] as const,
  balanceByType: (leaveTypeId: string, userId: string) => ['leave-balances', 'type', leaveTypeId, 'user', userId] as const,
}

// Leave Types Queries
export const useLeaveTypesQuery = (orgId?: string, enabled: boolean = true) => {
  return useQuery<LeaveType[]>({
    queryKey: leaveQueryKeys.typesByOrg(orgId || ''),
    enabled: !!orgId && enabled,
    queryFn: async () => {
      const { data } = await axios.get(APIDictionary.get_all_org_leave_type(orgId!), { withCredentials: true })
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export const useLeaveTypeQuery = (id: string) => {
  return useQuery({
    queryKey: leaveQueryKeys.type(id),
    queryFn: async () => {
      const response = await axios.get(APIDictionary.leave_type(id), { withCredentials: true })
      return response.data as LeaveType
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Leave Requests Queries
export const useLeaveRequestsQuery = (userId?: string, enabled: boolean = true) => {
  return useQuery<LeaveRequest[]>({
    queryKey: leaveQueryKeys.requestsByUser(userId || ''),
    enabled: !!userId && enabled,
    queryFn: async () => {
      const { data } = await axios.get(APIDictionary.leave_request_user(userId!), { withCredentials: true })
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export const useManagerLeaveRequestsQuery = (userId?: string, enabled: boolean = true) => {
  return useQuery<LeaveRequest[]>({
    queryKey: leaveQueryKeys.requestsByManager(userId || ''),
    enabled: !!userId && enabled,
    queryFn: async () => {
      const { data } = await axios.get(APIDictionary.leave_request_manager(userId!), { withCredentials: true })
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export const useLeaveRequestQuery = (id: string) => {
  return useQuery({
    queryKey: leaveQueryKeys.request(id),
    queryFn: async () => {
      const response = await axios.get(`${APIDictionary.leave_request}/${id}`, { withCredentials: true })
      return response.data as LeaveRequest
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Leave Balances Queries
export const useLeaveBalancesQuery = (userId?: string, enabled: boolean = true) => {
  return useQuery<LeaveBalance[]>({
    queryKey: leaveQueryKeys.balancesByUser(userId || ''),
    enabled: !!userId && enabled,
    queryFn: async () => {
      const { data } = await axios.get(APIDictionary.leave_balance_user(userId!), { withCredentials: true })
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export const useLeaveBalanceQuery = (leaveTypeId: string, userId: string) => {
  return useQuery({
    queryKey: leaveQueryKeys.balanceByType(leaveTypeId, userId),
    queryFn: async () => {
      const { data } = await axios.get(APIDictionary.leave_balance_type_user(leaveTypeId, userId), { withCredentials: true })
      return data
    },
    enabled: !!leaveTypeId && !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

// Mutations

// Leave Type Mutations
export const useCreateLeaveTypeMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (leaveTypeData: Partial<LeaveType>) => {
      const response = await axios.post(APIDictionary.leave_type(''), leaveTypeData, { withCredentials: true })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate leave types list for the organization
      if (variables.orgId) {
        queryClient.invalidateQueries({
          queryKey: leaveQueryKeys.typesByOrg(variables.orgId)
        })
      }

      toast({
        title: "Success",
        description: "Leave type created successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error creating leave type:', error)
      toast({
        title: "Error",
        description: "Failed to create leave type. Please try again.",
        variant: "destructive"
      })
    }
  })
}

export const useUpdateLeaveTypeMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeaveType> }) => {
      const response = await axios.put(APIDictionary.leave_type(id), data, { withCredentials: true })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate specific leave type and leave types list
      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.type(variables.id)
      })

      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.types
      })

      toast({
        title: "Success",
        description: "Leave type updated successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error updating leave type:', error)
      toast({
        title: "Error",
        description: "Failed to update leave type. Please try again.",
        variant: "destructive"
      })
    }
  })
}

export const useDeleteLeaveTypeMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(APIDictionary.leave_type(id), { withCredentials: true })
      return response.data
    },
    onSuccess: (_, leaveTypeId) => {
      // Remove the leave type from cache
      queryClient.removeQueries({
        queryKey: leaveQueryKeys.type(leaveTypeId)
      })

      // Invalidate leave types list
      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.types
      })

      toast({
        title: "Success",
        description: "Leave type deleted successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error deleting leave type:', error)
      toast({
        title: "Error",
        description: "Failed to delete leave type. Please try again.",
        variant: "destructive"
      })
    }
  })
}

// Leave Request Mutations
export const useCreateLeaveRequestMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (requestData: {
      userId: string
      leaveTypeId: string
      startDate: string
      endDate: string
      reason: string
    }) => {
      const response = await axios.post(APIDictionary.leave_request, requestData, { withCredentials: true })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate user's leave requests
      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.requestsByUser(variables.userId)
      })

      // Invalidate user's leave balances
      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.balancesByUser(variables.userId)
      })

      toast({
        title: "Success",
        description: "Leave request submitted successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error creating leave request:', error)
      toast({
        title: "Error",
        description: "Failed to submit leave request. Please try again.",
        variant: "destructive"
      })
    }
  })
}

export const useUpdateLeaveRequestMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeaveRequest> }) => {
      const response = await axios.put(`${APIDictionary.leave_request}/${id}`, data, { withCredentials: true })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate specific leave request and user's requests
      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.request(variables.id)
      })

      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.requests
      })

      toast({
        title: "Success",
        description: "Leave request updated successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error updating leave request:', error)
      toast({
        title: "Error",
        description: "Failed to update leave request. Please try again.",
        variant: "destructive"
      })
    }
  })
}

export const useDeleteLeaveRequestMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${APIDictionary.leave_request}/${id}`, { withCredentials: true })
      return response.data
    },
    onSuccess: (_, requestId) => {
      // Remove the leave request from cache
      queryClient.removeQueries({
        queryKey: leaveQueryKeys.request(requestId)
      })

      // Invalidate leave requests list
      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.requests
      })

      toast({
        title: "Success",
        description: "Leave request deleted successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error deleting leave request:', error)
      toast({
        title: "Error",
        description: "Failed to delete leave request. Please try again.",
        variant: "destructive"
      })
    }
  })
}

export const useApproveLeaveRequestMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, approvedBy }: { id: string; approvedBy: string }) => {
      const response = await axios.post(APIDictionary.leave_request_approve(id), { approvedBy }, { withCredentials: true })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate specific leave request
      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.request(variables.id)
      })

      // Invalidate all leave requests (both user and manager views)
      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.requests
      })

      toast({
        title: "Success",
        description: "Leave request approved successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error approving leave request:', error)
      toast({
        title: "Error",
        description: "Failed to approve leave request. Please try again.",
        variant: "destructive"
      })
    }
  })
}

export const useRejectLeaveRequestMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, approvedBy, rejectedReason }: { id: string; approvedBy: string; rejectedReason: string }) => {
      const response = await axios.post(APIDictionary.leave_request_reject(id), { approvedBy, rejectedReason }, { withCredentials: true })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate specific leave request
      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.request(variables.id)
      })

      // Invalidate all leave requests (both user and manager views)
      queryClient.invalidateQueries({
        queryKey: leaveQueryKeys.requests
      })

      toast({
        title: "Success",
        description: "Leave request rejected successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error rejecting leave request:', error)
      toast({
        title: "Error",
        description: "Failed to reject leave request. Please try again.",
        variant: "destructive"
      })
    }
  })
}
