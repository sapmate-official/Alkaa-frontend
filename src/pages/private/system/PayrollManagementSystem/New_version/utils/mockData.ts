import {
  BankDetails,
  CalculationRule,
  EmployeeProfile,
  PayrollCycle,
  PayrollRecord,
  PayrollStatistics,
  PayslipPreview,
  SalaryDispute,
  SalaryTemplate,
  TeamStatistics,
  WorkflowStatus
} from '../types/payroll';

const currentYear = new Date().getFullYear();

export const mockWorkflowStatus: WorkflowStatus = {
  currentPhase: 'setup',
  overallProgress: 24,
  activeSteps: [
    {
      id: 'setup-templates',
      phase: 'setup',
      title: 'Finalize Salary Templates',
      description: 'Review pay structures and publish the default template for this cycle.',
      status: 'in-progress',
      assignedTo: 'admin',
      estimatedTime: '2h'
    },
    {
      id: 'attendance-sync',
      phase: 'cycle',
      title: 'Attendance Sync Verification',
      description: 'Confirm attendance data for all departments is ready for payroll run.',
      status: 'pending',
      assignedTo: 'manager'
    }
  ],
  completedSteps: [
    {
      id: 'cycle-init',
      phase: 'cycle',
      title: 'Cycle Created',
      description: 'Monthly payroll cycle created with default template assignments.',
      status: 'completed',
      assignedTo: 'system',
      completedAt: new Date().toISOString()
    }
  ],
  blockedSteps: []
};

export const mockPayrollStatistics: PayrollStatistics = {
  year: currentYear,
  totalCycles: 9,
  completedCycles: 8,
  pendingCycles: 1,
  failedCycles: 0,
  totalAmountPaid: 128_40_000,
  totalEmployeesProcessed: 240,
  monthlyBreakdown: Array.from({ length: 6 }).map((_, index) => {
    const month = new Date().getMonth() + 1 - index;
    const normalizedMonth = month > 0 ? month : 12 + month;
    return {
      month: normalizedMonth,
      status: index === 0 ? 'REVIEW_PENDING' : 'APPROVED',
      amount: 18_50_000 - index * 65_000,
      employees: 40
    };
  })
};

export const mockPayrollCycles: PayrollCycle[] = [
  {
    id: 'cycle-2025-03',
    month: 3,
    year: currentYear,
    status: 'REVIEW_PENDING',
    totalEmployees: 42,
    processedCount: 42,
    failedCount: 0,
    totalAmount: 16_80_000,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  },
  {
    id: 'cycle-2025-02',
    month: 2,
    year: currentYear,
    status: 'APPROVED',
    totalEmployees: 40,
    processedCount: 40,
    failedCount: 1,
    totalAmount: 16_10_000,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    processor: { firstName: 'Anita', lastName: 'Sharma' },
    approver: { firstName: 'Rohit', lastName: 'Kumar' }
  }
];

export const mockReviewCycles: PayrollCycle[] = mockPayrollCycles.filter(
  (cycle) => cycle.status === 'REVIEW_PENDING'
);

export const mockManagerTeamStats: TeamStatistics = {
  totalEmployees: 18,
  pendingReviews: 2,
  approvedCount: 14,
  rejectedCount: 1,
  totalPayrollAmount: 7_80_000,
  averageSalary: 43_500
};

export const mockManagerPayrollRecords: PayrollRecord[] = [
  {
    id: 'record-1',
    employee: {
      id: 'emp-101',
      firstName: 'Ishan',
      lastName: 'Verma',
      employeeId: 'E-101',
      department: 'Sales'
    },
    month: new Date().getMonth() + 1,
    year: currentYear,
    basicSalary: 35_000,
    netSalary: 42_800,
    allowances: { HRA: 7000, Transport: 1800 },
    deductions: { PF: 2100, Tax: 1900 },
    status: 'PROCESSED',
    processedAt: new Date().toISOString(),
    anomalies: [
      {
        type: 'warning',
        field: 'attendance',
        message: 'Overtime exceeds monthly average by 35%'
      }
    ]
  },
  {
    id: 'record-2',
    employee: {
      id: 'emp-102',
      firstName: 'Neha',
      lastName: 'Patel',
      employeeId: 'E-102',
      department: 'Sales'
    },
    month: new Date().getMonth() + 1,
    year: currentYear,
    basicSalary: 32_000,
    netSalary: 39_400,
    allowances: { HRA: 6400, Fuel: 1500 },
    deductions: { PF: 1920, Tax: 1580 },
    status: 'APPROVED',
    processedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  }
];

