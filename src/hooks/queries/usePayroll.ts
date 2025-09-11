import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/api/v2/APIdict'

// Types
export interface PayrollRecord {
  id: string
  userId: string
  month: number
  year: number
  baseSalary: number
  allowances: number
  deductions: number
  overtime: number
  bonus: number
  grossPay: number
  netPay: number
  tax: number
  providentFund: number
  insurance: number
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED'
  generatedAt: string
  processedAt?: string
  paidAt?: string
  processedBy?: string
  approvedBy?: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    employeeId?: string
  }
  payrollParameters?: PayrollParameters
  paymentTransaction?: PaymentTransaction
}

export interface PayrollParameters {
  id: string
  userId: string
  baseSalary: number
  allowances: PayrollAllowance[]
  deductions: PayrollDeduction[]
  overtimeRate: number
  isActive: boolean
  effectiveFrom: string
  effectiveTo?: string
  createdAt: string
  updatedAt: string
}

export interface PayrollAllowance {
  id: string
  name: string
  amount: number
  type: 'FIXED' | 'PERCENTAGE'
  isActive: boolean
}

export interface PayrollDeduction {
  id: string
  name: string
  amount: number
  type: 'FIXED' | 'PERCENTAGE'
  isActive: boolean
}

export interface PaymentTransaction {
  id: string
  payrollId: string
  amount: number
  transactionType: 'SALARY' | 'BONUS' | 'ADVANCE' | 'DEDUCTION'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'UPI'
  transactionDate: string
  referenceNumber?: string
  bankDetails?: {
    accountNumber: string
    bankName: string
    ifscCode: string
  }
  notes?: string
  processedBy?: string
  createdAt: string
  updatedAt: string
}

export interface SalaryRecord {
  id: string
  userId: string
  month: number
  year: number
  exists: boolean
  status?: string
  generatedAt?: string
}

export interface PayrollStats {
  totalEmployees: number
  processedPayrolls: number
  pendingPayrolls: number
  totalPayrollAmount: number
  averageSalary: number
  monthlyComparison: {
    current: number
    previous: number
    percentageChange: number
  }
}

export interface CreatePayrollRequest {
  userId: string
  month: number
  year: number
  baseSalary?: number
  allowances?: number
  deductions?: number
  overtime?: number
  bonus?: number
}

export interface UpdatePayrollRequest {
  baseSalary?: number
  allowances?: number
  deductions?: number
  overtime?: number
  bonus?: number
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED'
}

export interface ProcessPayrollRequest {
  payrollIds: string[]
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'UPI'
  notes?: string
}

export interface UpdatePayrollParametersRequest {
  baseSalary?: number
  allowances?: PayrollAllowance[]
  deductions?: PayrollDeduction[]
  overtimeRate?: number
  effectiveFrom?: string
  effectiveTo?: string
}

// Query Keys
export const payrollKeys = {
  all: ['payroll'] as const,
  lists: () => [...payrollKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...payrollKeys.lists(), { filters }] as const,
  details: () => [...payrollKeys.all, 'detail'] as const,
  detail: (id: string) => [...payrollKeys.details(), id] as const,
  userPayrolls: (userId: string) => [...payrollKeys.all, 'user', userId] as const,
  userPayroll: (userId: string, month: number, year: number) => [...payrollKeys.userPayrolls(userId), month, year] as const,
  stats: (userId?: string) => [...payrollKeys.all, 'stats', userId || 'all'] as const,
  parameters: (userId: string) => [...payrollKeys.all, 'parameters', userId] as const,
  salaryRecord: (userId: string, month: number, year: number) => [...payrollKeys.all, 'salaryRecord', userId, month, year] as const,
  transactions: () => [...payrollKeys.all, 'transactions'] as const,
  transaction: (id: string) => [...payrollKeys.transactions(), id] as const,
}

