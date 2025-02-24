export interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  hashedPassword: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  subscriptionPlan: string;
  subscriptionStart: Date;
  subscriptionEnd?: Date;
  isActive: boolean;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
  departments: Department[];
  users: User[];
  roles: Role[];
  permissions: Permission[];
  leaveTypes: LeaveType[];
  notificationTemplates: NotificationTemplate[];
  holidays: Holiday[];
}

export interface Department {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  code?: string;
  headId?: string;
  parentId?: string;
  status: boolean;
  location?: string;
  budget?: number;
  createdAt: Date;
  updatedAt: Date;
  organization: Organization;
  users: User[];
  departmentHead?: User;
  parentDepartment?: Department;
  subDepartments: Department[];
}

export interface Role {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization: Organization;
  permissions: RolePermission[];
  users: UserRole[];
}

export interface Permission {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  createdAt: Date;
  organization: Organization;
  roles: RolePermission[];
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
  role: Role;
  permission: Permission;
}

export interface User {
  id: string;
  orgId: string;
  departmentId?: string;
  managerId?: string;
  email: string;
  name?: string;
  hashedPassword?: string;
  refreshToken?: string;
  status: UserStatus;
  verificationToken?: string;
  dateOfBirth?: Date;
  address?: string;
  mobileNumber?: string;
  adharNumber?: string;
  panNumber?: string;
  employeeId?: string;
  hiredDate?: Date;
  terminationDate?: Date;
  annualPackage?: number;
  monthlySalary?: number;
  createdAt: Date;
  updatedAt: Date;
  organization: Organization;
  Department?: Department[];
  manager?: User;
  subordinates: User[];
  roles: UserRole[];
  bankDetails?: BankDetails;
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  attendanceRecords: AttendanceRecord[];
  salaryRecords: SalaryRecord[];
  notifications: Notification[];
  firstName?: string;
  lastName?: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  createdAt: Date;
  user: User;
  role: Role;
}

export interface BankDetails {
  id: string;
  userId: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface LeaveType {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  annualLimit: number;
  requiresApproval: boolean;
  isPaid: boolean;
  carryForward: boolean;
  maxCarryForward: number;
  createdAt: Date;
  updatedAt: Date;
  organization: Organization;
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  usedDays: number;
  remainingDays: number;
  carryForward: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  leaveType: LeaveType;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  status: LeaveStatus;
  reason?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  attachments?: any;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  leaveType: LeaveType;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: Date;
  sessionNumber: number;
  checkInTime: Date;
  checkOutTime?: Date;
  checkInLocation: any;
  checkOutLocation?: any;
  status: AttendanceStatus;
  notes?: string;
  duration?: any;
  ipAddress?: string;
  deviceInfo?: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface SalaryRecord {
  id: string;
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  status: PayrollStatus;
  processedAt?: Date;
  paymentRef?: string;
  paymentMode?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface NotificationTemplate {
  id: string;
  orgId: string;
  name: string;
  type: NotificationType;
  subject: string;
  content: string;
  variables?: any;
  createdAt: Date;
  updatedAt: Date;
  organization: Organization;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  userId: string;
  templateId: string;
  content: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: any;
  createdAt: Date;
  user: User;
  template: NotificationTemplate;
}

export interface BackgroundJob {
  id: string;
  type: JobType;
  status: JobStatus;
  payload: any;
  scheduledFor: Date;
  priority: number;
  attempts: number;
  maxAttempts: number;
  completedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holiday {
  id: string;
  orgId: string;
  name: string;
  date: Date;
  description?: string;
  isOptional: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization: Organization;
}

export enum UserStatus {
  active = "active",
  inactive = "inactive",
  suspended = "suspended"
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  HALF_DAY = "HALF_DAY",
  LATE = "LATE",
  EARLY_DEPARTURE = "EARLY_DEPARTURE"
}

export enum PayrollStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PROCESSED = "PROCESSED",
  PAID = "PAID",
  FAILED = "FAILED"
}

export enum NotificationType {
  EMAIL = "EMAIL",
  PUSH = "PUSH",
  IN_APP = "IN_APP"
}

export enum JobType {
  PAYROLL_PROCESSING = "PAYROLL_PROCESSING",
  LEAVE_BALANCE_UPDATE = "LEAVE_BALANCE_UPDATE",
  NOTIFICATION_DISPATCH = "NOTIFICATION_DISPATCH",
  ATTENDANCE_REPORT = "ATTENDANCE_REPORT",
  DATA_BACKUP = "DATA_BACKUP",
  SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE"
}

export enum JobStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}