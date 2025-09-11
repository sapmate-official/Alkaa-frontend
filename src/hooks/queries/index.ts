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
  useAuthenticatedQuery, useAuthenticatedMutation,
  // Auth types
  type LoginRequest, type LoginResponse, type RegisterRequest,
  type ForgotPasswordRequest, type ResetPasswordRequest, type SetPasswordRequest,
  type VerifyEmailRequest, type RefreshTokenRequest, type CheckEmailRequest,
  type CheckEmailResponse, type VerifyPasswordRequest, type VerifyOtpRequest,
  type ValidateTokenRequest, type ValidateTokenResponse, type PublicOrganizationInfo,
  type OnboardingFormData,
  // Auth query keys
  authKeys, publicKeys
} from './useAuth'

// Existing modules
export * from './useAttendance'
export * from './useDepartments'
export * from './useOrganizationSettings'
export * from './useProfile'

// Employee Management
export {
  // Employee hooks
  useEmployees, useEmployee, useEmployeesByDepartment, useEmployeesByManager,
  useEmployeeRoles, useCreateEmployee, useUpdateEmployee, useDeleteEmployee,
  useAssignEmployeeRole, useRemoveEmployeeRole, useUpdateEmployeeStatus,
  // Employee types
  type Employee, type CreateEmployeeRequest, type UpdateEmployeeRequest,
  type AssignEmployeeRoleRequest,
  // Employee query keys
  employeeKeys
} from './useEmployees'

// Query keys and utilities
export {
  globalKeys, invalidationHelpers, queryOptions
} from './queryKeys'

// Re-export TanStack Query core hooks for convenience
export { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
