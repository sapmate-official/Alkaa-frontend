import { useState } from 'react';
import axios from 'axios';
import { APIV3Dictionary } from '../services/api/v3/Api3Dicts';
import { PayslipPDFGenerator, PayslipData } from '../utils/payslipPDFGenerator';

// Import the PayrollStatistics interface
interface PayrollStatistics {
  basicInfo: {
    employeeId: string;
    name: string;
    email: string;
    department: string;
  };
  salaryBreakdown: {
    basicSalary: number;
    allowances: Array<{
      type: string;
      amount: number;
    }>;
    deductions: Array<{
      type: string;
      amount: number;
    }>;
    grossSalary: number;
    netSalary: number;
  };
  attendanceAnalysis: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
  };
}

export interface UsePayslipPDFProps {
  payslipData?: PayslipData | null;
}

export interface UsePayslipPDFReturn {
  generatePayslipPDF: (salaryRecordId: string) => Promise<void>;
  generatePayslipPDFWithParams: (
    userId: string, 
    organizationId: string, 
    monthQuery: string, 
    yearQuery: string, 
    showPreview?: boolean
  ) => Promise<void>;
  generatePDFFromData: (payslipData: PayslipData) => void;
  fetchPayslipData: (salaryRecordId: string) => Promise<PayslipData>;
  isGenerating: boolean;
  previewData: PayslipData | null;
  error: string | null;
}

