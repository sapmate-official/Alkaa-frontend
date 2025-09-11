import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/api/v2/APIdict'
import type { Permission } from '@/interface/general'

// Hook to fetch all permissions
export const usePermissions = () => {
  return useQuery<Permission[], Error>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await axios.get(APIDictionary.Permission, { withCredentials: true })
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
