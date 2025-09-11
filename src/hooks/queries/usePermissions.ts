import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/api/v2/APIdict'

// Types
export interface Permission {
  id: string
  name: string
  description?: string
  category: string
  action: string
  resource: string
  organizationId?: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface PermissionCategory {
  id: string
  name: string
  description?: string
  permissions: Permission[]
}

export interface PermissionPreset {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  isDefault: boolean
}

export interface CreatePermissionRequest {
  name: string
  description?: string
  category: string
  action: string
  resource: string
}

export interface UpdatePermissionRequest {
  name?: string
  description?: string
  category?: string
  action?: string
  resource?: string
}

export interface CreatePermissionPresetRequest {
  name: string
  description?: string
  permissionIds: string[]
  isDefault?: boolean
}

// Query Keys
export const permissionKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...permissionKeys.lists(), { filters }] as const,
  details: () => [...permissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...permissionKeys.details(), id] as const,
  categories: () => [...permissionKeys.all, 'categories'] as const,
  presets: () => [...permissionKeys.all, 'presets'] as const,
  preset: (id: string) => [...permissionKeys.presets(), id] as const,
  userPermissions: (userId: string) => [...permissionKeys.all, 'user', userId] as const,
}

// API Functions
const permissionsApi = {
  async getAllPermissions(filters?: Record<string, any>): Promise<Permission[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.Permission}?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getPermissionById(id: string): Promise<Permission> {
    const response = await axios.get(`${APIDictionary.Permission}/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async createPermission(data: CreatePermissionRequest): Promise<Permission> {
    const response = await axios.post(APIDictionary.Permission, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updatePermission(id: string, data: UpdatePermissionRequest): Promise<Permission> {
    const response = await axios.put(`${APIDictionary.Permission}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deletePermission(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.Permission}/${id}`, { withCredentials: true })
  },

  async getPermissionCategories(): Promise<PermissionCategory[]> {
    const response = await axios.get(`${APIDictionary.Permission}/categories`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getPermissionPresets(): Promise<PermissionPreset[]> {
    const response = await axios.get(APIDictionary.permissionPreset, { withCredentials: true })
    return response.data.data || response.data
  },

  async getPermissionPresetById(id: string): Promise<PermissionPreset> {
    const response = await axios.get(`${APIDictionary.permissionPreset}/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async createPermissionPreset(data: CreatePermissionPresetRequest): Promise<PermissionPreset> {
    const response = await axios.post(APIDictionary.permissionPreset, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updatePermissionPreset(id: string, data: Partial<CreatePermissionPresetRequest>): Promise<PermissionPreset> {
    const response = await axios.put(`${APIDictionary.permissionPreset}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deletePermissionPreset(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.permissionPreset}/${id}`, { withCredentials: true })
  },

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const response = await axios.get(`${APIDictionary.user}/${userId}/permissions`, { withCredentials: true })
    return response.data.data || response.data
  }
}

// Query Hooks
export function usePermissions(filters?: Record<string, any>) {
  return useQuery<Permission[]>({
    queryKey: permissionKeys.list(filters || {}),
    queryFn: () => permissionsApi.getAllPermissions(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions change less frequently
  })
}

export function usePermission(id: string) {
  return useQuery<Permission>({
    queryKey: permissionKeys.detail(id),
    queryFn: () => permissionsApi.getPermissionById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

export function usePermissionCategories() {
  return useQuery<PermissionCategory[]>({
    queryKey: permissionKeys.categories(),
    queryFn: permissionsApi.getPermissionCategories,
    staleTime: 15 * 60 * 1000, // 15 minutes - categories are relatively static
  })
}

export function usePermissionPresets() {
  return useQuery<PermissionPreset[]>({
    queryKey: permissionKeys.presets(),
    queryFn: permissionsApi.getPermissionPresets,
    staleTime: 10 * 60 * 1000,
  })
}

export function usePermissionPreset(id: string) {
  return useQuery<PermissionPreset>({
    queryKey: permissionKeys.preset(id),
    queryFn: () => permissionsApi.getPermissionPresetById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

export function useUserPermissions(userId: string) {
  return useQuery<Permission[]>({
    queryKey: permissionKeys.userPermissions(userId),
    queryFn: () => permissionsApi.getUserPermissions(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - user permissions might change more frequently
  })
}

// Mutation Hooks
export function useCreatePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: permissionsApi.createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: permissionKeys.categories() })
    },
  })
}

export function useUpdatePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePermissionRequest }) =>
      permissionsApi.updatePermission(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: permissionKeys.categories() })
    },
  })
}

export function useDeletePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: permissionsApi.deletePermission,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: permissionKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: permissionKeys.categories() })
      queryClient.invalidateQueries({ queryKey: permissionKeys.presets() })
    },
  })
}

export function useCreatePermissionPreset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: permissionsApi.createPermissionPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.presets() })
    },
  })
}

export function useUpdatePermissionPreset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePermissionPresetRequest> }) =>
      permissionsApi.updatePermissionPreset(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.preset(id) })
      queryClient.invalidateQueries({ queryKey: permissionKeys.presets() })
    },
  })
}

export function useDeletePermissionPreset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: permissionsApi.deletePermissionPreset,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: permissionKeys.preset(deletedId) })
      queryClient.invalidateQueries({ queryKey: permissionKeys.presets() })
    },
  })
}
