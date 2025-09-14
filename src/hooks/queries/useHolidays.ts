import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { holidaysApi, holidayTypesApi } from '@/services/api/holidayApi'
import { holidayKeys, holidayTypeKeys } from '@/hooks/keys/holidayKeys'
import type { 
  Holiday, 
  HolidayType, 
  CreateHolidayRequest,
  UpdateHolidayRequest, 
  CreateHolidayTypeRequest,
  UpdateHolidayTypeRequest, 
  HolidayCalendarEntry 
} from '@/types/holiday.types'

// Export types
export type { Holiday, HolidayType, CreateHolidayRequest, UpdateHolidayRequest, CreateHolidayTypeRequest, UpdateHolidayTypeRequest, HolidayCalendarEntry }

// Export keys
export { holidayKeys, holidayTypeKeys }

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