// API Functions
const payrollApi = {
  async getAllPayrolls(filters?: Record<string, any>): Promise<PayrollRecord[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.payroll}?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getPayrollById(id: string): Promise<PayrollRecord> {
    const response = await axios.get(`${APIDictionary.payroll}/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getUserPayrolls(userId: string): Promise<PayrollRecord[]> {
    const response = await axios.get(APIDictionary.get_payroll(userId), { withCredentials: true })
    return response.data.data || response.data
  },

  async getPayrollStats(userId?: string): Promise<PayrollStats> {
    const endpoint = userId ? APIDictionary.get_payroll_stats(userId) : `${APIDictionary.payroll}/stats`
    const response = await axios.get(endpoint, { withCredentials: true })
    return response.data.data || response.data
  },

  async getPayrollParameters(userId: string): Promise<PayrollParameters> {
    const response = await axios.get(APIDictionary.payrollParameters(userId), { withCredentials: true })
    return response.data.data || response.data
  },

  async updatePayrollParameters(userId: string, data: UpdatePayrollParametersRequest): Promise<PayrollParameters> {
    const response = await axios.put(APIDictionary.payrollParameters(userId), data, { withCredentials: true })
    return response.data.data || response.data
  },

  async checkSalaryRecordExistence(userId: string, month: number, year: number): Promise<SalaryRecord> {
    const response = await axios.get(APIDictionary.SalaryRecordExistence(userId, month, year), { withCredentials: true })
    return response.data.data || response.data
  },

  async createPayroll(data: CreatePayrollRequest): Promise<PayrollRecord> {
    const response = await axios.post(APIDictionary.payroll, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updatePayroll(id: string, data: UpdatePayrollRequest): Promise<PayrollRecord> {
    const response = await axios.put(`${APIDictionary.payroll}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deletePayroll(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.payroll}/${id}`, { withCredentials: true })
  },

  async generatePayroll(userId: string, month: number, year: number): Promise<PayrollRecord> {
    const response = await axios.post(`${APIDictionary.payroll}/generate`, {
      userId,
      month,
      year
    }, { withCredentials: true })
    return response.data.data || response.data
  },

  async bulkGeneratePayroll(userIds: string[], month: number, year: number): Promise<PayrollRecord[]> {
    const response = await axios.post(`${APIDictionary.payroll}/bulk-generate`, {
      userIds,
      month,
      year
    }, { withCredentials: true })
    return response.data.data || response.data
  },

  async approvePayroll(id: string): Promise<PayrollRecord> {
    const response = await axios.patch(`${APIDictionary.payroll}/${id}/approve`, {}, { withCredentials: true })
    return response.data.data || response.data
  },

  async rejectPayroll(id: string, reason?: string): Promise<PayrollRecord> {
    const response = await axios.patch(`${APIDictionary.payroll}/${id}/reject`, { reason }, { withCredentials: true })
    return response.data.data || response.data
  },

  async processPayroll(data: ProcessPayrollRequest): Promise<PaymentTransaction[]> {
    const response = await axios.post(`${APIDictionary.payroll}/process`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async getPaymentTransactions(filters?: Record<string, any>): Promise<PaymentTransaction[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.payroll}/transactions?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getPaymentTransaction(id: string): Promise<PaymentTransaction> {
    const response = await axios.get(`${APIDictionary.payroll}/transactions/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateTransactionStatus(id: string, status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED', notes?: string): Promise<PaymentTransaction> {
    const response = await axios.patch(`${APIDictionary.payroll}/transactions/${id}/status`, {
      status,
      notes
    }, { withCredentials: true })
    return response.data.data || response.data
  },

  async exportPayrollReport(month: number, year: number, format: 'PDF' | 'EXCEL' = 'PDF'): Promise<Blob> {
    const response = await axios.get(`${APIDictionary.payroll}/export`, {
      params: { month, year, format },
      responseType: 'blob',
      withCredentials: true
    })
    return response.data
  },

  async exportPayslip(payrollId: string): Promise<Blob> {
    const response = await axios.get(`${APIDictionary.payroll}/${payrollId}/payslip`, {
      responseType: 'blob',
      withCredentials: true
    })
    return response.data
  }
}

// Query Hooks
export function usePayrolls(filters?: Record<string, any>) {
  return useQuery<PayrollRecord[]>({
    queryKey: payrollKeys.list(filters || {}),
    queryFn: () => payrollApi.getAllPayrolls(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function usePayroll(id: string) {
  return useQuery<PayrollRecord>({
    queryKey: payrollKeys.detail(id),
    queryFn: () => payrollApi.getPayrollById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export function useUserPayrolls(userId: string) {
  return useQuery<PayrollRecord[]>({
    queryKey: payrollKeys.userPayrolls(userId),
    queryFn: () => payrollApi.getUserPayrolls(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePayrollStats(userId?: string) {
  return useQuery<PayrollStats>({
    queryKey: payrollKeys.stats(userId),
    queryFn: () => payrollApi.getPayrollStats(userId),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePayrollParameters(userId: string) {
  return useQuery<PayrollParameters>({
    queryKey: payrollKeys.parameters(userId),
    queryFn: () => payrollApi.getPayrollParameters(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes - parameters change less frequently
  })
}

export function useSalaryRecordExistence(userId: string, month: number, year: number) {
  return useQuery<SalaryRecord>({
    queryKey: payrollKeys.salaryRecord(userId, month, year),
    queryFn: () => payrollApi.checkSalaryRecordExistence(userId, month, year),
    enabled: !!userId && !!month && !!year,
    staleTime: 10 * 60 * 1000,
  })
}

export function usePaymentTransactions(filters?: Record<string, any>) {
  return useQuery<PaymentTransaction[]>({
    queryKey: payrollKeys.transactions(),
    queryFn: () => payrollApi.getPaymentTransactions(filters),
    staleTime: 2 * 60 * 1000,
  })
}

export function usePaymentTransaction(id: string) {
  return useQuery<PaymentTransaction>({
    queryKey: payrollKeys.transaction(id),
    queryFn: () => payrollApi.getPaymentTransaction(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

// Mutation Hooks
export function useCreatePayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: payrollApi.createPayroll,
    onSuccess: (newPayroll) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.userPayrolls(newPayroll.userId) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() })
    },
  })
}

export function useUpdatePayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePayrollRequest }) =>
      payrollApi.updatePayroll(id, data),
    onSuccess: (updatedPayroll, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.userPayrolls(updatedPayroll.userId) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() })
    },
  })
}

export function useDeletePayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: payrollApi.deletePayroll,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: payrollKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() })
    },
  })
}

export function useUpdatePayrollParameters() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdatePayrollParametersRequest }) =>
      payrollApi.updatePayrollParameters(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.parameters(userId) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.userPayrolls(userId) })
    },
  })
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, month, year }: { userId: string; month: number; year: number }) =>
      payrollApi.generatePayroll(userId, month, year),
    onSuccess: (newPayroll) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.userPayrolls(newPayroll.userId) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.salaryRecord(newPayroll.userId, newPayroll.month, newPayroll.year) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() })
    },
  })
}

