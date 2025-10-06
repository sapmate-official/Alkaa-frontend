import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import type {
  ShiftTemplate,
  EmployeeShift,
  ShiftStatus,
  BreakRule,
  AttendanceRule,
  OvertimeRule
} from '@/types/shift'

const shiftTemplatesKey = (orgId?: string) => ['shift-templates', orgId] as const
const employeeShiftKey = (userId?: string) => ['employee-shift', userId] as const
const shiftRulesKey = (orgId?: string) => ['shift-rules', orgId] as const

export interface ShiftRulesResponse {
  breakRules: BreakRule[]
  attendanceRules: AttendanceRule[]
  overtimeRules: OvertimeRule[]
}

export const useShiftTemplates = (orgId?: string, enabled: boolean = true) => {
  return useQuery<ShiftTemplate[]>({
    queryKey: shiftTemplatesKey(orgId),
    enabled: !!orgId && enabled,
    queryFn: async () => {
      const { data } = await axios.get(APIDictionary.shift.templates.list(orgId!), {
        withCredentials: true
      })
      return data as ShiftTemplate[]
    },
    staleTime: 5 * 60 * 1000
  })
}

export const useShiftRules = (orgId?: string, enabled: boolean = true) => {
  return useQuery<ShiftRulesResponse>({
    queryKey: shiftRulesKey(orgId),
    enabled: !!orgId && enabled,
    queryFn: async () => {
      const { data } = await axios.get(APIDictionary.shift.rules.list(orgId!), {
        withCredentials: true
      })
      const response = data as ShiftRulesResponse
      return {
        breakRules: response.breakRules ?? [],
        attendanceRules: response.attendanceRules ?? [],
        overtimeRules: response.overtimeRules ?? []
      }
    },
    staleTime: 5 * 60 * 1000
  })
}

interface ShiftTemplatePayload {
  orgId: string
  name: string
  startTime: string
  endTime: string
  totalHours: number
  lateThreshold?: number
  breakRuleIds?: string[]
  attendanceRuleIds?: string[]
  overtimeRuleId?: string | null
  isActive?: boolean
}

interface UpdateShiftTemplatePayload extends Partial<Omit<ShiftTemplatePayload, 'orgId'>> {
  id: string
  orgId: string
}

export const useCreateShiftTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ShiftTemplatePayload) => {
      const { data } = await axios.post(APIDictionary.shift.templates.create, payload, {
        withCredentials: true
      })
      return data as ShiftTemplate
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: shiftTemplatesKey(variables.orgId) })
    }
  })
}

export const useUpdateShiftTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, orgId, ...payload }: UpdateShiftTemplatePayload) => {
      const { data } = await axios.put(APIDictionary.shift.templates.update(id), payload, {
        withCredentials: true
      })
      return data as ShiftTemplate
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: shiftTemplatesKey(variables.orgId) })
    }
  })
}

export const useDeleteShiftTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      await axios.delete(APIDictionary.shift.templates.remove(id), {
        withCredentials: true
      })
      return { id, orgId }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: shiftTemplatesKey(variables.orgId) })
    }
  })
}

export interface AssignShiftPayload {
  userId: string
  shiftTemplateId: string
  effectiveDate?: string
  endDate?: string | null
  status?: ShiftStatus
  overrides?: Record<string, unknown> | null
}

export const useAssignShift = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...payload }: AssignShiftPayload) => {
      const { data } = await axios.post(APIDictionary.shift.employee.assign(userId), payload, {
        withCredentials: true
      })
      return data as EmployeeShift
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeShiftKey(variables.userId) })
    }
  })
}

export const useEmployeeShift = (userId?: string, includeHistory: boolean = false, enabled: boolean = true) => {
  return useQuery<{ current: EmployeeShift | null; history?: EmployeeShift[] }>({
    queryKey: [...employeeShiftKey(userId), includeHistory] as const,
    enabled: !!userId && enabled,
    queryFn: async () => {
      const url = includeHistory
        ? `${APIDictionary.shift.employee.current(userId!)}?includeHistory=true`
        : APIDictionary.shift.employee.current(userId!)
      const { data } = await axios.get(url, {
        withCredentials: true
      })
      return data as { current: EmployeeShift | null; history?: EmployeeShift[] }
    },
    staleTime: 60 * 1000
  })
}

export const useUpdateShiftAssignment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ assignmentId, userId, ...payload }: { assignmentId: string; userId: string } & Partial<AssignShiftPayload>) => {
      const { data } = await axios.put(APIDictionary.shift.employee.updateAssignment(assignmentId), payload, {
        withCredentials: true
      })
      return data as EmployeeShift
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeShiftKey(variables.userId) })
    }
  })
}
