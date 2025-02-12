export interface User {
  id: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  email: string;
  monthlySalary: number;
}

export interface SalaryRecord {
  id: string;
  userId: string;
  year: number;
  month: number;
  basicSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  tax: number;
  netSalary: number;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'PAID' | 'FAILED';
}
