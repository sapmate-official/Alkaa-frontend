import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import { APIV2Dictionary } from '@/services/api/v2/Api2Dicts'

// Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  maxUsers: number;
  features?: any;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string | null;
  status: string;
  departmentId?: string;
  managerId?: string;
  department?: {
    id: string;
    name: string;
  };
  subordinates?: User[];
}

export interface OrganizationType {
  id: string;
  name: string;
  industry: string;
  subscriptionPlanId: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStart: string;
  subscriptionEnd: string;
  isActive: boolean;
  users: User[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  parentId?: string;
  users: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string | null;
}

export interface OrganizationChartData {
  chart: any[];
  isOrgAdmin: boolean;
}

// Query Keys
export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...organizationKeys.lists(), { filters }] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  departments: (orgId: string) => [...organizationKeys.all, 'departments', orgId] as const,
  teamMembers: (userId: string) => [...organizationKeys.all, 'teamMembers', userId] as const,
  subscriptionPlans: () => [...organizationKeys.all, 'subscriptionPlans'] as const,
  chart: (orgId: string, userId?: string) => [...organizationKeys.all, 'chart', orgId, userId] as const,
  managerChart: (orgId: string, userId?: string) => [...organizationKeys.all, 'managerChart', orgId, userId] as const,
}

// API Functions
const organizationApi = {
  async getOrganizationById(orgId: string): Promise<OrganizationType> {
    const response = await axios.get(`${APIDictionary.Organization}/${orgId}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getOrganizationDepartments(orgId: string): Promise<Department[]> {
    const response = await axios.get(`${APIDictionary.department}/org/${orgId}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getTeamMembers(): Promise<TeamMember[]> {
    const response = await axios.get(APIV2Dictionary.user.getSubordinateList(), { withCredentials: true })
    return response.data.data || response.data
  },

  async getAllOrganizations(filters?: Record<string, any>): Promise<OrganizationType[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.Organization}?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await axios.get(`${APIDictionary.Organization}/subscription-plans`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getOrganizationChart(orgId: string): Promise<any[]> {
    const response = await axios.get(APIDictionary.OrganizationChart(orgId), { withCredentials: true })
    return response.data.data || response.data
  },

  async getOrganizationManagerChart(orgId: string, userId?: string): Promise<OrganizationChartData> {
    const response = await axios.get(APIDictionary.OrganizationManagerChart(orgId, userId), { withCredentials: true })
    return response.data
  },

  async updateOrganization(data: Partial<OrganizationType>): Promise<OrganizationType> {
    const response = await axios.patch(APIDictionary.Organization, data, { withCredentials: true })
    return response.data.data || response.data
  },
}

// Query Hooks
export function useOrganization(orgId?: string, enabled: boolean = true) {
  return useQuery<OrganizationType>({
    queryKey: organizationKeys.detail(orgId || ''),
    queryFn: () => organizationApi.getOrganizationById(orgId || ''),
    enabled: !!orgId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useOrganizationDepartments(orgId?: string, enabled: boolean = true) {
  return useQuery<Department[]>({
    queryKey: organizationKeys.departments(orgId || ''),
    queryFn: () => organizationApi.getOrganizationDepartments(orgId || ''),
    enabled: !!orgId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTeamMembers(userId?: string, enabled: boolean = true) {
  return useQuery<TeamMember[]>({
    queryKey: organizationKeys.teamMembers(userId || ''),
    queryFn: () => organizationApi.getTeamMembers(),
    enabled: !!userId && enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useOrganizations(filters?: Record<string, any>) {
  return useQuery<OrganizationType[]>({
    queryKey: organizationKeys.list(filters || {}),
    queryFn: () => organizationApi.getAllOrganizations(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: organizationKeys.subscriptionPlans(),
    queryFn: () => organizationApi.getSubscriptionPlans(),
    staleTime: 1000 * 60 * 15, // 15 minutes - subscription plans don't change often
  })
}

export function useOrganizationChart(orgId?: string, enabled: boolean = true) {
  return useQuery<any[]>({
    queryKey: organizationKeys.chart(orgId || ''),
    queryFn: () => organizationApi.getOrganizationChart(orgId || ''),
    enabled: !!orgId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useOrganizationManagerChart(orgId?: string, userId?: string, enabled: boolean = true) {
  return useQuery<OrganizationChartData>({
    queryKey: organizationKeys.managerChart(orgId || '', userId),
    queryFn: () => organizationApi.getOrganizationManagerChart(orgId || '', userId),
    enabled: !!orgId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Mutation Hooks
export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<OrganizationType>) => organizationApi.updateOrganization(data),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.id) })
      }
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}
