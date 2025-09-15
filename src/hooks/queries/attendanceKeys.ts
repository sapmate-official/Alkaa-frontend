// Query Keys for Attendance
export const attendanceKeys = {
  all: ['attendance'] as const,
  sessions: (date: string) => [...attendanceKeys.all, 'sessions', date] as const,
  history: (filters?: any) => [...attendanceKeys.all, 'history', filters] as const,
  pastDays: () => [...attendanceKeys.all, 'past-days'] as const,
  livePanel: () => [...attendanceKeys.all, 'live-panel'] as const,
  verification: () => [...attendanceKeys.all, 'verification'] as const,
}
