import { legacyBackendDomain } from '../../../constants/Domain';

export const APIV3Dictionary = {
    permission: `${legacyBackendDomain}/api/v3/permission`,
    payroll: {
        base: `${legacyBackendDomain}/api/v3/payroll`,
        getPayslip: (month: string | number, year: string | number, userId: string = 'undefined') => 
            `${legacyBackendDomain}/api/v3/payroll/payslip/${month}/${year}/${userId}`,
        getStatistics: (salaryRecordId: string) => 
            `${legacyBackendDomain}/api/v3/payroll/statistics/${salaryRecordId}`,
        generateSalary: (month: string | number, year: string | number, userId: string = 'undefined') => 
            `${legacyBackendDomain}/api/v3/payroll/salary-generate/${month}/${year}/${userId}`,
        downloadPayslip: (salaryRecordId: string) => 
            `${legacyBackendDomain}/api/v3/payroll/download/${salaryRecordId}`,
        preStatistics: (month: string | number, year: string | number, userId: string = 'undefined') =>
            `${legacyBackendDomain}/api/v3/payroll/pre-stats/${month}/${year}/${userId}`,
        customPayslip: {
            preview: `${legacyBackendDomain}/api/v3/payroll/custom/preview`,
            generate: `${legacyBackendDomain}/api/v3/payroll/custom/generate`,
        }
    }
};