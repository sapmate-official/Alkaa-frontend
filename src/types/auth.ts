export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
  organizationId?: string
  orgId?: string
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
  organizationId?: string
  orgId?: string
}

export interface VerifyOtpRequest {
  email?: string
  otp: string
  type?: 'LOGIN' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION'
  sessionToken?: string
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
