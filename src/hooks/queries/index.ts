// Central export file for all TanStack Query hooks
// This allows for clean imports throughout the application

// Roles & Permissions - with specific exports to avoid conflicts
export {
  // Role hooks
  useRoles, useRole, useRoleHierarchy, useUserRoles,
  useCreateRole, useUpdateRole, useDeleteRole,
  useAssignPermissions, useRemovePermissions, useUpdateRoleHierarchy,
  useAssignUserRole, useRemoveUserRole,
  // Role types
  type Role, type CreateRoleRequest, type UpdateRoleRequest,
  type AssignPermissionsRequest, type RoleHierarchy,
  // Role query keys
  roleKeys
} from './useRoles'

export {
  // Permission hooks
  usePermissions, usePermission, usePermissionCategories,
  usePermissionPresets, usePermissionPreset, useUserPermissions,
  useCreatePermission, useUpdatePermission, useDeletePermission,
  useCreatePermissionPreset, useUpdatePermissionPreset, useDeletePermissionPreset,
  // Permission types
  type Permission, type PermissionCategory, type PermissionPreset,
  type CreatePermissionRequest, type UpdatePermissionRequest,
  type CreatePermissionPresetRequest,
  // Permission query keys
  permissionKeys
} from './usePermissions'

// Tasks Management
export {
  // Task hooks
  useTasks, useTask, useUserTasks, useManagerTasks, useGroupTasks,
  useTaskAssignments, useTaskUpdates,
  useCreateTask, useUpdateTask, useDeleteTask,
  useAssignTask, useUnassignTask, useUpdateAssignmentStatus,
  useCreateTaskUpdate, useDeleteTaskUpdate,
  // Task group hooks
  useTaskGroups, useTaskGroup,
  useCreateTaskGroup, useUpdateTaskGroup, useDeleteTaskGroup,
  useAddGroupMembers, useRemoveGroupMembers, useUpdateMemberRole,
  // Task types
  type Task, type TaskGroup, type TaskGroupMember, type TaskAssignment, type TaskUpdate,
  type CreateTaskRequest, type UpdateTaskRequest, type CreateTaskGroupRequest,
  type UpdateTaskGroupRequest, type CreateTaskUpdateRequest, type AssignTaskRequest,
  // Task query keys
  taskKeys, taskGroupKeys
} from './useTasks'

// Holidays Management
export {
  // Holiday hooks
  useHolidays, useHoliday, useHolidaysByOrg, useHolidayCalendar, useUpcomingHolidays,
  useCreateHoliday, useUpdateHoliday, useDeleteHoliday,
  useBulkCreateHolidays, useToggleHolidayStatus,
  // Holiday type hooks
  useHolidayTypes, useHolidayType, useHolidayTypesByOrg,
  useCreateHolidayType, useUpdateHolidayType, useDeleteHolidayType,
  useSetDefaultHolidayType,
  // Holiday types
  type Holiday, type HolidayType, type CreateHolidayRequest,
  type UpdateHolidayRequest, type CreateHolidayTypeRequest,
  type UpdateHolidayTypeRequest, type HolidayCalendarEntry,
  // Holiday query keys
  holidayKeys, holidayTypeKeys
} from './useHolidays'

// Payroll Management
export {
  // Payroll hooks
  usePayrolls, usePayroll, useUserPayrolls, usePayrollStats,
  usePayrollParameters, useSalaryRecordExistence,
  usePaymentTransactions, usePaymentTransaction,
  useCreatePayroll, useUpdatePayroll, useDeletePayroll,
  useUpdatePayrollParameters, useGeneratePayroll, useBulkGeneratePayroll,
  useApprovePayroll, useRejectPayroll, useProcessPayroll,
  useUpdateTransactionStatus, useExportPayrollReport, useExportPayslip,
  // Payroll types
  type PayrollRecord, type PayrollParameters, type PayrollAllowance,
  type PayrollDeduction, type PaymentTransaction, type SalaryRecord,
  type PayrollStats, type CreatePayrollRequest, type UpdatePayrollRequest,
  type ProcessPayrollRequest, type UpdatePayrollParametersRequest,
  // Payroll query keys
  payrollKeys
} from './usePayroll'

// Billing Management
export {
  // Billing hooks
  useBills, useBill, useBillingHistory, useBillInvoice,
  useBillPayments, usePayment, useSubscriptionPlans, useSubscriptionPlan,
  useBillingStats, useCreateBill, useUpdateBill, useDeleteBill,
  useCreateInvoice, useUpdateInvoice, useGenerateInvoicePdf, useSendInvoice,
  useCreatePayment, useProcessPayment, useRefundPayment,
  useMarkBillAsPaid, useSendPaymentReminder, useCancelBill,
  // Billing types
  type Bill, type SubscriptionPlan, type Invoice, type Payment,
  type PaymentRefund, type BillingStats, type CreateBillRequest,
  type UpdateBillRequest, type CreatePaymentRequest, type ProcessPaymentRequest,
  type CreateInvoiceRequest, type UpdateInvoiceRequest,
  // Billing query keys
  billingKeys
} from './useBilling'