export const usePayslipPDF = (): UsePayslipPDFReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<PayslipData | null>(null);
  const [error, setError] = useState<string | null>(null);


  const fetchPayslipData = async (salaryRecordId: string): Promise<PayslipData> => {
    try {
      const response = await axios.get(
        APIV3Dictionary.payroll.getStatistics(salaryRecordId),
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch payslip data');
      }

      // Transform the backend response to match our PayslipData interface
      const statistics = response.data.data;
      
      // Extract organization data from the response
      const orgData = statistics.basicInfo.organization || {};
      
      const transformedData: PayslipData = {
        // Basic Information
        month: statistics.basicInfo.month,
        year: statistics.basicInfo.year,
        monthName: statistics.basicInfo.monthName,
        payDate: statistics.basicInfo.processedAt 
          ? new Date(statistics.basicInfo.processedAt).toLocaleDateString('en-GB')
          : new Date().toLocaleDateString('en-GB'),
        period: `M${statistics.basicInfo.month.toString().padStart(2, '0')}${statistics.basicInfo.year}`,
        status: statistics.basicInfo.status,
        paymentMode: statistics.basicInfo.paymentInfo.mode || 'MANUAL',
        paymentRef: statistics.basicInfo.paymentInfo.reference,

        // Employee Information
        employee: {
          name: statistics.basicInfo.employee.name,
          employeeId: statistics.basicInfo.employee.employeeId || 'N/A',
          department: statistics.basicInfo.employee.department || 'N/A',
          email: statistics.basicInfo.employee.email || 'N/A',
          bankDetails: statistics.basicInfo.employee.bankDetails ? {
            bankName: statistics.basicInfo.employee.bankDetails.bankName || 'N/A',
            accountNumber: statistics.basicInfo.employee.bankDetails.accountNumber || 'N/A',
            ifscCode: statistics.basicInfo.employee.bankDetails.ifscCode || 'N/A'
          } : undefined
        },

        // Company Information - Use actual organization data from backend
        company: {
          name: orgData.name || 'Company Name',
          address: orgData.address || 'Company Address',
          email: orgData.email || 'hr@company.com',
          phone: orgData.phone || orgData.contactNumber || 'Company Phone'
        },

        // Financial Data
        basicSalary: statistics.salaryBreakdown.basicSalary,
        grossPay: statistics.salaryBreakdown.basicSalary + 
                 statistics.salaryBreakdown.totalAllowances +
                 statistics.salaryBreakdown.additionalPayments.incentive +
                 statistics.salaryBreakdown.additionalPayments.bonus,
        totalDeductions: statistics.salaryBreakdown.totalDeductions + statistics.salaryBreakdown.taxAmount,
        netSalary: statistics.salaryBreakdown.netSalary,

        // Earnings Breakdown
        earnings: {
          basicSalary: {
            description: 'Basic Salary',
            hours: statistics.attendanceAnalysis.workingDays,
            rate: statistics.salaryBreakdown.basicSalary / statistics.attendanceAnalysis.workingDays,
            current: statistics.salaryBreakdown.basicSalary,
            ytd: statistics.salaryBreakdown.basicSalary * statistics.basicInfo.month
          },
          allowances: Object.entries(statistics.salaryBreakdown.allowanceDetails).map(([key, value]) => ({
            description: key.toUpperCase(),
            current: value as number,
            ytd: (value as number) * statistics.basicInfo.month
          })),
          additionalPayments: [
            ...(statistics.salaryBreakdown.additionalPayments.incentive > 0 ? [{
              description: 'Incentive',
              current: statistics.salaryBreakdown.additionalPayments.incentive,
              ytd: statistics.salaryBreakdown.additionalPayments.incentive * statistics.basicInfo.month
            }] : []),
            ...(statistics.salaryBreakdown.additionalPayments.bonus > 0 ? [{
              description: 'Bonus',
              current: statistics.salaryBreakdown.additionalPayments.bonus,
              ytd: statistics.salaryBreakdown.additionalPayments.bonus * statistics.basicInfo.month
            }] : [])
          ]
        },

        // Deductions Breakdown
        deductions: [
          ...Object.entries(statistics.salaryBreakdown.deductionDetails).map(([key, value]) => ({
            description: key.toUpperCase(),
            current: value as number,
            ytd: (value as number) * statistics.basicInfo.month
          })),
          ...(statistics.salaryBreakdown.taxAmount > 0 ? [{
            description: 'Tax',
            current: statistics.salaryBreakdown.taxAmount,
            ytd: statistics.salaryBreakdown.taxAmount * statistics.basicInfo.month
          }] : [])
        ],

        // Attendance Information
        attendance: {
          workingDays: statistics.attendanceAnalysis.workingDays,
          presentDays: statistics.attendanceAnalysis.presentDays,
          halfDays: statistics.attendanceAnalysis.halfDays,
          absentDays: statistics.attendanceAnalysis.absentDays,
          paidLeaveDays: statistics.attendanceAnalysis.paidLeaveDays,
          unpaidLeaveDays: statistics.attendanceAnalysis.unpaidLeaveDays,
          attendancePercentage: statistics.attendanceAnalysis.attendancePercentage
        },

        // YTD Information
        ytd: {
          grossPay: (statistics.salaryBreakdown.basicSalary + 
                    statistics.salaryBreakdown.totalAllowances +
                    statistics.salaryBreakdown.additionalPayments.incentive +
                    statistics.salaryBreakdown.additionalPayments.bonus) * statistics.basicInfo.month,
          totalDeductions: (statistics.salaryBreakdown.totalDeductions + statistics.salaryBreakdown.taxAmount) * statistics.basicInfo.month,
          netSalary: statistics.salaryBreakdown.netSalary * statistics.basicInfo.month
        }
      };

      return transformedData;
    } catch (error) {
      console.error('Error fetching payslip data:', error);
      throw new Error('Failed to fetch payslip data for PDF generation');
    }
  };

  /**
   * Generate and show PDF preview modal by salary record ID
   */
  const generatePayslipPDF = async (salaryRecordId: string) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Fetch the payslip data from backend
      const payslipData = await fetchPayslipData(salaryRecordId);
      setPreviewData(payslipData);
      
      // Generate and show preview modal
      PayslipPDFGenerator.showPreviewModal(payslipData);
      
    } catch (error) {
      console.error('Error generating payslip PDF:', error);
      setError((error as Error).message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Transform PayrollStatistics to PayslipData format
   */
  const transformPayrollStatsToPayslipData = (stats: PayrollStatistics): PayslipData => {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    return {
      month,
      year,
      monthName: currentDate.toLocaleString('default', { month: 'long' }),
      payDate: currentDate.toLocaleDateString(),
      period: `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`,
      status: "Paid",
      paymentMode: "Bank Transfer",
      paymentRef: `PAY${year}${month.toString().padStart(2, '0')}${stats.basicInfo.employeeId}`,
      company: {
        name: "Alkaa Technologies",
        address: "123 Business Street, City, State 12345",
        phone: "+1 (555) 123-4567",
        email: "hr@alkaa.com"
      },
      employee: {
        name: stats.basicInfo.name,
        employeeId: stats.basicInfo.employeeId,
        email: stats.basicInfo.email,
        department: stats.basicInfo.department
      },
      basicSalary: stats.salaryBreakdown.basicSalary,
      grossPay: stats.salaryBreakdown.grossSalary,
      totalDeductions: stats.salaryBreakdown.deductions.reduce((sum, d) => sum + d.amount, 0),
      netSalary: stats.salaryBreakdown.netSalary,
      earnings: {
        basicSalary: {
          description: "Basic Salary",
          hours: stats.attendanceAnalysis.totalDays,
          rate: stats.salaryBreakdown.basicSalary / stats.attendanceAnalysis.totalDays,
          current: stats.salaryBreakdown.basicSalary,
          ytd: stats.salaryBreakdown.basicSalary * 12
        },
        allowances: stats.salaryBreakdown.allowances.map(allowance => ({
          description: allowance.type,
          current: allowance.amount,
          ytd: allowance.amount * 12
        })),
        additionalPayments: []
      },
      deductions: stats.salaryBreakdown.deductions.map(deduction => ({
        description: deduction.type,
        current: deduction.amount,
        ytd: deduction.amount * 12
      })),
      attendance: {
        workingDays: stats.attendanceAnalysis.totalDays,
        presentDays: stats.attendanceAnalysis.presentDays,
        halfDays: 0,
        absentDays: stats.attendanceAnalysis.absentDays,
        paidLeaveDays: stats.attendanceAnalysis.leaveDays,
        unpaidLeaveDays: 0,
        attendancePercentage: (stats.attendanceAnalysis.presentDays / stats.attendanceAnalysis.totalDays) * 100
      },
      ytd: {
        grossPay: stats.salaryBreakdown.grossSalary * 12,
        totalDeductions: stats.salaryBreakdown.deductions.reduce((sum, d) => sum + d.amount, 0) * 12,
        netSalary: stats.salaryBreakdown.netSalary * 12
      }
    };
  };

  /**
   * Generate PDF with individual parameters (alternative method)
   */
  const generatePayslipPDFWithParams = async (
    userId: string, 
    _organizationId: string, // Currently not used but kept for API compatibility
    monthQuery: string, 
    yearQuery: string, 
    showPreview: boolean = true
  ) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Use the getPayslip endpoint with individual parameters
      const response = await axios.get(
        APIV3Dictionary.payroll.getPayslip(monthQuery, yearQuery, userId),
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch payslip data');
      }

      const payrollStats: PayrollStatistics = response.data.data;
      const payslipData = transformPayrollStatsToPayslipData(payrollStats);
      setPreviewData(payslipData);
      
      if (showPreview) {
        PayslipPDFGenerator.showPreviewModal(payslipData);
      } else {
        PayslipPDFGenerator.generatePDF(payslipData);
      }
      
    } catch (error) {
      console.error('Error generating payslip PDF with params:', error);
      setError((error as Error).message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate PDF from existing data (without modal)
   */
  const generatePDFFromData = (payslipData: PayslipData) => {
    try {
      setIsGenerating(true);
      PayslipPDFGenerator.generatePDF(payslipData);
    } catch (error) {
      console.error('Error generating PDF from data:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePayslipPDF,
    generatePayslipPDFWithParams,
    generatePDFFromData,
    fetchPayslipData,
    isGenerating,
    previewData,
    error
  };
};
