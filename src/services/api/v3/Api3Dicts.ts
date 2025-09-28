
import { AttendanceAPIV3Dictionary } from './AttendanceAPI';
import { backendDomain } from '../../../constants/Domain';

export const APIV3Dictionary = {
    permission: `${backendDomain}/api/v3/permission`,
    payroll: {
        // Basic payroll operations
        getPayslip: (month: string | number, year: string | number, userId: string = 'undefined') => 
            `${backendDomain}/api/v3/payroll/payslip/${month}/${year}/${userId}`,
        getStatistics: (salaryRecordId: string) => 
            `${backendDomain}/api/v3/payroll/statistics/${salaryRecordId}`,
        generateSalary: (month: string | number, year: string | number, userId: string = 'undefined') => 
            `${backendDomain}/api/v3/payroll/salary-generate/${month}/${year}/${userId}`,
        downloadPayslip: (salaryRecordId: string) => 
            `${backendDomain}/api/v3/payroll/download/${salaryRecordId}`,
        preStatistics: (month: string | number, year: string | number, userId: string = 'undefined') =>
            `${backendDomain}/api/v3/payroll/pre-stats/${month}/${year}/${userId}`,
        checkMultipleStatus: `${backendDomain}/api/v3/payroll/check-multiple-status`,
        
        // Cycle management endpoints (IMPLEMENTED)
        createCycle: `${backendDomain}/api/v3/payroll/cycle/create`,
        cycles: `${backendDomain}/api/v3/payroll/cycles`,
        cyclesReview: `${backendDomain}/api/v3/payroll/cycles/review`,
        statistics: `${backendDomain}/api/v3/payroll/statistics`,
        startCycle: (cycleId: string) => `${backendDomain}/api/v3/payroll/cycle/start/${cycleId}`,
        approveCycle: (cycleId: string) => `${backendDomain}/api/v3/payroll/cycle/approve/${cycleId}`,
        getCycleDetails: (cycleId: string) => `${backendDomain}/api/v3/payroll/cycle/${cycleId}`,
        bulkGenerate: `${backendDomain}/api/v3/payroll/bulk-generate`,
        dashboard: `${backendDomain}/api/v3/payroll/dashboard`,
        
        // Template management endpoints (IMPLEMENTED)
        templates: {
            list: `${backendDomain}/api/v3/payroll/templates`,
            create: `${backendDomain}/api/v3/payroll/templates`,
            update: (templateId: string) => `${backendDomain}/api/v3/payroll/templates/${templateId}`,
            delete: (templateId: string) => `${backendDomain}/api/v3/payroll/templates/${templateId}`,
            assign: `${backendDomain}/api/v3/payroll/templates/assign`,
            rules: `${backendDomain}/api/v3/payroll/templates/calculation-rules`,
            updateRule: (ruleId: string) => `${backendDomain}/api/v3/payroll/templates/calculation-rules/${ruleId}`,
            deleteRule: (ruleId: string) => `${backendDomain}/api/v3/payroll/templates/calculation-rules/${ruleId}`,
            assignmentSummary: `${backendDomain}/api/v3/payroll/templates/assignment-summary`,
            assignmentTargets: `${backendDomain}/api/v3/payroll/templates/assignment-targets`,
        },
        
        // Employee self-service endpoints (Using V2 endpoints where available)
        employee: {
            profile: (userId: string) => `${backendDomain}/api/v2/user/${userId}`,
            updateProfile: (userId: string) => `${backendDomain}/api/v2/user/${userId}`,
            bankDetails: (userId: string) => `${backendDomain}/api/v2/bank-details/user/${userId}`,
            updateBankDetails: `${backendDomain}/api/v2/bank-details/`,
            createBankDetails: `${backendDomain}/api/v2/bank-details/`,
            payslips: `${backendDomain}/api/v3/payroll/payslip`,
            disputes: `${backendDomain}/api/v3/payroll/employee/disputes`,
            submitDispute: `${backendDomain}/api/v3/payroll/employee/disputes`,
            notifications: `${backendDomain}/api/v3/payroll/employee/notifications`,
        },
        
        // Manager review endpoints (IMPLEMENTED)
        manager: {
            teamPayroll: `${backendDomain}/api/v3/payroll/manager/team-payroll`,
            teamStatistics: `${backendDomain}/api/v3/payroll/manager/team-statistics`,
            approve: (recordId: string) => `${backendDomain}/api/v3/payroll/manager/approve/${recordId}`,
            reject: (recordId: string) => `${backendDomain}/api/v3/payroll/manager/reject/${recordId}`,
            bulkApprove: `${backendDomain}/api/v3/payroll/manager/bulk-approve`,
            pendingReview: `${backendDomain}/api/v3/payroll/manager/pending-review`,
        },
        
        // Workflow management endpoints (IMPLEMENTED)
        workflow: {
            status: `${backendDomain}/api/v3/payroll/workflow/status`,
            steps: `${backendDomain}/api/v3/payroll/workflow/steps`,
            progress: `${backendDomain}/api/v3/payroll/workflow/progress`,
            updateStep: (stepId: string) => `${backendDomain}/api/v3/payroll/workflow/steps/${stepId}`,
            initialize: `${backendDomain}/api/v3/payroll/workflow/initialize`,
        },
        
        // Integration endpoints (TODO: Backend implementation needed)
        integrations: {
            attendance: `${backendDomain}/api/v3/payroll/integrations/attendance`,
            banking: `${backendDomain}/api/v3/payroll/integrations/banking`,
            tax: `${backendDomain}/api/v3/payroll/integrations/tax`,
            notifications: `${backendDomain}/api/v3/payroll/integrations/notifications`,
        },
    },
    attendance: AttendanceAPIV3Dictionary
};