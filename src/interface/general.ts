export interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    hashedPassword?: string;
    refreshToken?: string;
    status?: UserStatus;
    verificationToken?: string;
    createdAt: Date;
    updatedAt: Date;
    avatar?: string;
}

export enum Role {
    EMPLOYEE = "EMPLOYEE",
    MANAGER = "MANAGER"
}

export enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export interface LeaveRequest {
    User: any;
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    status: LeaveStatus;
    leaveTypeId: string;
    reason?: string;
    approvedBy?: string;
    approvedAt?: Date;
    rejectedReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface LeaveRecord {
    id: string;
    userId: string;
    leaveTypeId: string;
    usedDays: number;
    remainingDays: number;
    year: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface LeaveType {
  id: string;
  name: string;
  leaveTypeId: string;
  usedDays: number;
  remainingDays: number;
  totalDays: number;
  year: number;
  type: 'Annual' | 'Sick' | 'Other';
  createdAt: string;
  updatedAt: string;
}

export interface LeaveTypeDetails {
  id: string;
  name: string;
  description: string;
  annualLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  usedDays: number;
  remainingDays: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  leaveType: LeaveTypeDetails;
}

export enum LeaveStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
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
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  ON_LEAVE = "ON_LEAVE"
}