export function useBulkGeneratePayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userIds, month, year }: { userIds: string[]; month: number; year: number }) =>
      payrollApi.bulkGeneratePayroll(userIds, month, year),
    onSuccess: (_, { userIds, month, year }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() })
      // Invalidate user payrolls for all affected users
      userIds.forEach(userId => {
        queryClient.invalidateQueries({ queryKey: payrollKeys.userPayrolls(userId) })
        queryClient.invalidateQueries({ queryKey: payrollKeys.salaryRecord(userId, month, year) })
      })
    },
  })
}

export function useApprovePayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: payrollApi.approvePayroll,
    onSuccess: (approvedPayroll, id) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.userPayrolls(approvedPayroll.userId) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() })
    },
  })
}

export function useRejectPayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      payrollApi.rejectPayroll(id, reason),
    onSuccess: (rejectedPayroll, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.userPayrolls(rejectedPayroll.userId) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() })
    },
  })
}

export function useProcessPayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: payrollApi.processPayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.transactions() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() })
    },
  })
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'; notes?: string }) =>
      payrollApi.updateTransactionStatus(id, status, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.transaction(id) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.transactions() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.stats() })
    },
  })
}

export function useExportPayrollReport() {
  return useMutation({
    mutationFn: ({ month, year, format }: { month: number; year: number; format?: 'PDF' | 'EXCEL' }) =>
      payrollApi.exportPayrollReport(month, year, format),
  })
}

export function useExportPayslip() {
  return useMutation({
    mutationFn: payrollApi.exportPayslip,
  })
}
