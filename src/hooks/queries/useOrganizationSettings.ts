import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'

export interface RawOrganizationSettingsType {
  id?: string
  orgId?: string
  settings?: {
    weekoff?: number[]
    timezone?: string
    workingHours?: string
    [key: string]: any
  }
  weekoff?: number[] // fallback legacy shape
  timezone?: string
  workingHours?: string
  createdAt?: string
  updatedAt?: string
}

export interface NormalizedOrgSettings {
  weekoff: number[]
  timezone: string
  workingHours: string
  raw: RawOrganizationSettingsType | RawOrganizationSettingsType[] | null
}

// Helper to normalize every possible backend response shape used previously
const normalizeSettings = (data: RawOrganizationSettingsType | RawOrganizationSettingsType[] | null): NormalizedOrgSettings => {
  let weekoff: number[] = []
  let timezone = 'Asia/Kolkata'
  let workingHours = '9:00 AM - 6:00 PM'

  if (Array.isArray(data)) {
    const item = data[0]
    if (item?.settings) {
      weekoff = item.settings.weekoff || []
      timezone = item.settings.timezone || timezone
      workingHours = item.settings.workingHours || workingHours
    } else {
      weekoff = item?.weekoff || weekoff
      timezone = item?.timezone || timezone
      workingHours = item?.workingHours || workingHours
    }
  } else if (data) {
    if (data.settings) {
      weekoff = data.settings.weekoff || []
      timezone = data.settings.timezone || timezone
      workingHours = data.settings.workingHours || workingHours
    } else {
      weekoff = data.weekoff || weekoff
      timezone = data.timezone || timezone
      workingHours = data.workingHours || workingHours
    }
  }

  return { weekoff, timezone, workingHours, raw: data }
}

export const orgSettingsQueryKey = (orgId?: string) => ['organization-settings', orgId]

export const useOrganizationSettingsQuery = (orgId?: string, enabled: boolean = true) => {
  return useQuery<NormalizedOrgSettings>({
    queryKey: orgSettingsQueryKey(orgId),
    enabled: !!orgId && enabled,
    queryFn: async () => {
      const settingsUrl = typeof APIDictionary.OrganizationSettings === 'function' 
        ? APIDictionary.OrganizationSettings() 
        : APIDictionary.OrganizationSettings
      const { data } = await axios.get(`${settingsUrl}/${orgId}`, { withCredentials: true })
      return normalizeSettings(data)
    },
    staleTime: 1000 * 60 * 5,
  })
}

interface SavePayload {
  orgId: string
  weekoff: number[]
  timezone: string
  workingHours: string
}

export const useSaveOrganizationSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orgId, weekoff, timezone, workingHours }: SavePayload) => {
      const settingsUrl = typeof APIDictionary.OrganizationSettings === 'function' 
        ? APIDictionary.OrganizationSettings() 
        : APIDictionary.OrganizationSettings
      await axios.put(`${settingsUrl}/${orgId}`, {
        settings: { weekoff, timezone, workingHours },
      })
      return { orgId, weekoff, timezone, workingHours }
    },
    onSuccess: (_data, vars) => {
      // Optimistic update: merge into cache
      qc.setQueryData<NormalizedOrgSettings>(orgSettingsQueryKey(vars.orgId), (old) => {
        if (!old) return {
          weekoff: vars.weekoff,
          timezone: vars.timezone,
          workingHours: vars.workingHours,
          raw: null,
        }
        return {
          ...old,
          weekoff: vars.weekoff,
          timezone: vars.timezone,
          workingHours: vars.workingHours,
        }
      })
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: orgSettingsQueryKey(vars.orgId) })
    }
  })
}

export const useResetOrganizationSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orgId: string) => {
      const settingsUrl = typeof APIDictionary.OrganizationSettings === 'function' 
        ? APIDictionary.OrganizationSettings() 
        : APIDictionary.OrganizationSettings
      await axios.post(`${settingsUrl}/reset/${orgId}`)
      const { data } = await axios.get(`${settingsUrl}/${orgId}`)
      return normalizeSettings(data)
    },
    onSuccess: (normalized, orgId) => {
      qc.setQueryData(orgSettingsQueryKey(orgId), normalized)
    },
  })
}
