const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const primaryBackend =
  import.meta.env.VITE_BACKEND_DOMAIN?.trim() || 'http://localhost:5001'

/**
 * Unified TypeScript Backend Domain (canonical API boundary)
 * Powers auth, employees, attendance, leaves, payroll, billing, settings, etc.
 */
export const backendDomain = trimTrailingSlash(primaryBackend)

/**
 * @deprecated The split-backend architecture has been removed. All routes run on alkaa-backend-ts.
 * Use `backendDomain` or the unified `apiClient` instead.
 */
export const legacyBackendDomain = backendDomain
