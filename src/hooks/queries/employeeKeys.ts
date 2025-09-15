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
