import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import { OnboardingCandidate, OnboardingStatus } from '@/types/general'

// Query Keys
export const onboardingKeys = {
  all: ['onboarding'] as const,
  candidate: (id: string) => ['onboarding', 'candidate', id] as const,
  candidates: () => ['onboarding', 'candidates'] as const,
  review: (id: string) => ['onboarding', 'review', id] as const,
  departments: () => ['onboarding', 'departments'] as const,
}

// Types
export interface CandidateReviewData {
  candidateInfo: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobileNumber?: string;
    status: OnboardingStatus;
    createdAt: string;
    formSubmittedAt?: string;
  };
  initialData: {
    annualPackage?: number;
    hiredDate?: string;
    departmentId?: string;
    department?: any;
  };
  submittedData: {
    personalInfo: any;
    bankDetails: any;
    documents?: any;
    additionalInfo?: any;
  };
  reviewHistory: {
    reviewedBy?: any;
    reviewedAt?: string;
    rejectionReason?: string;
  };
  metadata: any;
}

export interface UpdateCandidateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  departmentId?: string;
  annualPackage?: number;
  hiredDate?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  address?: string;
  adharNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  accountHolderName?: string;
}

export interface ReviewCandidateRequest {
  action: 'approve' | 'request_changes' | 'reject';
  feedback?: string;
}

// API Functions
const onboardingApi = {
  // Get candidate details
  async getCandidate(id: string): Promise<OnboardingCandidate> {
    const response = await axios.get(`${APIDictionary.onboarding}/${id}`, {
      withCredentials: true
    })
    return response.data
  },

  // Get candidate review data
  async getCandidateReview(id: string): Promise<CandidateReviewData> {
    const response = await axios.get(`${APIDictionary.onboarding}/${id}/review`, {
      withCredentials: true
    })
    return response.data.data || response.data
  },

  // Update candidate
  async updateCandidate(id: string, data: UpdateCandidateRequest): Promise<OnboardingCandidate> {
    const response = await axios.put(`${APIDictionary.onboarding}/${id}`, data, {
      withCredentials: true
    })
    return response.data
  },

  // Approve candidate
  async approveCandidate(id: string): Promise<void> {
    await axios.post(`${APIDictionary.onboarding}/${id}/approve`, {}, {
      withCredentials: true
    })
  },

  // Request changes for candidate
  async requestChanges(id: string, feedback: string): Promise<void> {
    await axios.post(`${APIDictionary.onboarding}/${id}/request-changes`, { feedback }, {
      withCredentials: true
    })
  },

  // Reject candidate
  async rejectCandidate(id: string, reason: string): Promise<void> {
    await axios.post(`${APIDictionary.onboarding}/${id}/reject`, { reason }, {
      withCredentials: true
    })
  },

  // Mark candidate under review
  async markUnderReview(id: string): Promise<void> {
    await axios.post(`${APIDictionary.onboarding}/${id}/mark-review`, {}, {
      withCredentials: true
    })
  },

  // Get departments for organization
  async getDepartments(orgId: string): Promise<any[]> {
    const response = await axios.get(`${APIDictionary.department}/org/${orgId}`, {
      withCredentials: true
    })
    return response.data
  }
}

// Query Hooks
export function useCandidate(id: string) {
  return useQuery({
    queryKey: onboardingKeys.candidate(id),
    queryFn: () => onboardingApi.getCandidate(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCandidateReview(id: string) {
  return useQuery({
    queryKey: onboardingKeys.review(id),
    queryFn: () => onboardingApi.getCandidateReview(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useDepartments(orgId: string) {
  return useQuery({
    queryKey: onboardingKeys.departments(),
    queryFn: () => onboardingApi.getDepartments(orgId),
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Mutation Hooks
export function useUpdateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCandidateRequest }) =>
      onboardingApi.updateCandidate(id, data),
    onSuccess: (_, variables) => {
      // Invalidate candidate queries
      queryClient.invalidateQueries({ queryKey: onboardingKeys.candidate(variables.id) })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.review(variables.id) })
    },
  })
}

export function useApproveCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => onboardingApi.approveCandidate(id),
    onSuccess: (_, id) => {
      // Invalidate candidate queries
      queryClient.invalidateQueries({ queryKey: onboardingKeys.candidate(id) })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.review(id) })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.candidates() })
    },
  })
}

export function useRequestChanges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: string }) =>
      onboardingApi.requestChanges(id, feedback),
    onSuccess: (_, variables) => {
      // Invalidate candidate queries
      queryClient.invalidateQueries({ queryKey: onboardingKeys.candidate(variables.id) })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.review(variables.id) })
    },
  })
}

export function useRejectCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      onboardingApi.rejectCandidate(id, reason),
    onSuccess: (_, variables) => {
      // Invalidate candidate queries
      queryClient.invalidateQueries({ queryKey: onboardingKeys.candidate(variables.id) })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.review(variables.id) })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.candidates() })
    },
  })
}

export function useMarkUnderReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => onboardingApi.markUnderReview(id),
    onSuccess: (_, id) => {
      // Invalidate candidate queries
      queryClient.invalidateQueries({ queryKey: onboardingKeys.candidate(id) })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.review(id) })
    },
  })
}
