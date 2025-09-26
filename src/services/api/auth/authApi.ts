import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'

export const authApi = {
  async checkEmail(email: string): Promise<any> {
    const response = await axios.post(APIDictionary.discoverOrganizations, { email });
    const organizations = response.data?.organizations ?? [];

    // Provide backwards-compatible shape for legacy consumers
    const primaryOrg = organizations.length === 1 ? organizations[0] : undefined;
    return {
      exists: organizations.length > 0,
      isVerified: organizations.some((org: any) => org.userStatus === 'active' || org.userStatus === 'ACTIVE'),
      hasPassword: true,
      organization: primaryOrg
        ? {
            id: primaryOrg.orgId ?? primaryOrg.id ?? '',
            name: primaryOrg.orgName ?? primaryOrg.name ?? '',
            domain: primaryOrg.domain ?? ''
          }
        : undefined,
      organizations
    };
  },

  async login(data: any): Promise<any> {
    const { email, password, orgId, organizationId } = data;
    const resolvedOrgId = orgId ?? organizationId;

    if (!resolvedOrgId) {
      throw new Error('organizationId is required for multi-tenant login');
    }

    const response = await axios.post(APIDictionary.verifyCredentials, {
      email,
      password,
      orgId: resolvedOrgId
    });

    return response.data;
  },

  async logout(): Promise<void> {
    await axios.post(APIDictionary.logout, {}, { withCredentials: true })
  },

  async validateToken(token: string): Promise<any> {
    const response = await axios.post(APIDictionary.validateToken, { token })
    return response.data
  },

  async refreshToken(): Promise<any> {
    const response = await axios.post(APIDictionary.refreshToken, {}, { withCredentials: true })
    return response.data
  },

  async verifyPassword(data: any): Promise<any> {
    const { email, password, orgId, organizationId } = data;
    const response = await axios.post(APIDictionary.verifyCredentials, {
      email,
      password,
      orgId: orgId ?? organizationId
    });
    return response.data;
  },

  async verifyOtp(data: any): Promise<any> {
    const { sessionToken, otp } = data;
    const response = await axios.post(APIDictionary.verifyLoginOtp, {
      sessionToken,
      otp
    });
    return response.data;
  },

  async forgotPassword(data: any): Promise<any> {
    const response = await axios.post(`${APIDictionary.user}/forgot-password`, data)
    return response.data
  },

  async resetPassword(data: any): Promise<any> {
    const response = await axios.post(`${APIDictionary.user}/reset-password`, data)
    return response.data
  },

  async setPassword(data: any): Promise<any> {
    const response = await axios.post(APIDictionary.setPassword, data)
    return response.data
  },

  async verifyEmail(data: any): Promise<any> {
    const response = await axios.post(`${APIDictionary.user}/verify-email`, data)
    return response.data
  },

  async resendVerificationEmail(email: string): Promise<any> {
    const response = await axios.post(`${APIDictionary.user}/resend-verification`, { email })
    return response.data
  }
}

export const publicApi = {
  async getPublicOrganizationInfo(domain?: string): Promise<any> {
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

  async submitOnboardingForm(data: any): Promise<any> {
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
        if (file && (file instanceof File || file instanceof Blob)) {
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

  async checkOnboardingTokenValidity(token: string): Promise<any> {
    const response = await axios.get(`${APIDictionary.onboarding}/validate/${token}`)
    return response.data
  },

  async getPublicData(type: string): Promise<any[]> {
    const response = await axios.get(`${APIDictionary.Organization}/public/${type}`)
    return response.data.data || response.data
  }
}