export const mockSalaryTemplates: SalaryTemplate[] = [
  {
    id: 'template-default',
    name: 'Standard Corporate Template',
    description: 'Default salary structure for corporate employees',
    isDefault: true,
    isActive: true,
    rules: {
      basicSalary: { type: 'percentage', value: 50 },
      allowances: [
        { name: 'House Rent Allowance', type: 'percentage', value: 20, taxable: false },
        { name: 'Special Allowance', type: 'percentage', value: 15, taxable: true },
        { name: 'Internet Reimbursement', type: 'fixed', value: 1500, taxable: false }
      ],
      deductions: [
        { name: 'Provident Fund', type: 'percentage', value: 12, mandatory: true },
        { name: 'Professional Tax', type: 'fixed', value: 200, mandatory: true }
      ],
      overtimeRules: {
        enabled: true,
        multiplier: 1.5,
        threshold: 9
      },
      taxRules: {
        enabled: true,
        brackets: [
          { min: 0, max: 250000, rate: 0 },
          { min: 250001, max: 500000, rate: 5 },
          { min: 500001, max: 1000000, rate: 20 },
          { min: 1000001, max: Infinity, rate: 30 }
        ]
      }
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: 'template-consulting',
    name: 'Consulting Team Template',
    description: 'Consultants with higher performance incentives',
    isDefault: false,
    isActive: true,
    rules: {
      basicSalary: { type: 'percentage', value: 45 },
      allowances: [
        { name: 'Performance Bonus', type: 'percentage', value: 25, taxable: true },
        { name: 'Travel Allowance', type: 'fixed', value: 5000, taxable: false }
      ],
      deductions: [
        { name: 'Provident Fund', type: 'percentage', value: 10, mandatory: true }
      ],
      overtimeRules: {
        enabled: false,
        multiplier: 1,
        threshold: 0
      },
      taxRules: {
        enabled: true,
        brackets: [
          { min: 0, max: 250000, rate: 0 },
          { min: 250001, max: 500000, rate: 5 },
          { min: 500001, max: 1000000, rate: 20 },
          { min: 1000001, max: Infinity, rate: 30 }
        ]
      }
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString()
  }
];

export const mockCalculationRules: CalculationRule[] = [
  {
    id: 'rule-1',
    name: 'Car Lease Benefit',
    formula: 'baseSalary * 0.08',
    type: 'allowance',
    isActive: true
  },
  {
    id: 'rule-2',
    name: 'Night Shift Allowance',
    formula: 'fixed(2500)',
    type: 'allowance',
    isActive: true
  },
  {
    id: 'rule-3',
    name: 'Attendance Deduction',
    formula: 'dailyRate * missedDays',
    type: 'deduction',
    isActive: false
  }
];

export const mockEmployeeProfile: EmployeeProfile = {
  id: 'user-current',
  firstName: 'Priya',
  lastName: 'Nair',
  email: 'priya.nair@example.com',
  mobileNumber: '+91-9876543210',
  employeeId: 'E-210',
  department: { name: 'Product' },
  manager: { firstName: 'Rahul', lastName: 'Kulkarni' },
  hiredDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
  dateOfBirth: '1995-08-12',
  address: 'HSR Layout, Bengaluru',
  emergencyContact: '+91-9123456789'
};

export const mockBankDetails: BankDetails = {
  id: 'bank-01',
  accountHolder: 'Priya Nair',
  accountNumber: 'XXXXXX1234',
  ifscCode: 'HDFC0001234',
  bankName: 'HDFC Bank',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
};

export const mockPayslips: PayslipPreview[] = Array.from({ length: 4 }).map((_, index) => {
  const month = new Date().getMonth() + 1 - index;
  const normalizedMonth = month > 0 ? month : 12 + month;
  return {
    id: `slip-${normalizedMonth}`,
    month: normalizedMonth,
    year: month > 0 ? currentYear : currentYear - 1,
    basicSalary: 35_000,
    netSalary: 43_200,
    allowances: { HRA: 7000, SpecialAllowance: 5200 },
    deductions: { PF: 2100, Tax: 1900 },
    status: index === 0 ? 'PROCESSED' : 'PAID',
    processedAt: new Date(Date.now() - index * 1000 * 60 * 60 * 24 * 30).toISOString()
  };
});

export const mockDisputes: SalaryDispute[] = [
  {
    id: 'dispute-1',
    salaryRecordId: 'slip-2',
    reason: 'Incorrect overtime calculation',
    description: 'Overtime for weekend shift not reflected',
    status: 'UNDER_REVIEW',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString()
  }
];
