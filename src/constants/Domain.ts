const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const primaryBackend =
  import.meta.env.VITE_BACKEND_DOMAIN?.trim() || 'http://localhost:5001'

const legacyEnv = import.meta.env.VITE_LEGACY_BACKEND_DOMAIN?.trim()
// If unset or set to the former port 3000, seamlessly route to the unified TS backend (5001)
const legacyBackend =
  !legacyEnv || legacyEnv === 'http://localhost:3000'
    ? primaryBackend
    : legacyEnv

// Unified TypeScript backend (auth, org, attendance, payroll, billing, settings, etc.)
export const backendDomain = trimTrailingSlash(primaryBackend)
export const legacyBackendDomain = trimTrailingSlash(legacyBackend)
