import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import { backendDomain } from '@/constants/Domain'
import type {
  CheckEmailResponse,
  OnboardingFormData,
  PublicOrganizationInfo,
  ValidateTokenResponse
} from '@/types/auth'

const authBase = `${backendDomain}/api/v1/general`

type JsonRecord = Record<string, unknown>

interface LoginPayload {
  email: string
  password: string
  rememberMe?: boolean
}

interface VerifyPasswordPayload {
  email: string
  password: string
  orgId?: string
}

interface VerifyOtpPayload {
  sessionToken?: string
  email?: string
  orgId?: string
  otpCode: string
}

interface ForgotPasswordPayload {
  email: string
}

interface ResetPasswordPayload {
  token: string
  password: string
  confirmPassword?: string
}

interface SetPasswordPayload {
  password: string
  verificationToken: string
}

interface VerifyEmailPayload {
  token: string
}

interface AuthOrganization {
  id: string
  name: string
}

interface AuthResponse {
  message?: string
  accessToken?: string
  refreshToken?: string
  requiresTwoFactor?: boolean
  sessionToken?: string
  organization?: AuthOrganization
  organizationName?: string
  otpExpiresIn?: number
  email?: string
  userId?: string
  user?: {
    id: string
    email?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export const authApi = {
  async login(data: LoginPayload): Promise<AuthResponse> {
    const response = await axios.post(`${authBase}/login`, data, { withCredentials: true })
    return response.data
  },

  async logout(): Promise<void> {
    await axios.post(`${authBase}/logout`, {}, { withCredentials: true })
  },

  async checkEmail(email: string): Promise<CheckEmailResponse> {
    const response = await axios.post(
      `${authBase}/check-email`,
      { email },
      { withCredentials: true }
    )
    return response.data
  },

  async verifyPassword(data: VerifyPasswordPayload): Promise<AuthResponse> {
    const response = await axios.post(`${authBase}/verify-password`, data, {
      withCredentials: true
    })
    return response.data
  },

  async verifyOtp(data: VerifyOtpPayload): Promise<AuthResponse> {
    const response = await axios.post(`${authBase}/verify-otp`, data, {
      withCredentials: true
    })
    return response.data
  },

  async validateToken(_token?: string): Promise<ValidateTokenResponse> {
    void _token
    const response = await axios.get(`${authBase}/validate-token`, { withCredentials: true })
    return response.data
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await axios.post(`${authBase}/refresh-token`, {}, { withCredentials: true })
    return response.data
  },

  async forgotPassword(data: ForgotPasswordPayload): Promise<JsonRecord> {
    const response = await axios.post(`${APIDictionary.user}/forgot-password`, data)
    return response.data
  },

  async resetPassword(data: ResetPasswordPayload): Promise<JsonRecord> {
    const response = await axios.post(`${APIDictionary.user}/reset-password`, data)
    return response.data
  },

  async setPassword(data: SetPasswordPayload): Promise<JsonRecord> {
    const response = await axios.post(`${authBase}/set-password`, data, {
      withCredentials: true
    })
    return response.data
  },

  async verifyEmail(data: VerifyEmailPayload): Promise<JsonRecord> {
    const response = await axios.post(`${APIDictionary.user}/verify-email`, data)
    return response.data
  },

  async resendVerificationEmail(email: string): Promise<JsonRecord> {
    const response = await axios.post(`${APIDictionary.user}/resend-verification`, { email })
    return response.data
  }
}

export const publicApi = {
  async getPublicOrganizationInfo(domain?: string): Promise<PublicOrganizationInfo> {
    const endpoint = domain
      ? `${APIDictionary.Organization}/public?domain=${domain}`
      : `${APIDictionary.Organization}/public`
    const response = await axios.get(endpoint)
    return response.data.data || response.data
  },

  async getOnboardingFormInfo(token: string): Promise<JsonRecord> {
    const response = await axios.get(`${APIDictionary.onboarding}/form/${token}`)
    return response.data.data || response.data
  },

  async submitOnboardingForm(data: OnboardingFormData): Promise<JsonRecord> {
    const formData = new FormData()

    formData.append('token', data.token)
    formData.append('personalInfo', JSON.stringify(data.personalInfo))
    formData.append('professionalInfo', JSON.stringify(data.professionalInfo))

    if (data.bankDetails) {
      formData.append('bankDetails', JSON.stringify(data.bankDetails))
    }

    if (data.emergencyContact) {
      formData.append('emergencyContact', JSON.stringify(data.emergencyContact))
    }

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

  async checkOnboardingTokenValidity(
    token: string
  ): Promise<{ valid: boolean; expired: boolean }> {
    const response = await axios.get(`${APIDictionary.onboarding}/validate/${token}`)
    return response.data
  },

  async getPublicData(type: string): Promise<JsonRecord[]> {
    const response = await axios.get(`${APIDictionary.Organization}/public/${type}`)
    return response.data.data || response.data
  }
}
