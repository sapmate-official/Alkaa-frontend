import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/api/v2/APIdict'

// Types
export interface Bill {
  id: string
  organizationId: string
  planId: string
  amount: number
  currency: string
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
  dueDate: string
  paidDate?: string
  createdAt: string
  updatedAt: string
  organization: {
    id: string
    name: string
    email: string
  }
  plan: SubscriptionPlan
  invoice?: Invoice
  payments: Payment[]
  _count?: {
    payments: number
  }
}

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  features: PlanFeature[]
  isActive: boolean
  isDefault: boolean
  maxUsers: number
  maxStorage: number
  createdAt: string
  updatedAt: string
}

export interface PlanFeature {
  id: string
  name: string
  description?: string
  isIncluded: boolean
  limit?: number
  type: 'BOOLEAN' | 'NUMERIC' | 'TEXT'
}

export interface Invoice {
  id: string
  billId: string
  invoiceNumber: string
  amount: number
  tax: number
  discount: number
  totalAmount: number
  currency: string
  issuedDate: string
  dueDate: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  pdfUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
  lineItems: InvoiceLineItem[]
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  taxRate: number
  taxAmount: number
}

export interface Payment {
  id: string
  billId: string
  amount: number
  currency: string
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'UPI' | 'WALLET' | 'CASH'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  transactionId?: string
  gatewayResponse?: any
  failureReason?: string
  processedAt?: string
  createdAt: string
  updatedAt: string
  paymentGateway?: string
  refunds?: PaymentRefund[]
}

export interface PaymentRefund {
  id: string
  paymentId: string
  amount: number
  reason: string
  status: 'PENDING' | 'PROCESSED' | 'FAILED'
  processedAt?: string
  refundId?: string
  createdAt: string
}

export interface BillingStats {
  totalRevenue: number
  monthlyRevenue: number
  pendingAmount: number
  overdueAmount: number
  totalBills: number
  paidBills: number
  pendingBills: number
  overdueBills: number
  revenueGrowth: number
  paymentMethodStats: Record<string, number>
  planStats: Record<string, number>
}

export interface CreateBillRequest {
  organizationId: string
  planId: string
  amount?: number
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  dueDate?: string
}

export interface UpdateBillRequest {
  amount?: number
  dueDate?: string
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
}

export interface CreatePaymentRequest {
  billId: string
  amount: number
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'UPI' | 'WALLET' | 'CASH'
  paymentGateway?: string
  notes?: string
}

export interface ProcessPaymentRequest {
  paymentId: string
  transactionId?: string
  gatewayResponse?: any
  status: 'COMPLETED' | 'FAILED'
  failureReason?: string
}

export interface CreateInvoiceRequest {
  billId: string
  lineItems: Omit<InvoiceLineItem, 'id'>[]
  tax?: number
  discount?: number
  notes?: string
}

export interface UpdateInvoiceRequest {
  lineItems?: Omit<InvoiceLineItem, 'id'>[]
  tax?: number
  discount?: number
  notes?: string
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
}

export interface BillingDashboardData {
  organization: {
    name: string;
    subscriptionPlan: string;
    activeUsers: number;
    subscriptionStart: string;
    subscriptionEnd: string | null;
    daysRemaining: number | null;
    subscriptionStatus: string;
  };
  billing: {
    latestBill: any;
    totalBilledThisYear: number;
    totalUnpaid: number;
    unpaidCount: number;
  };
  billStatus: {
    unpaid: number;
    paid: number;
    overdue: number;
    total: number;
  };
  recentBills: any[];
}

// Query Keys
export const billingKeys = {
  all: ['billing'] as const,
  bills: () => [...billingKeys.all, 'bills'] as const,
  bill: (id: string) => [...billingKeys.bills(), id] as const,
  billsList: (filters: Record<string, any>) => [...billingKeys.bills(), 'list', { filters }] as const,
  orgBills: (orgId: string) => [...billingKeys.bills(), 'organization', orgId] as const,
  billingHistory: (filters: Record<string, any>) => [...billingKeys.bills(), 'history', { filters }] as const,
  invoice: (billId: string) => [...billingKeys.all, 'invoice', billId] as const,
  billInvoice: (billId: string) => [...billingKeys.all, 'bill-invoice', billId] as const,
  invoices: () => [...billingKeys.all, 'invoices'] as const,
  payment: (billId: string) => [...billingKeys.all, 'payment', billId] as const,
  payments: (billId: string) => [...billingKeys.all, 'payments', billId] as const,
  billPayments: (billId: string) => [...billingKeys.all, 'bill-payments', billId] as const,
  plans: () => [...billingKeys.all, 'plans'] as const,
  plan: (id: string) => [...billingKeys.plans(), id] as const,
  dashboard: () => [...billingKeys.all, 'dashboard'] as const,
  stats: () => [...billingKeys.all, 'stats'] as const,
  orgStats: (orgId: string) => [...billingKeys.stats(), 'organization', orgId] as const,
}

