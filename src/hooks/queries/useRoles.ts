import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import type { RawRole, Role } from './rolePayload'
import { normalizeRole, unwrapItem, unwrapList } from './rolePayload'

export type { Permission, Role } from './rolePayload'

export interface RoleHierarchy {
  id: string
  parentRoleId: string
  childRoleId: string
  level: number
}

export interface CreateRoleRequest {
  name: string
  description?: string
  permissions?: string[]
  isDefault?: boolean
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
  permissions?: string[]
  isDefault?: boolean
  updateType?: 'add' | 'remove' | 'replace'
}

export interface AssignPermissionsRequest {
  permissionIds: string[]
}

// Query Keys
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...roleKeys.lists(), { filters }] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  permissions: (roleId: string) => [...roleKeys.all, 'permissions', roleId] as const,
  hierarchy: () => [...roleKeys.all, 'hierarchy'] as const,
  userRoles: (userId: string) => [...roleKeys.all, 'user', userId] as const,
}

type RoleEnvelope = RawRole | { data?: RawRole }
type RoleListEnvelope = RawRole[] | { data?: RawRole[] }
type RoleMutationEnvelope = { success?: boolean; role?: RawRole } | RawRole

const unwrapRoleMutation = (payload: RoleMutationEnvelope): RawRole =>
  'role' in payload && payload.role ? payload.role : (payload as RawRole)

// API Functions
const rolesApi = {
  async getAllRoles(orgId?: string): Promise<Role[]> {
    if (!orgId) {
      throw new Error('Organization ID is required to fetch roles')
    }
    const response = await axios.get<RoleListEnvelope>(`${APIDictionary.role}/org/${orgId}`, {
      withCredentials: true,
    })
    return unwrapList(response.data).map(normalizeRole)
  },

  async getRoleById(id: string): Promise<Role> {
    const response = await axios.get<RoleEnvelope>(`${APIDictionary.role}/${id}`, {
      withCredentials: true,
    })
    return normalizeRole(unwrapItem(response.data))
  },

  async createRole(data: CreateRoleRequest & { orgId: string }): Promise<Role> {
    const response = await axios.post<RoleEnvelope>(APIDictionary.role, data, {
      withCredentials: true,
    })
    return normalizeRole(unwrapItem(response.data))
  },

  async updateRole(id: string, data: UpdateRoleRequest): Promise<Role> {
    const response = await axios.put<RoleEnvelope>(`${APIDictionary.role}/${id}`, data, {
      withCredentials: true,
    })
    return normalizeRole(unwrapItem(response.data))
  },

  async deleteRole(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.role}/${id}`, { withCredentials: true })
  },

  async assignPermissions(roleId: string, data: AssignPermissionsRequest): Promise<void> {
    await axios.post(
      `${APIDictionary.role_permission}`,
      {
        roleId,
        ...data,
      },
      { withCredentials: true }
    )
  },

  async removePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await axios.delete(`${APIDictionary.role_permission}`, {
      data: { roleId, permissionIds },
      withCredentials: true,
    })
  },

  async addPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await axios.post<RoleMutationEnvelope>(
      APIDictionary.roleAddPermissions(roleId),
      {
        permissions: permissionIds,
      },
      { withCredentials: true }
    )
    return normalizeRole(unwrapRoleMutation(response.data))
  },

  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await axios.post<RoleMutationEnvelope>(
      APIDictionary.roleRemovePermissions(roleId),
      {
        permissions: permissionIds,
      },
      { withCredentials: true }
    )
    return normalizeRole(unwrapRoleMutation(response.data))
  },

  async getRoleHierarchy(): Promise<RoleHierarchy[]> {
    const response = await axios.get<RoleHierarchy[] | { data?: RoleHierarchy[] }>(
      `${APIDictionary.role}/hierarchy`,
      { withCredentials: true }
    )
    return unwrapList(response.data)
  },

  async updateRoleHierarchy(hierarchy: Partial<RoleHierarchy>[]): Promise<void> {
    await axios.put(`${APIDictionary.role}/hierarchy`, { hierarchy }, { withCredentials: true })
  },

  async getUserRoles(userId: string): Promise<Role[]> {
    const response = await axios.get<RoleListEnvelope>(
      `${APIDictionary.user_role}/user/${userId}`,
      { withCredentials: true }
    )
    return unwrapList(response.data).map(normalizeRole)
  },

  async assignUserRole(userId: string, roleId: string): Promise<void> {
    await axios.post(APIDictionary.user_role, { userId, roleId }, { withCredentials: true })
  },

  async removeUserRole(userId: string, roleId: string): Promise<void> {
    await axios.delete(APIDictionary.user_role, {
      data: { userId, roleId },
      withCredentials: true,
    })
  },
}

// Query Hooks
export function useRoles(orgId?: string) {
  return useQuery<Role[]>({
    queryKey: roleKeys.list({ orgId: orgId || '' }),
    queryFn: () => rolesApi.getAllRoles(orgId),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useRole(id: string) {
  return useQuery<Role>({
    queryKey: roleKeys.detail(id),
    queryFn: () => rolesApi.getRoleById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRoleHierarchy() {
  return useQuery<RoleHierarchy[]>({
    queryKey: roleKeys.hierarchy(),
    queryFn: rolesApi.getRoleHierarchy,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useUserRoles(userId: string) {
  return useQuery<Role[]>({
    queryKey: roleKeys.userRoles(userId),
    queryFn: () => rolesApi.getUserRoles(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// Mutation Hooks
export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRoleRequest & { orgId: string }) => rolesApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) =>
      rolesApi.updateRole(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rolesApi.deleteRole,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: roleKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.hierarchy() })
    },
  })
}

export function useAssignPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: AssignPermissionsRequest }) =>
      rolesApi.assignPermissions(roleId, data),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

export function useRemovePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesApi.removePermissions(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

export function useUpdateRoleHierarchy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rolesApi.updateRoleHierarchy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.hierarchy() })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

export function useAssignUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      rolesApi.assignUserRole(userId, roleId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.userRoles(userId) })
    },
  })
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      rolesApi.removeUserRole(userId, roleId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.userRoles(userId) })
    },
  })
}

export function useAddPermissionsToRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesApi.addPermissionsToRole(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

export function useRemovePermissionsFromRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesApi.removePermissionsFromRole(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}
