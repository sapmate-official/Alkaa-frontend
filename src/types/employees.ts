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
    roleId?: string
    role?: {
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