// API Functions
const billingApi = {
  // Bills
  async getAllBills(filters?: Record<string, any>): Promise<Bill[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.payroll}/billing?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getBillById(id: string): Promise<Bill> {
    const response = await axios.get(`${APIDictionary.payroll}/billing/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async createBill(data: CreateBillRequest): Promise<Bill> {
    const response = await axios.post(`${APIDictionary.payroll}/billing`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateBill(id: string, data: UpdateBillRequest): Promise<Bill> {
    const response = await axios.put(`${APIDictionary.payroll}/billing/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteBill(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.payroll}/billing/${id}`, { withCredentials: true })
  },

  async getBillingHistory(orgId?: string): Promise<Bill[]> {
    const endpoint = orgId 
      ? `${APIDictionary.payroll}/billing/history?organizationId=${orgId}`
      : `${APIDictionary.payroll}/billing/history`
    const response = await axios.get(endpoint, { withCredentials: true })
    return response.data.data || response.data
  },

  // Invoices
  async getInvoiceByBill(billId: string): Promise<Invoice> {
    const response = await axios.get(`${APIDictionary.payroll}/billing/${billId}/invoice`, { withCredentials: true })
    return response.data.data || response.data
  },

  async createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
    const response = await axios.post(`${APIDictionary.payroll}/billing/invoices`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateInvoice(id: string, data: UpdateInvoiceRequest): Promise<Invoice> {
    const response = await axios.put(`${APIDictionary.payroll}/billing/invoices/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async generateInvoicePdf(invoiceId: string): Promise<Blob> {
    const response = await axios.get(`${APIDictionary.payroll}/billing/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
      withCredentials: true
    })
    return response.data
  },

  async sendInvoice(invoiceId: string, email?: string): Promise<void> {
    await axios.post(`${APIDictionary.payroll}/billing/invoices/${invoiceId}/send`, {
      email
    }, { withCredentials: true })
  },

  // Payments
  async getBillPayments(billId: string): Promise<Payment[]> {
    const response = await axios.get(`${APIDictionary.payroll}/billing/${billId}/payments`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getPaymentById(id: string): Promise<Payment> {
    const response = await axios.get(`${APIDictionary.payroll}/billing/payments/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const response = await axios.post(`${APIDictionary.payroll}/billing/${data.billId}/payments`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async processPayment(data: ProcessPaymentRequest): Promise<Payment> {
    const response = await axios.patch(`${APIDictionary.payroll}/billing/payments/${data.paymentId}/process`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async refundPayment(paymentId: string, amount: number, reason: string): Promise<PaymentRefund> {
    const response = await axios.post(`${APIDictionary.payroll}/billing/payments/${paymentId}/refund`, {
      amount,
      reason
    }, { withCredentials: true })
    return response.data.data || response.data
  },

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await axios.get(`${APIDictionary.payroll}/billing/plans`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan> {
    const response = await axios.get(`${APIDictionary.payroll}/billing/plans/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  // Dashboard
  async getBillingDashboard(): Promise<BillingDashboardData> {
    const response = await axios.get(`${APIDictionary.payroll}/billing/dashboard`, {
      withCredentials: true
    })
    return response.data.data
  },

  // Stats
  async getBillingStats(orgId?: string): Promise<BillingStats> {
    const endpoint = orgId 
      ? `${APIDictionary.payroll}/billing/stats?organizationId=${orgId}`
      : `${APIDictionary.payroll}/billing/stats`
    const response = await axios.get(endpoint, { withCredentials: true })
    return response.data.data || response.data
  },

  // Utility functions
  async markBillAsPaid(billId: string, paymentDetails?: any): Promise<Bill> {
    const response = await axios.patch(`${APIDictionary.payroll}/billing/${billId}/mark-paid`, paymentDetails, { withCredentials: true })
    return response.data.data || response.data
  },

  async sendPaymentReminder(billId: string): Promise<void> {
    await axios.post(`${APIDictionary.payroll}/billing/${billId}/reminder`, {}, { withCredentials: true })
  },

  async cancelBill(billId: string, reason?: string): Promise<Bill> {
    const response = await axios.patch(`${APIDictionary.payroll}/billing/${billId}/cancel`, { reason }, { withCredentials: true })
    return response.data.data || response.data
  }
}

// Query Hooks
export function useBills(filters?: Record<string, any>) {
  return useQuery<Bill[]>({
    queryKey: billingKeys.billsList(filters || {}),
    queryFn: () => billingApi.getAllBills(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useBill(id: string) {
  return useQuery<Bill>({
    queryKey: billingKeys.bill(id),
    queryFn: () => billingApi.getBillById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export function useBillingHistory(orgId?: string) {
  return useQuery<Bill[]>({
    queryKey: orgId ? billingKeys.orgBills(orgId) : billingKeys.bills(),
    queryFn: () => billingApi.getBillingHistory(orgId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useBillInvoice(billId: string) {
  return useQuery<Invoice>({
    queryKey: billingKeys.billInvoice(billId),
    queryFn: () => billingApi.getInvoiceByBill(billId),
    enabled: !!billId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useBillPayments(billId: string) {
  return useQuery<Payment[]>({
    queryKey: billingKeys.billPayments(billId),
    queryFn: () => billingApi.getBillPayments(billId),
    enabled: !!billId,
    staleTime: 1 * 60 * 1000,
  })
}

export function usePayment(id: string) {
  return useQuery<Payment>({
    queryKey: billingKeys.payment(id),
    queryFn: () => billingApi.getPaymentById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds - payments change status frequently
  })
}

export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: billingKeys.plans(),
    queryFn: billingApi.getSubscriptionPlans,
    staleTime: 15 * 60 * 1000, // 15 minutes - plans change rarely
  })
}

export function useSubscriptionPlan(id: string) {
  return useQuery<SubscriptionPlan>({
    queryKey: billingKeys.plan(id),
    queryFn: () => billingApi.getSubscriptionPlan(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
  })
}

export function useBillingDashboard() {
  return useQuery<BillingDashboardData>({
    queryKey: billingKeys.dashboard(),
    queryFn: () => billingApi.getBillingDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useBillingStats(orgId?: string) {
  return useQuery<BillingStats>({
    queryKey: orgId ? billingKeys.orgStats(orgId) : billingKeys.stats(),
    queryFn: () => billingApi.getBillingStats(orgId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation Hooks
export function useCreateBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: billingApi.createBill,
    onSuccess: (newBill) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.bills() })
      queryClient.invalidateQueries({ queryKey: billingKeys.orgBills(newBill.organizationId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.stats() })
    },
  })
}

export function useUpdateBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBillRequest }) =>
      billingApi.updateBill(id, data),
    onSuccess: (updatedBill, { id }) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.bill(id) })
      queryClient.invalidateQueries({ queryKey: billingKeys.bills() })
      queryClient.invalidateQueries({ queryKey: billingKeys.orgBills(updatedBill.organizationId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.stats() })
    },
  })
}

export function useDeleteBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: billingApi.deleteBill,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: billingKeys.bill(deletedId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.bills() })
      queryClient.invalidateQueries({ queryKey: billingKeys.stats() })
    },
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: billingApi.createInvoice,
    onSuccess: (newInvoice) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.bill(newInvoice.billId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.billInvoice(newInvoice.billId) })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceRequest }) =>
      billingApi.updateInvoice(id, data),
    onSuccess: (updatedInvoice, { id }) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.invoice(id) })
      queryClient.invalidateQueries({ queryKey: billingKeys.billInvoice(updatedInvoice.billId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.bill(updatedInvoice.billId) })
    },
  })
}

export function useGenerateInvoicePdf() {
  return useMutation({
    mutationFn: billingApi.generateInvoicePdf,
  })
}

export function useSendInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, email }: { invoiceId: string; email?: string }) =>
      billingApi.sendInvoice(invoiceId, email),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.invoice(invoiceId) })
    },
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: billingApi.createPayment,
    onSuccess: (newPayment) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.bill(newPayment.billId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.billPayments(newPayment.billId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.stats() })
    },
  })
}

export function useProcessPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: billingApi.processPayment,
    onSuccess: (processedPayment, { paymentId }) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.payment(paymentId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.bill(processedPayment.billId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.billPayments(processedPayment.billId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.stats() })
    },
  })
}

export function useRefundPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, amount, reason }: { paymentId: string; amount: number; reason: string }) =>
      billingApi.refundPayment(paymentId, amount, reason),
    onSuccess: (_, { paymentId }) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.payment(paymentId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.stats() })
    },
  })
}

export function useMarkBillAsPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ billId, paymentDetails }: { billId: string; paymentDetails?: any }) =>
      billingApi.markBillAsPaid(billId, paymentDetails),
    onSuccess: (updatedBill, { billId }) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.bill(billId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.bills() })
      queryClient.invalidateQueries({ queryKey: billingKeys.billPayments(billId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.stats() })
    },
  })
}

export function useSendPaymentReminder() {
  return useMutation({
    mutationFn: billingApi.sendPaymentReminder,
  })
}

export function useCancelBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ billId, reason }: { billId: string; reason?: string }) =>
      billingApi.cancelBill(billId, reason),
    onSuccess: (_, { billId }) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.bill(billId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.bills() })
      queryClient.invalidateQueries({ queryKey: billingKeys.stats() })
    },
  })
}
