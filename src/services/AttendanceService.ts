import axios from 'axios';
import { APIV3Dictionary } from '../api/v3/Api3Dicts';
import {
  AttendanceRule,
  AttendanceRuleViolation,
  CreateRuleRequest,
  ProcessAttendanceResponse,
  BreakRecord,
  BreakPolicies,
  StartBreakRequest,
  BreakAnalytics,
  Geofence,
  CreateGeofenceRequest,
  ValidateLocationRequest,
  ValidationResponse,
  LocationValidationLog,
  AttendanceAlert,
  AlertConfiguration,
  TriggerAlertRequest,
  AlertStatistics,
  OrganizationAnalytics,
  EmployeeAnalytics,
  AttendanceTrends,
  GenerateReportRequest,
  APIResponse,
  PaginatedResponse,
  PaginationParams
} from '../interface/attendance';

// Set up axios defaults
axios.defaults.withCredentials = true;

// =====================================================
// ATTENDANCE RULES SERVICE
// =====================================================

export class AttendanceRulesService {
  static async getOrganizationRules(orgId: string): Promise<APIResponse<AttendanceRule[]>> {
    const response = await axios.get(APIV3Dictionary.attendance.rules.getOrganizationRules(orgId));
    return response.data;
  }

  static async createRule(orgId: string, rule: CreateRuleRequest): Promise<APIResponse<AttendanceRule>> {
    const response = await axios.post(APIV3Dictionary.attendance.rules.createRule(orgId), rule);
    return response.data;
  }

  static async toggleRuleStatus(orgId: string, ruleId: string, isActive: boolean): Promise<APIResponse<AttendanceRule>> {
    const response = await axios.patch(APIV3Dictionary.attendance.rules.toggleRule(orgId, ruleId), { isActive });
    return response.data;
  }

  static async deleteRule(orgId: string, ruleId: string): Promise<APIResponse<void>> {
    const response = await axios.delete(APIV3Dictionary.attendance.rules.deleteRule(orgId, ruleId));
    return response.data;
  }

  static async processAttendanceRecord(attendanceId: string): Promise<APIResponse<ProcessAttendanceResponse>> {
    const response = await axios.post(APIV3Dictionary.attendance.rules.processRecord(attendanceId));
    return response.data;
  }

  static async getViolationHistory(
    orgId: string, 
    params?: {
      userId?: string;
      violationType?: string;
      fromDate?: string;
      toDate?: string;
    } & PaginationParams
  ): Promise<PaginatedResponse<AttendanceRuleViolation>> {
    const response = await axios.get(APIV3Dictionary.attendance.rules.getViolations(orgId), { params });
    return response.data;
  }

  static async approveViolation(violationId: string, approved: boolean, rejectionReason?: string): Promise<APIResponse<AttendanceRuleViolation>> {
    const response = await axios.patch(APIV3Dictionary.attendance.rules.approveViolation(violationId), {
      approved,
      rejectionReason
    });
    return response.data;
  }

  static async getRulesAnalytics(orgId: string, days?: number): Promise<APIResponse<any>> {
    const response = await axios.get(APIV3Dictionary.attendance.rules.getRulesAnalytics(orgId), {
      params: { days }
    });
    return response.data;
  }

  static async bulkUpdateRules(orgId: string, rules: Array<{ ruleType: string; isActive: boolean }>): Promise<APIResponse<void>> {
    const response = await axios.patch(APIV3Dictionary.attendance.rules.bulkUpdateRules(orgId), { rules });
    return response.data;
  }
}

// =====================================================
// BREAK MANAGEMENT SERVICE
// =====================================================

export class BreakManagementService {
  static async startBreak(userId: string, breakData: StartBreakRequest): Promise<APIResponse<BreakRecord>> {
    const response = await axios.post(APIV3Dictionary.attendance.breaks.startBreak(userId), breakData);
    return response.data;
  }

  static async endBreak(userId: string, breakId: string, location?: { latitude: number; longitude: number }): Promise<APIResponse<BreakRecord>> {
    const response = await axios.patch(APIV3Dictionary.attendance.breaks.endBreak(userId, breakId), { location });
    return response.data;
  }

  static async getActiveBreak(userId: string): Promise<APIResponse<BreakRecord | null>> {
    const response = await axios.get(APIV3Dictionary.attendance.breaks.getActiveBreak(userId));
    return response.data;
  }

