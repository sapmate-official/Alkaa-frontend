export interface BreakRule {
  id: string
  breakType: string
  maxDuration: number
  maxFrequency?: number | null
  timeWindow?: Record<string, unknown> | null
  mandatory: boolean
  requiresApproval: boolean
  penaltyPerMinute?: number | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  orderIndex?: number | null
}

export interface AttendanceRuleThreshold {
  minutes?: number | null
  occurrences?: number | null
  graceMinutes?: number | null
}

export interface AttendanceRulePenalty {
  type: string
  value: number
  unit?: string | null
  notes?: string | null
}

export interface AttendanceRule {
  id: string
  ruleType: string
  threshold: AttendanceRuleThreshold
  penalty: AttendanceRulePenalty
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface OvertimeRule {
  id: string
  name: string
  description?: string | null
  rate: number | null
  applyAfterMinutes: number
  maxDailyMinutes?: number | null
  metadata?: Record<string, unknown> | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ShiftTemplate {
  id: string
  orgId: string
  name: string
  startTime: string
  endTime: string
  totalHours: string | number
  lateThreshold: number
  breakConfiguration?: BreakRule[] | null
  overtimeRules?: OvertimeRule | null
  attendanceRules?: AttendanceRule[] | null
  breakRules?: BreakRule[] | null
  attendanceRuleDetails?: AttendanceRule[] | null
  overtimeRuleDetails?: OvertimeRule | null
  selectedBreakRuleIds?: string[]
  selectedAttendanceRuleIds?: string[]
  selectedOvertimeRuleId?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type ShiftStatus = 'ACTIVE' | 'INACTIVE' | 'TEMPORARY'

export interface EmployeeShift {
  id: string
  userId: string
  shiftTemplateId: string
  effectiveDate: string
  endDate?: string | null
  status: ShiftStatus
  overrides?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
  shiftTemplate?: ShiftTemplate
}
