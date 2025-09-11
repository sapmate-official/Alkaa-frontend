import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { APIDictionary } from '@/api/v2/APIdict'
import axios from 'axios'
import { User } from '@/interface/general'
import { IBankDetails } from '@/interface/bankDetails'
import { ISalaryParameters } from '@/interface/salaryParameters'
import { useToast } from '@/hooks/use-toast'

// Query Keys
export const profileQueryKeys = {
  all: ['profile'] as const,
  user: (userId: string) => ['profile', 'user', userId] as const,
  userDetails: (userId: string) => ['profile', 'user-details', userId] as const,
  bankDetails: (userId: string) => ['profile', 'bank-details', userId] as const,
  salaryParameters: (userId: string) => ['profile', 'salary-parameters', userId] as const,
  relationship: (targetUserId?: string) => 
    targetUserId 
      ? ['profile', 'relationship', 'user', targetUserId] as const
      : ['profile', 'relationship', 'organization'] as const,
}

// Profile Info Query
export const useProfileQuery = (userId: string) => {
  return useQuery({
    queryKey: profileQueryKeys.user(userId),
    queryFn: async () => {
      const response = await axios.get(APIDictionary.userProfile(userId), {
        withCredentials: true
      })
      return response.data.user as User
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// User Details Query (for full profile data)
export const useUserDetailsQuery = (userId: string) => {
  return useQuery({
    queryKey: profileQueryKeys.userDetails(userId),
    queryFn: async () => {
      const response = await axios.get(APIDictionary.userProfile(userId), {
        withCredentials: true
      })
      return response.data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// Relationship Query
export const useRelationshipQuery = (targetUserId?: string) => {
  return useQuery({
    queryKey: profileQueryKeys.relationship(targetUserId),
    queryFn: async () => {
      const url = targetUserId 
        ? APIDictionary.relationshipWithUser(targetUserId)
        : APIDictionary.relationshipOrganization
      
      const response = await axios.get(url, {
        withCredentials: true
      })
      return response.data
    },
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Bank Details Query
export const useBankDetailsQuery = (userId: string) => {
  return useQuery({
    queryKey: profileQueryKeys.bankDetails(userId),
    queryFn: async () => {
      const response = await axios.get(`${APIDictionary.bank}/${userId}`, {
        withCredentials: true
      })
      return response.data as IBankDetails
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// Salary Parameters Query
export const useSalaryParametersQuery = (userId: string) => {
  return useQuery({
    queryKey: profileQueryKeys.salaryParameters(userId),
    queryFn: async () => {
      const response = await axios.get(APIDictionary.payrollParameters(userId), {
        withCredentials: true
      })
      return response.data as ISalaryParameters
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// Update Profile Mutation
export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const response = await axios.put(APIDictionary.userProfile(userId), data, {
        withCredentials: true
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch profile queries
      queryClient.invalidateQueries({
        queryKey: profileQueryKeys.user(variables.userId)
      })
      queryClient.invalidateQueries({
        queryKey: profileQueryKeys.userDetails(variables.userId)
      })
      
      toast({
        title: "Success!",
        description: "Profile updated successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    }
  })
}

// Update Bank Details Mutation
export const useUpdateBankDetailsMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: IBankDetails) => {
      const response = await axios.put(APIDictionary.bank, data, {
        withCredentials: true
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch bank details query
      queryClient.invalidateQueries({
        queryKey: profileQueryKeys.bankDetails(variables.userId)
      })
      
      toast({ 
        title: 'Bank details saved successfully' 
      })
    },
    onError: (error) => {
      console.error('Error updating bank details:', error)
      toast({ 
        title: 'Failed to save bank details', 
        variant: 'destructive' 
      })
    }
  })
}

// Update Salary Parameters Mutation
export const useUpdateSalaryParametersMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: ISalaryParameters }) => {
      const numericData = {
        hraPercentage: parseFloat(data.hraPercentage?.toString() ?? '0'),
        daPercentage: parseFloat(data.daPercentage?.toString() ?? '0'),
        taPercentage: parseFloat(data.taPercentage?.toString() ?? '0'),
        pfPercentage: parseFloat(data.pfPercentage?.toString() ?? '0'),
        taxPercentage: parseFloat(data.taxPercentage?.toString() ?? '0'),
        insuranceFixed: parseFloat(data.insuranceFixed?.toString() ?? '0'),
        userId: userId
      }
      
      const response = await axios.post(APIDictionary.payrollParameters(userId), numericData, {
        withCredentials: true
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch salary parameters query
      queryClient.invalidateQueries({
        queryKey: profileQueryKeys.salaryParameters(variables.userId)
      })
      
      toast({ 
        title: 'Salary parameters saved successfully' 
      })
    },
    onError: (error) => {
      console.error('Error updating salary parameters:', error)
      toast({ 
        title: 'Failed to save salary parameters', 
        variant: 'destructive' 
      })
    }
  })
}

// Payroll Query (for salary records)
export const usePayrollQuery = (userId: string) => {
  return useQuery({
    queryKey: ['payroll', 'user', userId],
    queryFn: async () => {
      const response = await axios.get(APIDictionary.get_payroll(userId), {
        withCredentials: true
      })
      return response.data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// Payroll Statistics Query
export const usePayrollStatsQuery = (userId: string) => {
  return useQuery({
    queryKey: ['payroll', 'stats', userId],
    queryFn: async () => {
      const response = await axios.get(APIDictionary.get_payroll_stats(userId), {
        withCredentials: true
      })
      return response.data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