  static async getBreakHistory(
    userId: string, 
    params?: {
      fromDate?: string;
      toDate?: string;
      breakType?: string;
    } & PaginationParams
  ): Promise<APIResponse<{ breaks: BreakRecord[]; analytics: any; pagination: any }>> {
    const response = await axios.get(APIV3Dictionary.attendance.breaks.getBreakHistory(userId), { params });
    return response.data;
  }

  static async getOrganizationBreakAnalytics(orgId: string, days?: number, department?: string): Promise<APIResponse<BreakAnalytics>> {
    const response = await axios.get(APIV3Dictionary.attendance.breaks.getOrgBreakAnalytics(orgId), {
      params: { days, department }
    });
    return response.data;
  }

  static async configureBreakPolicies(orgId: string, policies: BreakPolicies): Promise<APIResponse<BreakPolicies>> {
    const response = await axios.post(APIV3Dictionary.attendance.breaks.configureBreakPolicies(orgId), policies);
    return response.data;
  }

  static async getBreakPolicies(orgId: string): Promise<APIResponse<BreakPolicies>> {
    const response = await axios.get(APIV3Dictionary.attendance.breaks.getBreakPolicies(orgId));
    return response.data;
  }

  static async forceEndBreak(breakId: string, reason: string): Promise<APIResponse<BreakRecord>> {
    const response = await axios.patch(APIV3Dictionary.attendance.breaks.forceEndBreak(breakId), { reason });
    return response.data;
  }
}

// =====================================================
// GEOFENCING SERVICE
// =====================================================

export class GeofencingService {
  static async createGeofence(orgId: string, geofence: CreateGeofenceRequest): Promise<APIResponse<Geofence>> {
    const response = await axios.post(APIV3Dictionary.attendance.geofencing.createGeofence(orgId), geofence);
    return response.data;
  }

  static async getGeofences(orgId: string, params?: { type?: string; isActive?: boolean }): Promise<APIResponse<Geofence[]>> {
    const response = await axios.get(APIV3Dictionary.attendance.geofencing.getGeofences(orgId), { params });
    return response.data;
  }

  static async updateGeofence(orgId: string, geofenceId: string, updates: Partial<CreateGeofenceRequest>): Promise<APIResponse<Geofence>> {
    const response = await axios.patch(APIV3Dictionary.attendance.geofencing.updateGeofence(orgId, geofenceId), updates);
    return response.data;
  }

  static async deleteGeofence(orgId: string, geofenceId: string): Promise<APIResponse<void>> {
    const response = await axios.delete(APIV3Dictionary.attendance.geofencing.deleteGeofence(orgId, geofenceId));
    return response.data;
  }

  static async validateLocation(orgId: string, location: ValidateLocationRequest): Promise<APIResponse<ValidationResponse>> {
    const response = await axios.post(APIV3Dictionary.attendance.geofencing.validateLocation(orgId), location);
    return response.data;
  }

  static async getValidationHistory(
    orgId: string, 
    params?: {
      userId?: string;
      geofenceId?: string;
      fromDate?: string;
      toDate?: string;
      isValid?: boolean;
    } & PaginationParams
  ): Promise<PaginatedResponse<LocationValidationLog>> {
    const response = await axios.get(APIV3Dictionary.attendance.geofencing.getValidationHistory(orgId), { params });
    return response.data;
  }

  static async getGeofencingAnalytics(orgId: string, days?: number): Promise<APIResponse<any>> {
    const response = await axios.get(APIV3Dictionary.attendance.geofencing.getGeofencingAnalytics(orgId), {
      params: { days }
    });
    return response.data;
  }

  static async getNearbyGeofences(
    orgId: string, 
    latitude: number, 
    longitude: number, 
    radius?: number
  ): Promise<APIResponse<{ location: any; searchRadius: number; nearby: Geofence[]; withinGeofences: Geofence[] }>> {
    const response = await axios.get(APIV3Dictionary.attendance.geofencing.getNearbyGeofences(orgId), {
      params: { latitude, longitude, radius }
    });
    return response.data;
  }

  static async bulkImportGeofences(orgId: string, geofences: CreateGeofenceRequest[]): Promise<APIResponse<{ imported: number; total: number }>> {
    const response = await axios.post(APIV3Dictionary.attendance.geofencing.bulkImportGeofences(orgId), { geofences });
    return response.data;
  }
}

// =====================================================
// ALERTS SERVICE
// =====================================================

export class AlertsService {
  static async getAlertConfiguration(orgId: string): Promise<APIResponse<AlertConfiguration>> {
    const response = await axios.get(APIV3Dictionary.attendance.alerts.getAlertConfig(orgId));
    return response.data;
  }

