
import { AttendanceAPIV3Dictionary } from './AttendanceAPI';
import { backendDomain } from '../../../constants/Domain';

export const APIV3Dictionary = {
    permission: `${backendDomain}/api/v3/permission`,
    payroll: {
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
    },
    attendance: AttendanceAPIV3Dictionary
};