import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/api/v2/APIdict'

// Types
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  success: boolean
  message: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    orgId: string
    role: string
    permissions: string[]
  }
  tokens: {
    accessToken: string
    refreshToken: string
  }
  organization: {
    id: string
    name: string
    domain: string
  }
}

export interface RegisterRequest {
  email: string
  firstName: string
  lastName: string
  organizationName: string
  password: string
  confirmPassword: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface SetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface CheckEmailRequest {
  email: string
}

export interface CheckEmailResponse {
  exists: boolean
  isVerified: boolean
  hasPassword: boolean
  organization?: {
    id: string
    name: string
    domain: string
  }
}

export interface VerifyPasswordRequest {
  email: string
  password: string
}

export interface VerifyOtpRequest {
  email: string
  otp: string
  type: 'LOGIN' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION'
}

export interface ValidateTokenRequest {
  token: string
}

export interface ValidateTokenResponse {
  valid: boolean
  expired: boolean
  type: 'ACCESS' | 'REFRESH' | 'RESET' | 'VERIFICATION'
  user?: {
    id: string
    email: string
  }
}

export interface PublicOrganizationInfo {
  id: string
  name: string
  domain: string
  logo?: string
  description?: string
  contactEmail?: string
  website?: string
  settings: {
    allowSelfRegistration: boolean
    requireEmailVerification: boolean
    passwordPolicy: {
      minLength: number
      requireNumbers: boolean
      requireSymbols: boolean
      requireUppercase: boolean
      requireLowercase: boolean
    }
  }
}

export interface OnboardingFormData {
  token: string
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    dateOfBirth?: string
    address?: string
  }
  professionalInfo: {
    position: string
    department: string
    startDate: string
    employeeId?: string
    manager?: string
  }
  documents?: {
    resume?: File
    idProof?: File
    addressProof?: File
    profilePicture?: File
  }
  bankDetails?: {
    accountNumber: string
    bankName: string
    ifscCode: string
    accountHolderName: string
  }
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
    email?: string
  }
}

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  checkEmail: (email: string) => [...authKeys.all, 'checkEmail', email] as const,
  validateToken: (token: string) => [...authKeys.all, 'validateToken', token] as const,
  organizationInfo: (domain: string) => [...authKeys.all, 'organizationInfo', domain] as const,
}

export const publicKeys = {
  all: ['public'] as const,
  organizationInfo: (domain?: string) => [...publicKeys.all, 'organization', domain || 'current'] as const,
  onboardingForm: (token: string) => [...publicKeys.all, 'onboarding', token] as const,
}

// API Functions
const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post(APIDictionary.login, data, { withCredentials: true })
    return response.data
  },

  async logout(): Promise<void> {
    await axios.post(APIDictionary.logout, {}, { withCredentials: true })
  },

  async checkEmail(email: string): Promise<CheckEmailResponse> {
    const response = await axios.post(APIDictionary.checkEmail, { email })
    return response.data
  },

  async verifyPassword(data: VerifyPasswordRequest): Promise<{ valid: boolean }> {
    const response = await axios.post(APIDictionary.verifyPassword, data)
    return response.data
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<{ valid: boolean }> {
    const response = await axios.post(APIDictionary.verifyOtp, data)
    return response.data
  },

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    const response = await axios.post(APIDictionary.validateToken, { token })
    return response.data
  },

  async refreshToken(): Promise<LoginResponse> {
    const response = await axios.post(APIDictionary.refreshToken, {}, { withCredentials: true })
    return response.data
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${APIDictionary.user}/forgot-password`, data)
    return response.data
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${APIDictionary.user}/reset-password`, data)
    return response.data
  },

  async setPassword(data: SetPasswordRequest): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(APIDictionary.setPassword, data)
    return response.data
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${APIDictionary.user}/verify-email`, data)
    return response.data
  },

  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${APIDictionary.user}/resend-verification`, { email })
    return response.data
  }
}

const publicApi = {
  async getPublicOrganizationInfo(domain?: string): Promise<PublicOrganizationInfo> {
    const endpoint = domain 
      ? `${APIDictionary.Organization}/public?domain=${domain}`
      : `${APIDictionary.Organization}/public`
    const response = await axios.get(endpoint)
    return response.data.data || response.data
  },

  async getOnboardingFormInfo(token: string): Promise<any> {
    const response = await axios.get(`${APIDictionary.onboarding}/form/${token}`)
    return response.data.data || response.data
  },

  async submitOnboardingForm(data: OnboardingFormData): Promise<{ success: boolean; message: string }> {
    const formData = new FormData()
    
    // Add basic data
    formData.append('token', data.token)
    formData.append('personalInfo', JSON.stringify(data.personalInfo))
    formData.append('professionalInfo', JSON.stringify(data.professionalInfo))
    
    if (data.bankDetails) {
      formData.append('bankDetails', JSON.stringify(data.bankDetails))
    }
    
    if (data.emergencyContact) {
      formData.append('emergencyContact', JSON.stringify(data.emergencyContact))
    }
    
    // Add files
    if (data.documents) {
      Object.entries(data.documents).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file)
        }
      })
    }

    const response = await axios.post(`${APIDictionary.onboarding}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async checkOnboardingTokenValidity(token: string): Promise<{ valid: boolean; expired: boolean }> {
    const response = await axios.get(`${APIDictionary.onboarding}/validate/${token}`)
    return response.data
  },

  async getPublicData(type: 'departments' | 'roles' | 'locations'): Promise<any[]> {
    const response = await axios.get(`${APIDictionary.Organization}/public/${type}`)
    return response.data.data || response.data
  }
}

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
