const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const primaryBackend =
  import.meta.env.VITE_BACKEND_DOMAIN?.trim() || 'http://localhost:5001'

const legacyBackend =
  import.meta.env.VITE_LEGACY_BACKEND_DOMAIN?.trim() || 'http://localhost:3000'

// New TypeScript backend (auth + organization modules and counting).
export const backendDomain = trimTrailingSlash(primaryBackend)

// Legacy backend retained for modules that have not been ported yet
// (attendance, payroll, billing, departments, tasks, ...).
export const legacyBackendDomain = trimTrailingSlash(legacyBackend)
