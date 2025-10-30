// Employment Type Enums and Interfaces for Alkaa Web Frontend

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  INTERN = 'INTERN',
  CONTRACT = 'CONTRACT',
  CONSULTANT = 'CONSULTANT',
}

export interface EmploymentTypePolicy {
  id: string;
  orgId: string;
  employmentType: EmploymentType;
  overrideAttendanceHours: boolean;
  attendanceConfig?: {
    dailyMinimum?: number;
    dailyMaximum?: number;
    weeklyMinimum?: number;
    weeklyMaximum?: number;
    breakDuration?: number;
  };
  overrideLeaveEligibility: boolean;
  leaveConfig?: {
    leaveEnabled: boolean;
    maxLeaveDays?: number;
  };
  overrideBreakRules: boolean;
  breakConfig?: Record<string, any>;
  overridePayrollRules: boolean;
  payrollConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeByType {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  employmentType: EmploymentType;
  contractEndDate?: string;
  isActive: boolean;
}

export interface ExpiringContract {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  employmentType: EmploymentType;
  contractEndDate: string;
  daysRemaining: number;
}

export interface RuleDetail {
  overridden: boolean;
  source: string;
  config?: any;
  eligible?: boolean;
}

export interface UserRulesSummary {
  userId: string;
  employmentType: EmploymentType;
  contractEndDate?: string;
  rules: {
    attendance: RuleDetail;
    leave: RuleDetail;
    break: RuleDetail;
    payroll: RuleDetail;
  };
}

// Color constants for employment types
export const EMPLOYMENT_TYPE_COLORS: Record<EmploymentType, string> = {
  [EmploymentType.FULL_TIME]: '#3B82F6',   // Blue
  [EmploymentType.PART_TIME]: '#EAB308',   // Yellow
  [EmploymentType.INTERN]: '#22C55E',      // Green
  [EmploymentType.CONTRACT]: '#A855F7',    // Purple
  [EmploymentType.CONSULTANT]: '#F97316',  // Orange
};

// Display labels for employment types
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  [EmploymentType.FULL_TIME]: 'Full-Time',
  [EmploymentType.PART_TIME]: 'Part-Time',
  [EmploymentType.INTERN]: 'Intern',
  [EmploymentType.CONTRACT]: 'Contract',
  [EmploymentType.CONSULTANT]: 'Consultant',
};

// Badge abbreviations for compact display
export const EMPLOYMENT_TYPE_BADGES: Record<EmploymentType, string> = {
  [EmploymentType.FULL_TIME]: 'FT',
  [EmploymentType.PART_TIME]: 'PT',
  [EmploymentType.INTERN]: 'IN',
  [EmploymentType.CONTRACT]: 'CT',
  [EmploymentType.CONSULTANT]: 'CO',
};