// Notifications
export {
  // Notification hooks
  useNotifications, useNotification, useUserNotifications, useUnreadNotifications,
  useNotificationStats, useNotificationPreferences, useNotificationTemplates,
  useNotificationTemplate, useCreateNotification, useUpdateNotification,
  useDeleteNotification, useMarkAsRead, useMarkAsUnread, useBulkMarkAsRead,
  useMarkAllAsRead, useUpdateNotificationPreferences, useCreateNotificationTemplate,
  useUpdateNotificationTemplate, useDeleteNotificationTemplate,
  useSendBulkNotification, useDeleteMultipleNotifications, useSendWhatsAppNotification,
  // Notification types
  type Notification, type NotificationTemplate, type NotificationPreferences,
  type NotificationStats, type CreateNotificationRequest, type UpdateNotificationRequest,
  type CreateNotificationTemplateRequest, type UpdateNotificationTemplateRequest,
  type BulkMarkRequest, type SendBulkNotificationRequest,
  // Notification query keys
  notificationKeys
} from './useNotifications'

// Authentication & Public Pages
export {
  // Auth hooks
  useCheckEmail, useValidateToken, usePublicOrganizationInfo,
  useOnboardingFormInfo, useCheckOnboardingTokenValidity, usePublicData,
  useLogin, useLogout, useVerifyPassword, useVerifyOtp, useRefreshToken,
  useForgotPassword, useResetPassword, useSetPassword, useVerifyEmail,
  useResendVerificationEmail, useSubmitOnboardingForm,
  useAuthenticatedQuery, useAuthenticatedMutation
} from './useAuth'

// Auth types
export type {
  LoginRequest, LoginResponse, RegisterRequest,
  ForgotPasswordRequest, ResetPasswordRequest, SetPasswordRequest,
  VerifyEmailRequest, RefreshTokenRequest, CheckEmailRequest,
  CheckEmailResponse, VerifyPasswordRequest, VerifyOtpRequest,
  ValidateTokenRequest, ValidateTokenResponse, PublicOrganizationInfo,
  OnboardingFormData
} from '@/types/auth'

// Auth query keys
export { authKeys, publicKeys } from './authKeys'

// Existing modules
export * from './useAttendance'
export * from './useDepartments'
export * from './useOrganizationSettings'
export * from './useProfile'

// Onboarding Management
export {
  // Onboarding hooks
  useCandidate, useCandidateReview, useDepartments,
  useUpdateCandidate, useApproveCandidate, useRequestChanges,
  useRejectCandidate, useMarkUnderReview,
  // Onboarding types
  type CandidateReviewData, type UpdateCandidateRequest, type ReviewCandidateRequest,
  // Onboarding query keys
  onboardingKeys
} from './useOnboarding'

// Employee Management
export {
  // Employee hooks
  useEmployees, useEmployee, useEmployeesByDepartment, useEmployeesByManager,
  useEmployeeRoles, useCreateEmployee, useUpdateEmployee, useDeleteEmployee,
  useAssignEmployeeRole, useRemoveEmployeeRole, useUpdateEmployeeStatus
} from './useEmployees'

// Employee types
export type {
  Employee, CreateEmployeeRequest, UpdateEmployeeRequest,
  AssignEmployeeRoleRequest
} from '@/types/employees'

// Employee query keys
export { employeeKeys } from './employeeKeys'

// Query keys and utilities
export {
  globalKeys, invalidationHelpers, queryOptions
} from './queryKeys'

// Re-export TanStack Query core hooks for convenience
export { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'

// Leave Management
export {
  // Leave hooks
  useLeaveTypesQuery, useLeaveTypeQuery,
  useLeaveRequestsQuery, useManagerLeaveRequestsQuery, useLeaveRequestQuery,
  useLeaveBalancesQuery, useLeaveBalanceQuery,
  useCreateLeaveTypeMutation, useUpdateLeaveTypeMutation, useDeleteLeaveTypeMutation,
  useCreateLeaveRequestMutation, useUpdateLeaveRequestMutation, useDeleteLeaveRequestMutation,
  useApproveLeaveRequestMutation, useRejectLeaveRequestMutation,
  // Leave types
  type LeaveType, type LeaveRequest, type LeaveBalance,
  // Leave query keys
  leaveQueryKeys
} from './useLeaves'

// Organization Management
export {
  // Organization hooks
  useOrganization, useOrganizations, useOrganizationDepartments, useTeamMembers, useUpdateOrganization,
  useOrganizationChart, useOrganizationManagerChart,
  type OrganizationType, type Department, type TeamMember, type User,
  organizationKeys
} from './useOrganizations'

// User Management
export {
  // User hooks
  useUsersByOrganization,
  // User types
  type User as UserType,
  // User query keys
  userKeys
} from './useUsers'
