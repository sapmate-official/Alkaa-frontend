import { useState } from 'react';
import axios from 'axios';
import { APIV3Dictionary } from '../services/api/v3/Api3Dicts';
import { PayslipPDFGenerator, PayslipData } from '../utils/payslipPDFGenerator';

// Import the PayrollStatistics interface
interface PayrollStatistics {
  basicInfo: {
    month: number;
    year: number;
    monthName: string;
    processedAt?: string;
    status: string;
    paymentInfo: {
      mode?: string;
      reference?: string;
    };
    employee: {
      name: string;
      employeeId?: string;
      department?: string;
      email?: string;
    };
  };
  salaryBreakdown: {
    basicSalary: number;
    totalAllowances: number;
    additionalPayments: {
      incentive: number;
      bonus: number;
    };
    deductions: Array<{
      type: string;
      amount: number;
    }>;
    totalDeductions: number;
    taxAmount: number;
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

  /**
   * Fetch payslip data optimized for PDF generation
   */
  const fetchPayslipData = async (salaryRecordId: string): Promise<PayslipData> => {
    try {
      // Use the new PDF data endpoint that's optimized for frontend generation
      const response = await axios.get(
        APIV3Dictionary.payroll.getPDFData(salaryRecordId),
        { withCredentials: true }
      );

      if (!response.data.success) {
        // Fallback to statistics endpoint if PDF data endpoint fails
        console.warn('PDF data endpoint failed, falling back to statistics endpoint');
        const fallbackResponse = await axios.get(
          APIV3Dictionary.payroll.getStatistics(salaryRecordId),
          { withCredentials: true }
        );
        
        if (!fallbackResponse.data.success) {
          throw new Error(fallbackResponse.data.message || 'Failed to fetch payslip data');
        }
        
        // Transform statistics data (existing logic)
        return transformStatisticsToPayslipData(fallbackResponse.data.data);
      }

      // Transform the backend response to match our PayslipData interface
      const statistics = response.data.data;
      return transformStatisticsToPayslipData(statistics);

    } catch (error) {
      console.error('Error fetching payslip data:', error);
      throw new Error('Failed to fetch payslip data for PDF generation');
    }
  };

  /**
   * Transform statistics data to PayslipData format (fallback method)
   */
  const transformStatisticsToPayslipData = (statistics: PayrollStatistics): PayslipData => {
    const month = statistics.basicInfo.month;
    const year = statistics.basicInfo.year;
    const effectiveWorkingDays = statistics.attendanceAnalysis.totalDays || 160;
    const basicRate = effectiveWorkingDays > 0
      ? statistics.salaryBreakdown.basicSalary / effectiveWorkingDays
      : statistics.salaryBreakdown.basicSalary;
    
    return {
      // Basic Information
      month,
      year,
      monthName: statistics.basicInfo.monthName,
      payDate: statistics.basicInfo.processedAt 
        ? new Date(statistics.basicInfo.processedAt).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB'),
      period: `M${month.toString().padStart(2, '0')}${year}`,
      status: statistics.basicInfo.status,
      paymentMode: statistics.basicInfo.paymentInfo.mode || 'MANUAL',
      paymentRef: statistics.basicInfo.paymentInfo.reference,

      // Employee Information
      employee: {
        name: statistics.basicInfo.employee.name,
        employeeId: statistics.basicInfo.employee.employeeId || 'N/A',
        department: statistics.basicInfo.employee.department || 'N/A',
        email: statistics.basicInfo.employee.email || 'N/A',
        bankDetails: undefined // This might need to be added to the backend response
      },

      // Company Information (placeholder)
      company: {
        name: 'Company Name',
        address: 'Company Address',
        email: 'company@example.com',
        phone: '+1234567890'
      },

      // Financial Information
      basicSalary: statistics.salaryBreakdown.basicSalary,
      grossPay: statistics.salaryBreakdown.grossSalary,
      totalDeductions: statistics.salaryBreakdown.totalDeductions + statistics.salaryBreakdown.taxAmount,
      netSalary: statistics.salaryBreakdown.netSalary,

      // Earnings breakdown
      earnings: {
        basicSalary: {
          description: 'Basic Salary',
          hours: effectiveWorkingDays,
          rate: basicRate,
          current: statistics.salaryBreakdown.basicSalary,
          ytd: statistics.salaryBreakdown.basicSalary * month
        },
        allowances: statistics.salaryBreakdown.totalAllowances > 0 ? [{
          description: 'Allowances',
          current: statistics.salaryBreakdown.totalAllowances,
          ytd: statistics.salaryBreakdown.totalAllowances * month
        }] : [],
        additionalPayments: [
          ...(statistics.salaryBreakdown.additionalPayments.incentive > 0 ? [{
            description: 'Incentive',
            current: statistics.salaryBreakdown.additionalPayments.incentive,
            ytd: statistics.salaryBreakdown.additionalPayments.incentive * month
          }] : []),
          ...(statistics.salaryBreakdown.additionalPayments.bonus > 0 ? [{
            description: 'Bonus',
            current: statistics.salaryBreakdown.additionalPayments.bonus,
            ytd: statistics.salaryBreakdown.additionalPayments.bonus * month
          }] : [])
        ]
      },

      // Deductions
      deductions: [
        ...statistics.salaryBreakdown.deductions.map(deduction => ({
          description: deduction.type,
          current: deduction.amount,
          ytd: deduction.amount * month
        })),
        ...(statistics.salaryBreakdown.taxAmount > 0 ? [{
          description: 'Tax',
          current: statistics.salaryBreakdown.taxAmount,
          ytd: statistics.salaryBreakdown.taxAmount * month
        }] : [])
      ],

      // Attendance
      attendance: {
        workingDays: statistics.attendanceAnalysis.totalDays,
        presentDays: statistics.attendanceAnalysis.presentDays,
        halfDays: 0, // This might need to be added to backend
        absentDays: statistics.attendanceAnalysis.absentDays,
        paidLeaveDays: statistics.attendanceAnalysis.leaveDays,
        unpaidLeaveDays: 0, // This might need to be added to backend
        attendancePercentage: statistics.attendanceAnalysis.totalDays > 0 
          ? (statistics.attendanceAnalysis.presentDays / statistics.attendanceAnalysis.totalDays) * 100 
          : 0
      },

      // YTD Information
      ytd: {
        grossPay: statistics.salaryBreakdown.grossSalary * month,
        totalDeductions: (statistics.salaryBreakdown.totalDeductions + statistics.salaryBreakdown.taxAmount) * month,
        netSalary: statistics.salaryBreakdown.netSalary * month
      }
    };
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
      const payslipData = transformStatisticsToPayslipData(payrollStats);
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
