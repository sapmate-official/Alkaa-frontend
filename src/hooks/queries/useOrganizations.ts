import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import { APIV2Dictionary } from '@/services/api/v2/Api2Dicts'
import { backendDomain } from '@/constants/Domain'

// The TS backend exposes the organization module under /api/v1/organization.
const organizationBase = `${backendDomain}/api/v1/organization`

// Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  maxUsers: number;
  features?: unknown;
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

export interface OrganizationCounts {
  users: number;
  departments: number;
  roles: number;
  admins: number;
}

export interface OrganizationType {
  id: string;
  name: string;
  industry: string | null;
  logo: string | null;
  address: string | null;
  timezone: string | null;
  subscriptionPlanId?: string | null;
  subscriptionStart: string;
  subscriptionEnd: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  counts: OrganizationCounts;
  settings?: Record<string, unknown>;
  // Legacy shapes kept for screens that have not been migrated yet.
  subscriptionPlan?: SubscriptionPlan | null;
  users?: User[];
  departments?: Department[];
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
  chart: unknown[];
  isOrgAdmin: boolean;
}

export interface OrganizationAdmin {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  department: { id: string; name: string } | null;
  roles: string[];
  createdAt: string;
}

export interface OrganizationAdminAssignment {
  id: string;
  userId: string;
  orgId: string;
  roleId: string;
}

const ORGANIZATION_WRITABLE_FIELDS = [
  'name',
  'industry',
  'logo',
  'address',
  'timezone',
  'subscriptionPlanId',
  'subscriptionStart',
  'subscriptionEnd',
  'isActive',
  'settings'
] as const;

const toWritePayload = (data: Partial<OrganizationType>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  const record = data as unknown as Record<string, unknown>;
  for (const field of ORGANIZATION_WRITABLE_FIELDS) {
    const value = record[field];
    if (value !== undefined) {
      payload[field] = value;
    }
  }
  return payload;
};

// Query Keys
export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...organizationKeys.lists(), { filters }] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  legacyDetail: (id: string) => [...organizationKeys.all, 'legacyDetail', id] as const,
  admins: (orgId: string) => [...organizationKeys.all, 'admins', orgId] as const,
  departments: (orgId: string) => [...organizationKeys.all, 'departments', orgId] as const,
  teamMembers: (userId: string) => [...organizationKeys.all, 'teamMembers', userId] as const,
  subscriptionPlans: () => [...organizationKeys.all, 'subscriptionPlans'] as const,
  chart: (orgId: string, userId?: string) => [...organizationKeys.all, 'chart', orgId, userId] as const,
  managerChart: (orgId: string, userId?: string) => [...organizationKeys.all, 'managerChart', orgId, userId] as const,
}

// API Functions
const organizationApi = {
  async getOrganizationById(orgId: string): Promise<OrganizationType> {
    const response = await axios.get(`${organizationBase}/${orgId}`, { withCredentials: true })
    return response.data
  },

  async getAllOrganizations(filters?: Record<string, unknown>): Promise<OrganizationType[]> {
    const params = new URLSearchParams()
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    })
    const query = params.toString()
    const response = await axios.get(
      query ? `${organizationBase}?${query}` : organizationBase,
      { withCredentials: true }
    )
    return response.data.data || []
  },

  async createOrganization(data: Partial<OrganizationType>): Promise<OrganizationType> {
    const response = await axios.post(organizationBase, toWritePayload(data), {
      withCredentials: true
    })
    return response.data
  },

  async updateOrganization(orgId: string, data: Partial<OrganizationType>): Promise<OrganizationType> {
    const response = await axios.patch(`${organizationBase}/${orgId}`, toWritePayload(data), {
      withCredentials: true
    })
    return response.data
  },

  async deleteOrganization(orgId: string): Promise<void> {
    await axios.delete(`${organizationBase}/${orgId}`, { withCredentials: true })
  },

  async getOrganizationAdmins(orgId: string): Promise<OrganizationAdmin[]> {
    const response = await axios.get(`${organizationBase}/${orgId}/admins`, {
      withCredentials: true
    })
    return response.data.data || []
  },

  async setOrganizationAdmin(orgId: string, userId: string): Promise<OrganizationAdminAssignment> {
    const response = await axios.post(
      `${organizationBase}/${orgId}/admins`,
      { userId },
      { withCredentials: true }
    )
    return response.data
  },

  async removeOrganizationAdmin(orgId: string, userId: string): Promise<void> {
    await axios.delete(`${organizationBase}/${orgId}/admins/${userId}`, {
      withCredentials: true
    })
  },

  // Legacy endpoints (not yet ported to the TS backend).
  async getLegacyOrganizationById(orgId: string): Promise<OrganizationType> {
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

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await axios.get(`${APIDictionary.Organization}/subscription-plans`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getOrganizationChart(orgId: string): Promise<unknown[]> {
    const response = await axios.get(APIDictionary.OrganizationChart(orgId), { withCredentials: true })
    return response.data.data || response.data
  },

  async getOrganizationManagerChart(orgId: string, userId?: string): Promise<OrganizationChartData> {
    const response = await axios.get(APIDictionary.OrganizationManagerChart(orgId, userId), { withCredentials: true })
    return response.data
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

export function useLegacyOrganization(orgId?: string, enabled: boolean = true) {
  return useQuery<OrganizationType>({
    queryKey: organizationKeys.legacyDetail(orgId || ''),
    queryFn: () => organizationApi.getLegacyOrganizationById(orgId || ''),
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

export function useOrganizations(filters?: Record<string, unknown>) {
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
  return useQuery<unknown[]>({
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

export function useOrganizationAdmins(orgId?: string, enabled: boolean = true) {
  return useQuery<OrganizationAdmin[]>({
    queryKey: organizationKeys.admins(orgId || ''),
    queryFn: () => organizationApi.getOrganizationAdmins(orgId || ''),
    enabled: !!orgId && enabled,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Mutation Hooks
export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<OrganizationType>) => organizationApi.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<OrganizationType> & { id: string }) =>
      organizationApi.updateOrganization(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orgId: string) => organizationApi.deleteOrganization(orgId),
    onSuccess: (_, orgId) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(orgId) })
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

export function useSetOrganizationAdmin(orgId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => organizationApi.setOrganizationAdmin(orgId || '', userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.admins(orgId || '') })
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(orgId || '') })
    },
  })
}

export function useRemoveOrganizationAdmin(orgId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => organizationApi.removeOrganizationAdmin(orgId || '', userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.admins(orgId || '') })
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(orgId || '') })
    },
  })
}
