import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi, publicApi } from '@/services/api/auth/authApi'
import type {
  CheckEmailResponse,
  ValidateTokenResponse,
  PublicOrganizationInfo
} from '@/types/auth'
import { authKeys, publicKeys } from './authKeys'

// Query Hooks
export function useCheckEmail(email: string) {
  return useQuery<CheckEmailResponse>({
    queryKey: authKeys.checkEmail(email),
    queryFn: () => authApi.checkEmail(email),
    enabled: !!email && email.includes('@'),
    staleTime: 30 * 1000, // 30 seconds
    retry: false, // Don't retry on failed email checks
  })
}

export function useValidateToken(token: string) {
  return useQuery<ValidateTokenResponse>({
    queryKey: authKeys.validateToken(token),
    queryFn: () => authApi.validateToken(token),
    enabled: !!token,
    staleTime: 0, // Always fresh for security
    retry: false,
  })
}

export function usePublicOrganizationInfo(domain?: string) {
  return useQuery<PublicOrganizationInfo>({
    queryKey: publicKeys.organizationInfo(domain),
    queryFn: () => publicApi.getPublicOrganizationInfo(domain),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useOnboardingFormInfo(token: string) {
  return useQuery({
    queryKey: publicKeys.onboardingForm(token),
    queryFn: () => publicApi.getOnboardingFormInfo(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

export function useCheckOnboardingTokenValidity(token: string) {
  return useQuery<{ valid: boolean; expired: boolean }>({
    queryKey: [...publicKeys.onboardingForm(token), 'validity'],
    queryFn: () => publicApi.checkOnboardingTokenValidity(token),
    enabled: !!token,
    staleTime: 0, // Always check freshness for security
    retry: false,
  })
}

export function usePublicData(type: 'departments' | 'roles' | 'locations') {
  return useQuery<any[]>({
    queryKey: [...publicKeys.all, 'data', type],
    queryFn: () => publicApi.getPublicData(type),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Mutation Hooks
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      // Invalidate all queries on successful login to refresh user-specific data
      queryClient.invalidateQueries()
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all cache on logout
      queryClient.clear()
    },
  })
}

export function useVerifyPassword() {
  return useMutation({
    mutationFn: authApi.verifyPassword,
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: authApi.verifyOtp,
  })
}

export function useRefreshToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.refreshToken,
    onSuccess: () => {
      // Invalidate auth-related queries on token refresh
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  })
}

export function useResetPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (_, variables) => {
      // Invalidate token validation for the used token
      queryClient.invalidateQueries({ queryKey: authKeys.validateToken(variables.token) })
    },
  })
}

export function useSetPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.setPassword,
    onSuccess: (_, variables) => {
      // Invalidate token validation for the used token
      queryClient.invalidateQueries({ queryKey: authKeys.validateToken(variables.token) })
    },
  })
}

export function useVerifyEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (_, variables) => {
      // Invalidate token validation for the used token
      queryClient.invalidateQueries({ queryKey: authKeys.validateToken(variables.token) })
    },
  })
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: authApi.resendVerificationEmail,
  })
}

export function useSubmitOnboardingForm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: publicApi.submitOnboardingForm,
    onSuccess: (_, variables) => {
      // Invalidate onboarding form info for the used token
      queryClient.invalidateQueries({ queryKey: publicKeys.onboardingForm(variables.token) })
    },
  })
}

// Utility hooks for common auth patterns
export function useAuthenticatedQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options?: any
) {
  return useQuery<T>({
    queryKey,
    queryFn,
    ...options,
    // Automatically handle authentication errors
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false // Don't retry on auth errors
      }
      return failureCount < 3
    },
  })
}

export function useAuthenticatedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: any
) {
  const queryClient = useQueryClient()

  return useMutation<TData, any, TVariables>({
    mutationFn,
    ...options,
    onError: (error: any, variables, context) => {
      if (error?.response?.status === 401) {
        // Handle auth errors globally
        queryClient.clear()
        window.location.href = '/auth/signin'
      }
      options?.onError?.(error, variables, context)
    },
  })
}
