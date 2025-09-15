import { backendDomain } from '../../lib/constant/Domain';

export const AttendanceAPIV3Dictionary = {
    // Health check
    health: `${backendDomain}/api/v3/attendance/health`,
    
    // Attendance Rules
    rules: {
        // Get organization rules
        getOrganizationRules: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/rules`,
        
        // Create or update rule
        createRule: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/rules`,
        
        // Toggle rule status
        toggleRule: (orgId: string, ruleId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/rules/${ruleId}/toggle`,
        
        // Delete rule
        deleteRule: (orgId: string, ruleId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/rules/${ruleId}`,
        
        // Process attendance record
        processRecord: (attendanceId: string) => 
            `${backendDomain}/api/v3/attendance/attendance/${attendanceId}/process`,
        
        // Get violation history
        getViolations: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/violations`,
        
        // Approve violation
        approveViolation: (violationId: string) => 
            `${backendDomain}/api/v3/attendance/violations/${violationId}/approve`,
        
        // Get rules analytics
        getRulesAnalytics: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/rules/analytics`,
        
        // Bulk update rules
        bulkUpdateRules: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/rules/bulk`,
    },

    // Break Management
    breaks: {
        // Start break
        startBreak: (userId: string) => 
            `${backendDomain}/api/v3/attendance/users/${userId}/breaks/start`,
        
        // End break
        endBreak: (userId: string, breakId: string) => 
            `${backendDomain}/api/v3/attendance/users/${userId}/breaks/${breakId}/end`,
        
        // Get active break
        getActiveBreak: (userId: string) => 
            `${backendDomain}/api/v3/attendance/users/${userId}/breaks/active`,
        
        // Get break history
        getBreakHistory: (userId: string) => 
            `${backendDomain}/api/v3/attendance/users/${userId}/breaks/history`,
        
        // Get organization break analytics
        getOrgBreakAnalytics: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/breaks/analytics`,
        
        // Configure break policies
        configureBreakPolicies: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/breaks/policies`,
        
        // Get break policies
        getBreakPolicies: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/breaks/policies`,
        
        // Force end break
        forceEndBreak: (breakId: string) => 
            `${backendDomain}/api/v3/attendance/breaks/${breakId}/force-end`,
    },

    // Geofencing
    geofencing: {
        // Create geofence
        createGeofence: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/geofences`,
        
        // Get organization geofences
        getGeofences: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/geofences`,
        
        // Update geofence
        updateGeofence: (orgId: string, geofenceId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/geofences/${geofenceId}`,
        
        // Delete geofence
        deleteGeofence: (orgId: string, geofenceId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/geofences/${geofenceId}`,
        
        // Validate location
        validateLocation: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/geofences/validate`,
        
        // Get validation history
        getValidationHistory: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/geofences/validations`,
        
        // Get geofencing analytics
        getGeofencingAnalytics: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/geofences/analytics`,
        
        // Get nearby geofences
        getNearbyGeofences: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/geofences/nearby`,
        
        // Bulk import geofences
        bulkImportGeofences: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/geofences/bulk-import`,
    },

    // Alerts
    alerts: {
        // Get alert configuration
        getAlertConfig: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/alerts/config`,
        
        // Update alert configuration
        updateAlertConfig: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/alerts/config`,
        
        // Trigger manual alert
        triggerAlert: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/alerts/trigger`,
        
        // Get organization alerts
        getOrganizationAlerts: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/alerts`,
        
        // Get user alerts
        getUserAlerts: (userId: string) => 
            `${backendDomain}/api/v3/attendance/users/${userId}/alerts`,
        
        // Acknowledge alert
        acknowledgeAlert: (alertId: string) => 
            `${backendDomain}/api/v3/attendance/alerts/${alertId}/acknowledge`,
        
        // Bulk acknowledge alerts
        bulkAcknowledgeAlerts: `${backendDomain}/api/v3/attendance/alerts/bulk-acknowledge`,
        
        // Get alert statistics
        getAlertStatistics: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/alerts/statistics`,
        
        // Test alert system
        testAlertSystem: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/alerts/test`,
        
        // Cleanup old alerts
        cleanupOldAlerts: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/alerts/cleanup`,
    },

    // Analytics
    analytics: {
        // Get organization analytics
        getOrganizationAnalytics: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/analytics`,
        
        // Get employee analytics
        getEmployeeAnalytics: (orgId: string, userId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/employees/${userId}/analytics`,
        
        // Get attendance trends
        getAttendanceTrends: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/analytics/trends`,
        
        // Generate report
        generateReport: (orgId: string) => 
            `${backendDomain}/api/v3/attendance/organizations/${orgId}/analytics/reports`,
    },
};

// Export to add to the main API dictionary
export const updateAPIV3Dictionary = (existingDictionary: any) => ({
    ...existingDictionary,
    attendance: AttendanceAPIV3Dictionary,
});
