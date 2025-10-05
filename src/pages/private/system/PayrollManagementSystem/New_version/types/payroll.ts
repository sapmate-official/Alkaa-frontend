export type PayrollPhase = 'setup' | 'cycle' | 'review' | 'reporting' | 'employee';

export interface WorkflowStep {
  id: string;
  phase: PayrollPhase;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignedTo: 'admin' | 'manager' | 'employee' | 'system';
  dependencies?: string[];
  estimatedTime?: string;
  completedAt?: string;
}

export interface WorkflowStatus {
  currentPhase: PayrollPhase | string;
  overallProgress: number;
  activeSteps: WorkflowStep[];
  completedSteps: WorkflowStep[];
  blockedSteps: WorkflowStep[];
}

export type PayrollPayoutStatus = 'NOT_STARTED' | 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface PayrollPayoutProgress {
  totalRecords: number;
  completedRecords: number;
  logicalRecords: number;
  initiatedRecords: number;
  pendingRecords: number;
  failedRecords: number;
  remainingRecords: number;
  inFlightRecords: number;
  percentComplete: number;
  percentRemaining: number;
  updatedAt?: string;
  byStatus: {
    completed: number;
    logical: number;
    initiated: number;
    pending: number;
    failed: number;
  };
  flags: {
    hasRemaining: boolean;
    canContinue: boolean;
    isComplete: boolean;
    isInitiated: boolean;
    isNotStarted: boolean;
  };
}

export interface PayrollPayoutSummary {
  totals: Record<'PENDING' | 'INITIATED' | 'COMPLETED' | 'FAILED' | 'NO_PAYOUT_REQUIRED', number>;
  totalRecords: number;
  totalAmount: number;
  sums: {
    netSalary: number;
    incentive: number;
    bonus: number;
  };
  latestPayment?: {
    id: string;
    amount: number;
    createdAt: string;
  } | null;
  refreshedAt: string;
  progress?: PayrollPayoutProgress;
}

export interface PayrollCycle {
  id: string;
  month: number;
  year: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  totalEmployees: number;
  processedCount: number;
  failedCount: number;
  totalAmount: number;
  payoutStatus?: PayrollPayoutStatus;
  payoutInitiatedAt?: string | null;
  payoutCompletedAt?: string | null;
  payoutInitiatedBy?: string | null;
  payoutSummary?: PayrollPayoutSummary | null;
  startedAt?: string;
  completedAt?: string;
  approvedAt?: string;
  templateId?: string;
  processor?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  approver?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}

export interface PayrollCycleDetails extends PayrollCycle {
  organization?: {
    name?: string | null;
  } | null;
  template?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  processor?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  approver?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  salaryRecords: Array<{
    id: string;
    basicSalary: number;
    netSalary: number;
    status: PayrollRecord['status'];
  paymentStatus?: PayrollRecord['paymentStatus'];
    processedAt?: string;
    reviewedAt?: string;
    reviewComments?: string | null;
    allowances?: Record<string, number> | null;
    deductions?: Record<string, number> | null;
    templateId?: string | null;
    templateName?: string | null;
    previousNetSalary?: number | null;
    calculationDetails?: Array<{
      type: 'earning' | 'deduction' | 'tax' | 'contribution' | 'adjustment';
      label: string;
      amount: number;
      description?: string | null;
      formula?: string | null;
      metadata?: Record<string, unknown>;
    }>;
    attendanceSummary?: {
      totalDays?: number;
      workingDays?: number;
      presentDays?: number;
      halfDays?: number;
      absentDays?: number;
      paidLeaveDays?: number;
      unpaidLeaveDays?: number;
      overtimeHours?: number;
      lateMarks?: number;
      regularizationCount?: number;
      rawEntries?: Array<{
        id?: string;
        date: string;
        status?: string;
        checkIn?: string | null;
        checkOut?: string | null;
        durationHours?: number;
        notes?: string | null;
        source?: string | null;
        leaveType?: string | null;
      }>;
    } | null;
    user: {
      id?: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      employeeId?: string | null;
      department?: {
        name?: string | null;
      } | null;
    };
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    createdAt: string;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
    } | null;
    previousData?: unknown;
    newData?: unknown;
  }>;
}

export interface PayrollStatistics {
  year: number;
  totalCycles: number;
  completedCycles: number;
  pendingCycles: number;
  failedCycles: number;
  totalAmountPaid: number;
  totalEmployeesProcessed: number;
  monthlyBreakdown: Array<{
    month: number;
    status: string;
    amount: number;
    employees: number;
  }>;
}