  static async updateAlertConfiguration(orgId: string, config: AlertConfiguration): Promise<APIResponse<AlertConfiguration>> {
    const response = await axios.patch(APIV3Dictionary.attendance.alerts.updateAlertConfig(orgId), config);
    return response.data;
  }

  static async triggerAlert(orgId: string, alert: TriggerAlertRequest): Promise<APIResponse<AttendanceAlert>> {
    const response = await axios.post(APIV3Dictionary.attendance.alerts.triggerAlert(orgId), alert);
    return response.data;
  }

  static async getOrganizationAlerts(
    orgId: string, 
    params?: {
      userId?: string;
      type?: string;
      severity?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
    } & PaginationParams
  ): Promise<APIResponse<{ alerts: AttendanceAlert[]; stats: any; pagination: any }>> {
    const response = await axios.get(APIV3Dictionary.attendance.alerts.getOrganizationAlerts(orgId), { params });
    return response.data;
  }

  static async getUserAlerts(
    userId: string, 
    params?: {
      type?: string;
      status?: string;
    } & PaginationParams
  ): Promise<APIResponse<{ alerts: AttendanceAlert[]; pagination: any }>> {
    const response = await axios.get(APIV3Dictionary.attendance.alerts.getUserAlerts(userId), { params });
    return response.data;
  }

  static async acknowledgeAlert(alertId: string): Promise<APIResponse<AttendanceAlert>> {
    const response = await axios.patch(APIV3Dictionary.attendance.alerts.acknowledgeAlert(alertId));
    return response.data;
  }

  static async bulkAcknowledgeAlerts(alertIds: string[]): Promise<APIResponse<{ acknowledged: number; requested: number }>> {
    const response = await axios.patch(APIV3Dictionary.attendance.alerts.bulkAcknowledgeAlerts, { alertIds });
    return response.data;
  }

  static async getAlertStatistics(orgId: string, days?: number): Promise<APIResponse<AlertStatistics>> {
    const response = await axios.get(APIV3Dictionary.attendance.alerts.getAlertStatistics(orgId), {
      params: { days }
    });
    return response.data;
  }

  static async testAlertSystem(orgId: string, channels?: string[]): Promise<APIResponse<any>> {
    const response = await axios.post(APIV3Dictionary.attendance.alerts.testAlertSystem(orgId), { channels });
    return response.data;
  }

  static async cleanupOldAlerts(orgId: string, days?: number): Promise<APIResponse<{ deletedCount: number; cutoffDate: string }>> {
    const response = await axios.delete(APIV3Dictionary.attendance.alerts.cleanupOldAlerts(orgId), {
      data: { days }
    });
    return response.data;
  }
}

// =====================================================
// ANALYTICS SERVICE
// =====================================================

export class AnalyticsService {
  static async getOrganizationAnalytics(
    orgId: string, 
    params?: {
      fromDate?: string;
      toDate?: string;
      department?: string;
      employeeIds?: string[];
      includeViolations?: boolean;
      includeBreaks?: boolean;
      includeGeofencing?: boolean;
    }
  ): Promise<APIResponse<OrganizationAnalytics>> {
    const response = await axios.get(APIV3Dictionary.attendance.analytics.getOrganizationAnalytics(orgId), { params });
    return response.data;
  }

  static async getEmployeeAnalytics(
    orgId: string, 
    userId: string, 
    params?: {
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<APIResponse<EmployeeAnalytics>> {
    const response = await axios.get(APIV3Dictionary.attendance.analytics.getEmployeeAnalytics(orgId, userId), { params });
    return response.data;
  }

  static async getAttendanceTrends(
    orgId: string, 
    params?: {
      period?: 'daily' | 'weekly' | 'monthly';
      days?: number;
    }
  ): Promise<APIResponse<AttendanceTrends>> {
    const response = await axios.get(APIV3Dictionary.attendance.analytics.getAttendanceTrends(orgId), { params });
    return response.data;
  }

  static async generateReport(orgId: string, request: GenerateReportRequest): Promise<APIResponse<any>> {
    const response = await axios.post(APIV3Dictionary.attendance.analytics.generateReport(orgId), request);
    return response.data;
  }
}

// =====================================================
// HEALTH CHECK SERVICE
// =====================================================

export class AttendanceHealthService {
  static async checkHealth(): Promise<APIResponse<any>> {
    const response = await axios.get(APIV3Dictionary.attendance.health);
    return response.data;
  }
}
