import { useQuery } from '@tanstack/react-query'
import { permissionsApi } from '@/services/api/permissionsApi'
import type { Permission } from '@/types/general'

// Hook to fetch all permissions
export const usePermissions = () => {
  return useQuery<Permission[], Error>({
    queryKey: ['permissions'],
    queryFn: permissionsApi.getAllPermissions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
