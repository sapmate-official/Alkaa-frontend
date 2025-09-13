export interface Holiday {
  id: string
  name: string
  description?: string
  date: string
  isRecurring: boolean
  holidayTypeId: string
  organizationId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  holidayType: HolidayType
  affectedDepartments?: Department[]
  affectedRoles?: Role[]
}

export interface HolidayType {
  id: string
  name: string
  description?: string
  color: string
  isDefault: boolean
  organizationId?: string
  isPaid: boolean
  isOptional: boolean
  createdAt: string
  updatedAt: string
  holidays?: Holiday[]
  _count?: {
    holidays: number
  }
}

export interface CreateHolidayRequest {
  name: string
  description?: string
  date: string
  isRecurring?: boolean
  holidayTypeId: string
  departmentIds?: string[]
  roleIds?: string[]
  isActive?: boolean
}

export interface UpdateHolidayRequest {
  name?: string
  description?: string
  date?: string
  isRecurring?: boolean
  holidayTypeId?: string
  departmentIds?: string[]
  roleIds?: string[]
  isActive?: boolean
}

export interface CreateHolidayTypeRequest {
  name: string
  description?: string
  color: string
  isPaid?: boolean
  isOptional?: boolean
  isDefault?: boolean
}

export interface UpdateHolidayTypeRequest {
  name?: string
  description?: string
  color?: string
  isPaid?: boolean
  isOptional?: boolean
  isDefault?: boolean
}

export interface HolidayCalendarEntry {
  id: string
  name: string
  date: string
  type: HolidayType
  isRecurring: boolean
  isOptional: boolean
  isPaid: boolean
}

export interface Department {
  id: string
  name: string
}

export interface Role {
  id: string
  name: string
}
