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
