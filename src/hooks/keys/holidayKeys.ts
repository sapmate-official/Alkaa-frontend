// Query Keys for Holiday-related queries
export const holidayKeys = {
  all: ['holidays'] as const,
  lists: () => [...holidayKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...holidayKeys.lists(), { filters }] as const,
  details: () => [...holidayKeys.all, 'detail'] as const,
  detail: (id: string) => [...holidayKeys.details(), id] as const,
  calendar: (year?: number, month?: number) => [...holidayKeys.all, 'calendar', { year, month }] as const,
  upcoming: () => [...holidayKeys.all, 'upcoming'] as const,
  byOrg: (orgId: string) => [...holidayKeys.all, 'organization', orgId] as const,
}

export const holidayTypeKeys = {
  all: ['holidayTypes'] as const,
  lists: () => [...holidayTypeKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...holidayTypeKeys.lists(), { filters }] as const,
  details: () => [...holidayTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...holidayTypeKeys.details(), id] as const,
  byOrg: (orgId: string) => [...holidayTypeKeys.all, 'organization', orgId] as const,
}
