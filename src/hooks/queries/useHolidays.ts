import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/api/v2/APIdict'

// Types
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

// Query Keys
export const holidayKeys = {
  all: ['holidays'] as const,
  lists: () => [...holidayKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...holidayKeys.lists(), { filters }] as const,
  details: () => [...holidayKeys.all, 'detail'] as const,
  detail: (id: string) => [...holidayKeys.details(), id] as const,
  calendar: (year?: number, month?: number) => [...holidayKeys.all, 'calendar', { year, month }] as const,
  upcoming: () => [...holidayKeys.all, 'upcoming'] as const,
  byOrg: (orgId: string) => [...holidayKeys.all, 'organization', orgId] as const,
}

export const holidayTypeKeys = {
  all: ['holidayTypes'] as const,
  lists: () => [...holidayTypeKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...holidayTypeKeys.lists(), { filters }] as const,
  details: () => [...holidayTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...holidayTypeKeys.details(), id] as const,
  byOrg: (orgId: string) => [...holidayTypeKeys.all, 'organization', orgId] as const,
}

// API Functions
const holidaysApi = {
  async getAllHolidays(filters?: Record<string, any>): Promise<Holiday[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.holiday}?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getHolidayById(id: string): Promise<Holiday> {
    const response = await axios.get(`${APIDictionary.holiday}/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getHolidaysByOrg(orgId: string): Promise<Holiday[]> {
    const response = await axios.get(APIDictionary.holiday_by_org(orgId), { withCredentials: true })
    return response.data.data || response.data
  },

  async createHoliday(data: CreateHolidayRequest): Promise<Holiday> {
    const response = await axios.post(APIDictionary.holiday, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateHoliday(id: string, data: UpdateHolidayRequest): Promise<Holiday> {
    const response = await axios.put(`${APIDictionary.holiday}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteHoliday(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.holiday}/${id}`, { withCredentials: true })
  },

  async getHolidayCalendar(year?: number, month?: number): Promise<HolidayCalendarEntry[]> {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (month) params.append('month', month.toString())
    
    const response = await axios.get(`${APIDictionary.holiday}/calendar?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getUpcomingHolidays(limit?: number): Promise<Holiday[]> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    
    const response = await axios.get(`${APIDictionary.holiday}/upcoming?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async bulkCreateHolidays(holidays: CreateHolidayRequest[]): Promise<Holiday[]> {
    const response = await axios.post(`${APIDictionary.holiday}/bulk`, { holidays }, { withCredentials: true })
    return response.data.data || response.data
  },

  async toggleHolidayStatus(id: string, isActive: boolean): Promise<Holiday> {
    const response = await axios.patch(`${APIDictionary.holiday}/${id}/toggle`, { isActive }, { withCredentials: true })
    return response.data.data || response.data
  }
}

const holidayTypesApi = {
  async getAllHolidayTypes(): Promise<HolidayType[]> {
    const response = await axios.get(APIDictionary.holiday_type, { withCredentials: true })
    return response.data.data || response.data
  },

  async getHolidayTypeById(id: string): Promise<HolidayType> {
    const response = await axios.get(`${APIDictionary.holiday_type}/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getHolidayTypesByOrg(orgId: string): Promise<HolidayType[]> {
    const response = await axios.get(APIDictionary.holiday_type_by_org(orgId), { withCredentials: true })
    return response.data.data || response.data
  },

  async createHolidayType(data: CreateHolidayTypeRequest): Promise<HolidayType> {
    const response = await axios.post(APIDictionary.holiday_type, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateHolidayType(id: string, data: UpdateHolidayTypeRequest): Promise<HolidayType> {
    const response = await axios.put(`${APIDictionary.holiday_type}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteHolidayType(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.holiday_type}/${id}`, { withCredentials: true })
  },

  async setDefaultHolidayType(id: string): Promise<HolidayType> {
    const response = await axios.patch(`${APIDictionary.holiday_type}/${id}/default`, {}, { withCredentials: true })
    return response.data.data || response.data
  }
}

// Query Hooks - Holidays
export function useHolidays(filters?: Record<string, any>) {
  return useQuery<Holiday[]>({
    queryKey: holidayKeys.list(filters || {}),
    queryFn: () => holidaysApi.getAllHolidays(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes - holidays don't change frequently
  })
}

export function useHoliday(id: string) {
  return useQuery<Holiday>({
    queryKey: holidayKeys.detail(id),
    queryFn: () => holidaysApi.getHolidayById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

export function useHolidaysByOrg(orgId: string) {
  return useQuery<Holiday[]>({
    queryKey: holidayKeys.byOrg(orgId),
    queryFn: () => holidaysApi.getHolidaysByOrg(orgId),
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useHolidayCalendar(year?: number, month?: number) {
  return useQuery<HolidayCalendarEntry[]>({
    queryKey: holidayKeys.calendar(year, month),
    queryFn: () => holidaysApi.getHolidayCalendar(year, month),
    staleTime: 15 * 60 * 1000, // 15 minutes - calendar view changes less frequently
  })
}

export function useUpcomingHolidays(limit?: number) {
  return useQuery<Holiday[]>({
    queryKey: holidayKeys.upcoming(),
    queryFn: () => holidaysApi.getUpcomingHolidays(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes - upcoming holidays might be more relevant
  })
}

// Query Hooks - Holiday Types
export function useHolidayTypes() {
  return useQuery<HolidayType[]>({
    queryKey: holidayTypeKeys.lists(),
    queryFn: holidayTypesApi.getAllHolidayTypes,
    staleTime: 15 * 60 * 1000, // 15 minutes - types change rarely
  })
}

export function useHolidayType(id: string) {
  return useQuery<HolidayType>({
    queryKey: holidayTypeKeys.detail(id),
    queryFn: () => holidayTypesApi.getHolidayTypeById(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
  })
}

export function useHolidayTypesByOrg(orgId: string) {
  return useQuery<HolidayType[]>({
    queryKey: holidayTypeKeys.byOrg(orgId),
    queryFn: () => holidayTypesApi.getHolidayTypesByOrg(orgId),
    enabled: !!orgId,
    staleTime: 15 * 60 * 1000,
  })
}

// Mutation Hooks - Holidays
export function useCreateHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: holidaysApi.createHoliday,
    onSuccess: (newHoliday) => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.calendar() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.upcoming() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.byOrg(newHoliday.organizationId) })
      queryClient.invalidateQueries({ queryKey: holidayTypeKeys.detail(newHoliday.holidayTypeId) })
    },
  })
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHolidayRequest }) =>
      holidaysApi.updateHoliday(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.calendar() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.upcoming() })
    },
  })
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: holidaysApi.deleteHoliday,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: holidayKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.calendar() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.upcoming() })
      queryClient.invalidateQueries({ queryKey: holidayTypeKeys.lists() })
    },
  })
}

export function useBulkCreateHolidays() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: holidaysApi.bulkCreateHolidays,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.calendar() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.upcoming() })
      queryClient.invalidateQueries({ queryKey: holidayTypeKeys.lists() })
    },
  })
}

export function useToggleHolidayStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      holidaysApi.toggleHolidayStatus(id, isActive),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.calendar() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.upcoming() })
    },
  })
}

// Mutation Hooks - Holiday Types
export function useCreateHolidayType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: holidayTypesApi.createHolidayType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayTypeKeys.lists() })
    },
  })
}

export function useUpdateHolidayType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHolidayTypeRequest }) =>
      holidayTypesApi.updateHolidayType(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: holidayTypeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: holidayTypeKeys.lists() })
      // Also invalidate holidays that use this type
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() })
    },
  })
}

export function useDeleteHolidayType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: holidayTypesApi.deleteHolidayType,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: holidayTypeKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: holidayTypeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() })
    },
  })
}

export function useSetDefaultHolidayType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: holidayTypesApi.setDefaultHolidayType,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: holidayTypeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: holidayTypeKeys.lists() })
    },
  })
}
