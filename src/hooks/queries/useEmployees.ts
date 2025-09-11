import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/api/v2/APIdict'

// Types
export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  employeeId?: string
  status: 'active' | 'inactive' | 'suspended'
  department?: {
    id: string
    name: string
  }
  roles?: {
    role: {
      id: string
      name: string
      permissions?: {
        permission: {
          id: string
          name: string
          description?: string
        }
      }[]
    }
  }[]
  createdAt: string
  managerId?: string
  manager?: {
    id: string
    firstName: string
    lastName: string
  }
  phone?: string
  position?: string
  hireDate?: string
  organizationId: string
}

export interface CreateEmployeeRequest {
  firstName: string
  lastName: string
  email: string
  employeeId?: string
  departmentId?: string
  managerId?: string
  phone?: string
  position?: string
  hireDate?: string
}

export interface UpdateEmployeeRequest {
  firstName?: string
  lastName?: string
  email?: string
  employeeId?: string
  status?: 'active' | 'inactive' | 'suspended'
  departmentId?: string
  managerId?: string
  phone?: string
  position?: string
  hireDate?: string
}

export interface AssignEmployeeRoleRequest {
  employeeId: string
  roleId: string
}

// Query Keys
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...employeeKeys.lists(), { filters }] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  byDepartment: (departmentId: string) => [...employeeKeys.all, 'department', departmentId] as const,
  byManager: (managerId: string) => [...employeeKeys.all, 'manager', managerId] as const,
  roles: (employeeId: string) => [...employeeKeys.all, 'roles', employeeId] as const,
}

// API Functions
const employeesApi = {
  // Employee CRUD
  async getAllEmployees(filters?: Record<string, any>): Promise<Employee[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.user}?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getEmployeeById(id: string): Promise<Employee> {
    const response = await axios.get(`${APIDictionary.user}/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    const response = await axios.post(APIDictionary.user, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<Employee> {
    const response = await axios.put(`${APIDictionary.user}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteEmployee(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.user}/${id}`, { withCredentials: true })
  },

  // Department-based queries
  async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    const response = await axios.get(`${APIDictionary.user}?departmentId=${departmentId}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getEmployeesByManager(managerId: string): Promise<Employee[]> {
    const response = await axios.get(`${APIDictionary.employee_list}?managerId=${managerId}`, { withCredentials: true })
    return response.data.data || response.data
  },

  // Role management
  async getEmployeeRoles(employeeId: string): Promise<any[]> {
    const response = await axios.get(`${APIDictionary.user_role}/user/${employeeId}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async assignEmployeeDepartment(employeeId: string, departmentId: string): Promise<void> {
    await axios.put(`${APIDictionary.user}/${employeeId}/department/${departmentId}`, {}, { withCredentials: true })
  },

  async assignEmployeeRole(employeeId: string, roleId: string): Promise<void> {
    await axios.post(APIDictionary.user_role, { userId: employeeId, roleId }, { withCredentials: true })
  },

  async removeEmployeeRole(employeeId: string, roleId: string): Promise<void> {
    await axios.delete(APIDictionary.user_role, {
      data: { userId: employeeId, roleId },
      withCredentials: true
    })
  },

  // Status management
  async updateEmployeeStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<Employee> {
    const response = await axios.put(`${APIDictionary.user}/${id}`, { status }, { withCredentials: true })
    return response.data.data || response.data
  },
}

// Query Hooks
export function useEmployees(filters?: Record<string, any>) {
  return useQuery({
    queryKey: employeeKeys.list(filters || {}),
    queryFn: () => employeesApi.getAllEmployees(filters),
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeesApi.getEmployeeById(id),
    enabled: !!id,
  })
}

export function useEmployeesByDepartment(departmentId: string) {
  return useQuery({
    queryKey: employeeKeys.byDepartment(departmentId),
    queryFn: () => employeesApi.getEmployeesByDepartment(departmentId),
    enabled: !!departmentId,
  })
}

export function useEmployeesByManager(managerId: string) {
  return useQuery({
    queryKey: employeeKeys.byManager(managerId),
    queryFn: () => employeesApi.getEmployeesByManager(managerId),
    enabled: !!managerId,
  })
}

export function useEmployeeRoles(employeeId: string) {
  return useQuery({
    queryKey: employeeKeys.roles(employeeId),
    queryFn: () => employeesApi.getEmployeeRoles(employeeId),
    enabled: !!employeeId,
  })
}

// Mutation Hooks
export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEmployeeRequest) => employeesApi.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) =>
      employeesApi.updateEmployee(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employeesApi.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useAssignEmployeeDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ employeeId, departmentId }: { employeeId: string; departmentId: string }) =>
      employeesApi.assignEmployeeDepartment(employeeId, departmentId),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useAssignEmployeeRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ employeeId, roleId }: { employeeId: string; roleId: string }) =>
      employeesApi.assignEmployeeRole(employeeId, roleId),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.roles(employeeId) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useRemoveEmployeeRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ employeeId, roleId }: { employeeId: string; roleId: string }) =>
      employeesApi.removeEmployeeRole(employeeId, roleId),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.roles(employeeId) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'suspended' }) =>
      employeesApi.updateEmployeeStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