export interface PayrollCycleDeletionResult {
  deletedCycle: PayrollCycle;
  counts: {
    salaryRecords: number;
    salaryTransactionLinks: number;
    salaryDisputes: number;
    payrollAudits: number;
    payrollCycleAudits: number;
    workflowSteps: number;
  };
  jobCancelled: boolean;
  deletedBy: string;
}

export interface PayrollRecord {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
  };
  month: number;
  year: number;
  basicSalary: number;
  netSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  status: 'PENDING' | 'PROCESSING' | 'IN_PROGRESS' | 'PROCESSED' | 'APPROVED' | 'REJECTED' | 'FAILED' | 'PAID';
  paymentStatus?: 'PENDING' | 'INITIATED' | 'COMPLETED' | 'FAILED' | 'NO_PAYOUT_REQUIRED';
  processedAt?: string;
  reviewedAt?: string;
  reviewComments?: string;
  anomalies?: Array<{
    type: 'warning' | 'error';
    field: string;
    message: string;
  }>;
}

export interface TeamStatistics {
  totalEmployees: number;
  pendingReviews: number;
  approvedCount: number;
  rejectedCount: number;
  totalPayrollAmount: number;
  averageSalary: number;
}

export interface SalaryTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  rules: {
    basicSalary: {
      type: 'fixed' | 'percentage';
      value: number;
    };
    allowances: Array<{
      name: string;
      type: 'fixed' | 'percentage';
      value: number;
      taxable: boolean;
    }>;
    deductions: Array<{
      name: string;
      type: 'fixed' | 'percentage';
      value: number;
      mandatory: boolean;
    }>;
    overtimeRules: {
      enabled: boolean;
      multiplier: number;
      threshold: number;
    };
    taxRules: {
      enabled: boolean;
      brackets: Array<{
        min: number;
        max: number;
        rate: number;
      }>;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CalculationRule {
  id: string;
  name: string;
  formula: string;
  type: 'allowance' | 'deduction' | 'tax';
  isActive: boolean;
}

export interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber?: string;
  employeeId: string;
  department?: {
    name?: string;
  } | null;
  manager?: {
    firstName: string;
    lastName: string;
  };
  hiredDate?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
}

export interface BankDetails {
  id?: string;
  accountHolder?: string;
  accountHolderName?: string;
  accountNumber?: string;
  maskedAccountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  accountType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayslipPreview {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  netSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  paymentStatus?: 'PENDING' | 'INITIATED' | 'COMPLETED' | 'FAILED' | 'NO_PAYOUT_REQUIRED';
  processedAt?: string;
  downloadUrl?: string;
}

export interface SalaryDispute {
  id: string;
  salaryRecordId: string;
  userId?: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolutionNote?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string | null;
  salaryRecord?: {
    id: string;
    month: number;
    year: number;
    netSalary: number;
    status: PayrollRecord['status'] | string;
    processedAt?: string | null;
    cycleId?: string | null;
  } | null;
  cycle?: {
    id: string;
    month: number;
    year: number;
    status: PayrollCycle['status'] | string;
  } | null;
  employee?: {
    id?: string | null;
    employeeId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    department?: string | null;
    manager?: {
      id?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  } | null;
}

export interface PayrollCycleProcessingError {
  employeeId?: string;
  employeeName?: string;
  error?: string;
}

export interface PayrollCycleProgressSnapshot {
  processedCount: number;
  failedCount: number;
  totalAmount: number;
  totalEmployees: number;
  percentComplete?: number;
  elapsedMs?: number;
  durationMs?: number;
  etaMs?: number | null;
  updatedAt?: string;
  generatedAt?: string;
  completedAt?: string;
  lastEmployeeId?: string;
  lastSalaryRecordId?: string;
  message?: string;
}

export interface PayrollCycleProcessingStatusResponse {
  cycle: {
    id: string;
    status: PayrollCycle['status'];
    startedAt?: string | null;
    completedAt?: string | null;
    processedCount: number;
    failedCount: number;
    totalEmployees: number;
    totalAmount: number;
    updatedAt?: string;
    processingSummary?: PayrollCycleProgressSnapshot | null;
    errors?: PayrollCycleProcessingError[];
  };
  progress?: PayrollCycleProgressSnapshot | null;
  job?: {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    attempts: number;
    maxAttempts: number;
    scheduledFor: string;
    completedAt?: string | null;
    error?: string | null;
    priority: number;
    updatedAt: string;
  } | null;
}
