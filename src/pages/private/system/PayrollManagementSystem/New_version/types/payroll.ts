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

export interface PayrollCycle {
  id: string;
  month: number;
  year: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW_PENDING' | 'APPROVED' | 'CANCELLED' | 'FAILED';
  totalEmployees: number;
  processedCount: number;
  failedCount: number;
  totalAmount: number;
  startedAt?: string;
  completedAt?: string;
  approvedAt?: string;
  processor?: {
    firstName: string;
    lastName: string;
  };
  approver?: {
    firstName: string;
    lastName: string;
  };
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
  status: 'PENDING' | 'PROCESSED' | 'APPROVED' | 'REJECTED' | 'PAID';
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
  department: {
    name: string;
  };
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
  id: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  createdAt: string;
  updatedAt: string;
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
  processedAt?: string;
  downloadUrl?: string;
}

export interface SalaryDispute {
  id: string;
  salaryRecordId: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}
