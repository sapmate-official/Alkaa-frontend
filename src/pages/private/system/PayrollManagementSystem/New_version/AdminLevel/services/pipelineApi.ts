/**
 * Payroll Pipeline API Service
 * 
 * This service wraps the existing V3 Payroll APIs for use in the pipeline workflow.
 * It uses APIV3Dictionary endpoints to fetch salary records, approve/reject records,
 * and manage review workflows - reusing the existing payroll management system APIs.
 */

import axios from 'axios';
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts';
import type { PayrollCycleDetails } from '../../types/payroll';

// Re-export types from the main payroll types
export type { 
  PayrollCycleDetails,
  PayrollSalaryStatistics 
} from '../../types/payroll';

export interface CycleSalaryRecordsResponse {
  success: boolean;
  data: PayrollCycleDetails;
}

export interface ApproveRejectResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: string;
    reviewedAt: string;
    reviewComments?: string;
  };
}

/**
 * Fetch all salary records for a payroll cycle using V3 API
 * Uses: APIV3Dictionary.payroll.getCycleDetails(cycleId)
 */
export const fetchCycleSalaryRecords = async (cycleId: string): Promise<CycleSalaryRecordsResponse> => {
  const response = await axios.get<{ success: boolean; data: PayrollCycleDetails }>(
    APIV3Dictionary.payroll.getCycleDetails(cycleId),
    { withCredentials: true }
  );

  return {
    success: response.data.success,
    data: response.data.data
  };
};

/**
 * Approve an individual salary record using manager approval API
 * Uses: APIV3Dictionary.payroll.manager.approve(recordId)
 */
export const approveSalaryRecord = async (
  recordId: string,
  comments?: string
): Promise<ApproveRejectResponse> => {
  const response = await axios.post(
    APIV3Dictionary.payroll.manager.approve(recordId),
    { comments },
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Reject an individual salary record with comments using manager rejection API
 * Uses: APIV3Dictionary.payroll.manager.reject(recordId)
 */
export const rejectSalaryRecord = async (
  recordId: string,
  comments: string
): Promise<ApproveRejectResponse> => {
  if (!comments || comments.trim().length === 0) {
    throw new Error('Comments are required when rejecting a salary record');
  }

  const response = await axios.post(
    APIV3Dictionary.payroll.manager.reject(recordId),
    { comments: comments.trim() },
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Approve entire payroll cycle
 * Uses: APIV3Dictionary.payroll.approveCycle(cycleId)
 */
export const approveCycle = async (
  cycleId: string,
  comments?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post(
    APIV3Dictionary.payroll.approveCycle(cycleId),
    { comments },
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Submit cycle for review
 * Uses: APIV3Dictionary.payroll.submitCycle(cycleId)
 */
export const submitCycleForReview = async (
  cycleId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post(
    APIV3Dictionary.payroll.submitCycle(cycleId),
    {},
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Get detailed statistics for a salary record
 * Uses: APIV3Dictionary.payroll.getStatistics(salaryRecordId)
 */
export const fetchSalaryStatistics = async (salaryRecordId: string) => {
  const response = await axios.get(
    APIV3Dictionary.payroll.getStatistics(salaryRecordId),
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Recalculate salary for a single employee
 * Uses: APIV3Dictionary.payroll.generateSalary(month, year, userId)
 */
export const recalculateEmployeeSalary = async (
  month: number,
  year: number,
  userId: string
): Promise<{ success: boolean; message: string; data: any }> => {
  const response = await axios.post(
    APIV3Dictionary.payroll.generateSalary(month, year, userId),
    {},
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Bulk approve multiple salary records using manager bulk approval API
 * Uses: APIV3Dictionary.payroll.manager.bulkApprove
 */
export const bulkApproveSalaryRecords = async (
  recordIds: string[],
  comments?: string
): Promise<{ success: boolean; message: string; data: any }> => {
  const response = await axios.post(
    APIV3Dictionary.payroll.manager.bulkApprove,
    { recordIds, comments },
    { withCredentials: true }
  );

  return response.data;
};

// ============================================
// Pipeline Progress Management (UI State Only)
// ============================================

export interface PipelineProgressData {
  currentStep: number;
  stepData: {
    setupCompleted?: boolean;
    employeesSelected?: boolean;
    templateAssigned?: boolean;
    salariesProcessed?: boolean;
    reviewCompleted?: boolean;
    finalApproved?: boolean;
    [key: string]: any; // Allow additional custom fields
  };
  lastAccessedAt?: string;
  createdAt?: string;
}

export interface PipelineProgressResponse {
  success: boolean;
  data: PipelineProgressData | null;
  message?: string;
}

/**
 * Get saved pipeline progress for a specific month/year
 * Returns null if no progress exists
 */
export const getPipelineProgress = async (
  month: number,
  year: number
): Promise<PipelineProgressResponse> => {
  const response = await axios.get(
    APIV3Dictionary.payroll.pipeline.getProgress(month, year),
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Save pipeline progress for a specific month/year
 * Automatically creates or updates existing progress
 */
export const savePipelineProgress = async (
  month: number,
  year: number,
  currentStep: number,
  stepData: PipelineProgressData['stepData']
): Promise<{ success: boolean; message: string; data: any }> => {
  const response = await axios.post(
    APIV3Dictionary.payroll.pipeline.saveProgress,
    { month, year, currentStep, stepData },
    { withCredentials: true }
  );

  return response.data;
};

/**
 * Clear pipeline progress for a specific month/year
 * Typically called after final approval
 */
export const clearPipelineProgress = async (
  month: number,
  year: number
): Promise<{ success: boolean; message: string }> => {
  const response = await axios.delete(
    APIV3Dictionary.payroll.pipeline.clearProgress(month, year),
    { withCredentials: true }
  );

  return response.data;
};

export default {
  fetchCycleSalaryRecords,
  approveSalaryRecord,
  rejectSalaryRecord,
  approveCycle,
  submitCycleForReview,
  fetchSalaryStatistics,
  recalculateEmployeeSalary,
  bulkApproveSalaryRecords,
  getPipelineProgress,
  savePipelineProgress,
  clearPipelineProgress,
};
