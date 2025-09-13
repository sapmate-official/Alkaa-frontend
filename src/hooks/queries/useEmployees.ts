import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '@/services/api/employees/employeesApi'
import type { CreateEmployeeRequest, UpdateEmployeeRequest } from '@/types/employees'
import { employeeKeys } from './employeeKeys'

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
