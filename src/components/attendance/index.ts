// Main attendance components
export { default as AttendanceDashboard } from './AttendanceDashboard';

// Rules management
export { default as AttendanceRulesManager } from './rules/AttendanceRulesManager';

// Break management
export { default as BreakManagement } from './breaks/BreakManagement';

// Geofencing
export { default as GeofencingManagement } from './geofencing/GeofencingManagement';

// Re-export services and hooks for convenience
export * from '../../services/AttendanceService';
export * from '../../hooks/useAttendance';
