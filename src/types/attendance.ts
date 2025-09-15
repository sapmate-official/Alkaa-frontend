export interface Duration {
    hours: number;
    minutes: number;
    totalMinutes: number;
}

export interface AttendanceSession {
    id: string;
    userId: string;
    date: string;
    sessionNumber: number;
    checkInTime: string;
    checkOutTime: string;
    checkInLocation: string;
    checkOutLocation: string;
    status: string;
    notes: string;
    duration: Duration;
    ipAddress: string;
    deviceInfo: string;
    createdAt: string;
    updatedAt: string;
}

// =====================================================
// COMPREHENSIVE ATTENDANCE SYSTEM INTERFACES
// =====================================================

// =====================================================
// ATTENDANCE RULES INTERFACES
// =====================================================

export interface AttendanceRule {
  id: string;
  orgId: string;
  ruleType: 'LATE_ARRIVAL' | 'EARLY_DEPARTURE' | 'MINIMUM_HOURS' | 'BREAK_VIOLATION' | 'GEOFENCE_VIOLATION' | 'ABSENTEEISM';
  threshold: number;
  penalty: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRuleViolation {
  id: string;
  attendanceId: string;
  ruleId: string;
  violationType: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  penaltyAmount: number;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  attendance: {
    user: {
      firstName: string;
      lastName: string;
      employeeId: string;
    };
  };
  rule: AttendanceRule;
}

export interface CreateRuleRequest {
  ruleType: string;
  threshold: number;
  penalty: number;
  isActive?: boolean;
  description?: string;
}

export interface ProcessAttendanceResponse {
  attendanceId: string;
  employee: string;
  violations: AttendanceRuleViolation[];
  penalties: Array<{
    violation: AttendanceRuleViolation;
    penalty: {
      amount: number;
      requiresApproval: boolean;
    };
  }>;
  totalViolations: number;
  requiresApproval: boolean;
}

// =====================================================
// BREAK MANAGEMENT INTERFACES
// =====================================================

export interface BreakRecord {
  id: string;
  userId: string;
  breakType: 'LUNCH' | 'TEA' | 'REGULAR' | 'EMERGENCY' | 'PERSONAL';
  startTime: string;
  endTime?: string;
  duration?: number;
  startLocation?: {
    latitude: number;
    longitude: number;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
  };
  hasViolation: boolean;
  violationReason?: string;
  forcedEndBy?: string;
  forcedEndReason?: string;
  createdAt: string;
}

export interface BreakPolicies {
  maxBreakDuration: number;
  maxDailyBreaks: number;
  allowedBreakTypes: string[];
  requiresApproval: boolean;
  restrictedHours: string[];
}

export interface StartBreakRequest {
  breakType: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface BreakAnalytics {
  totalBreaks: number;
  totalEmployees: number;
  averageBreaksPerEmployee: number;
  totalBreakTime: number;
  averageBreakDuration: number;
  breaksByType: Record<string, { count: number; totalDuration: number }>;
  breaksByDepartment: Record<string, number>;
  violationRate: number;
  topBreakTakers: Record<string, number>;
  dailyTrends: Record<string, number>;
  peakBreakHours: Record<string, number>;
}

// =====================================================
// GEOFENCING INTERFACES
// =====================================================

export interface Geofence {
  id: string;
  orgId: string;
  name: string;
  type: 'OFFICE' | 'BRANCH' | 'WAREHOUSE' | 'SITE' | 'REMOTE_LOCATION';
  latitude: number;
  longitude: number;
  radius: number;
  address?: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationValidationLog {
  id: string;
  userId: string;
  geofenceId?: string;
  latitude: number;
  longitude: number;
  isValid: boolean;
  distance?: number;
  validationTime: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  geofence?: {
    name: string;
    type: string;
  };
}

export interface CreateGeofenceRequest {
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  radius?: number;
  address?: string;
  description?: string;
  isActive?: boolean;
}

export interface ValidateLocationRequest {
  latitude: number;
  longitude: number;
  userId?: string;
}

export interface ValidationResponse {
  isValid: boolean;
  geofences: Array<{
    geofence: Geofence;
    distance: number;
    isWithin: boolean;
  }>;
  violations: LocationValidationLog[];
}

// =====================================================
// ALERTS INTERFACES
// =====================================================

export interface AttendanceAlert {
  id: string;
  userId: string;
  type: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'UNREAD' | 'ACKNOWLEDGED';
  metadata?: Record<string, any>;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export interface AlertConfiguration {
  enableRealTimeAlerts: boolean;
  alertChannels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    dashboard: boolean;
  };
  alertTypes: {
    lateArrival: { enabled: boolean; threshold: number };
    earlyDeparture: { enabled: boolean; threshold: number };
    longBreak: { enabled: boolean; threshold: number };
    geofenceViolation: { enabled: boolean };
    absenteeism: { enabled: boolean };
    consecutiveViolations: { enabled: boolean; threshold: number };
  };
  recipients: {
    managers: boolean;
    hr: boolean;
    self: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface TriggerAlertRequest {
  type: string;
  userId?: string;
  message: string;
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
  metadata?: Record<string, any>;
}

export interface AlertStatistics {
  totalAlerts: number;
  byType: Record<string, number>;
  bySeverity: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  byStatus: {
    UNREAD: number;
    ACKNOWLEDGED: number;
  };
  byDepartment: Record<string, number>;
  responseTime: {
    average: number;
    fastest: number | null;
    slowest: number | null;
  };
  trends: Record<string, number>;
  topEmployees: Record<string, number>;
}

// =====================================================
// ANALYTICS INTERFACES
// =====================================================

export interface OrganizationAnalytics {
  summary: {
    totalEmployees: number;
    totalAttendanceRecords: number;
    dateRange: { from: string; to: string };
    averageWorkingDays: number;
    totalWorkingHours: number;
    averageWorkingHours: number;
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    earlyDepartures: number;
    attendanceRate: number;
    punctualityRate: number;
  };
  departments: Record<string, {
    employeeCount: number;
    totalRecords: number;
    presentDays: number;
    totalWorkingHours: number;
  }>;
  employees: Record<string, {
    employeeId: string;
    department: string;
    totalDays: number;
    presentDays: number;
    totalWorkingHours: number;
    lateArrivals: number;
    earlyDepartures: number;
  }>;
  trends: {
    daily: Record<string, { present: number; absent: number; late: number }>;
    weekly: Record<string, any>;
    monthly: Record<string, any>;
  };
  violations?: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byDepartment: Record<string, number>;
    approvalRate: number;
    penaltyImpact: {
      totalPenalties: number;
      estimatedDeduction: number;
      byEmployee: Record<string, any>;
    };
  };
  breaks?: BreakAnalytics;
  geofencing?: {
    totalValidations: number;
    validValidations: number;
    violations: number;
    complianceRate: number;
  };
}

export interface EmployeeAnalytics {
  employee: {
    name: string;
    employeeId: string;
    department: string;
  };
  summary: {
    totalDays: number;
    presentDays: number;
    totalWorkingHours: number;
    averageWorkingHours: number;
    attendanceRate: number;
  };
  performance: {
    punctualityScore: number;
    complianceScore: number;
    productivityScore: number;
    overallScore: number;
  };
  violations: {
    total: number;
    byType: Record<string, number>;
    severity: { HIGH: number; MEDIUM: number; LOW: number };
    trends: Record<string, number>;
  };
  breaks: {
    total: number;
    totalDuration: number;
    averageDuration: number;
    violations: number;
  };
  trends: {
    workingHours: Record<string, number>;
    attendance: Record<string, string>;
    violations: Record<string, number>;
  };
  recommendations: Array<{
    type: string;
    message: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export interface AttendanceTrends {
  period: 'daily' | 'weekly' | 'monthly';
  data: Record<string, {
    present: number;
    absent: number;
    total: number;
    attendanceRate: number;
  }>;
  summary: {
    totalRecords: number;
    averageAttendanceRate: number;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    prediction: {
      nextWeekRate: number;
      confidence: 'high' | 'medium' | 'low';
      factors: string[];
    };
  };
  departmentTrends: Record<string, Record<string, { present: number; total: number }>>;
}

export interface GenerateReportRequest {
  reportType: 'summary' | 'detailed' | 'violations' | 'payroll';
  fromDate?: string;
  toDate?: string;
  format?: 'json' | 'csv';
  employeeIds?: string[];
  department?: string;
}

// =====================================================
// COMMON INTERFACES
// =====================================================

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}
