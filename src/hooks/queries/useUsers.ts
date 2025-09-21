import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'

// Types
export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  department?: {
    id: string;
    name: string;
  };
}

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...userKeys.lists(), { filters }] as const,
  byOrganization: (orgId: string) => [...userKeys.all, 'organization', orgId] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

// API Functions
const userApi = {
  async getUsersByOrganization(orgId: string): Promise<User[]> {
    const response = await axios.get<User[]>(`${APIDictionary.user}/org/${orgId}`, {
      withCredentials: true,
    })
    return response.data
  },
}

// Query Hooks
export function useUsersByOrganization(orgId?: string, enabled: boolean = true) {
  return useQuery<User[]>({
    queryKey: userKeys.byOrganization(orgId || ''),
    queryFn: () => userApi.getUsersByOrganization(orgId || ''),
    enabled: !!orgId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  })
}

export default useUsersByOrganization
