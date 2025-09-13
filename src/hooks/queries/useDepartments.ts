import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import { useToast } from '@/hooks/use-toast'
import { User } from '@/types/general'

export interface Department {
  id: string
  name: string
  code: string
  description: string
  location: string
  budget: number
  status: boolean
  headId?: string
  departmentHead?: {
    firstName: string
    lastName: string
    email: string
    employeeId: string
    id?: string
  }
  users?: User[]
  [key: string]: any
}

// Query Keys
export const departmentQueryKeys = {
  all: ['departments'] as const,
  byOrg: (orgId: string) => ['departments', 'org', orgId] as const,
  detail: (id: string) => ['departments', 'detail', id] as const,
  employees: (id: string) => ['departments', id, 'employees'] as const,
}

export const useDepartmentsQuery = (orgId?: string, enabled: boolean = true) => {
  return useQuery<Department[]>({
    queryKey: departmentQueryKeys.byOrg(orgId || ''),
    enabled: !!orgId && enabled,
    queryFn: async () => {
      const { data } = await axios.get(`${APIDictionary.department}/org/${orgId}`, { withCredentials: true })
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

// Department Detail Query
export const useDepartmentQuery = (id: string) => {
  return useQuery({
    queryKey: departmentQueryKeys.detail(id),
    queryFn: async () => {
      const response = await axios.get(`${APIDictionary.department}/${id}`, {
        withCredentials: true
      })
      return response.data as Department
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Department Employees Query
export const useDepartmentEmployeesQuery = (departmentId: string) => {
  return useQuery({
    queryKey: departmentQueryKeys.employees(departmentId),
    queryFn: async () => {
      const response = await axios.get(`${APIDictionary.department}/${departmentId}/employees`, {
        withCredentials: true
      })
      return response.data
    },
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
  })
}

// Create Department Mutation
export const useCreateDepartmentMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (departmentData: Partial<Department>) => {
      const response = await axios.post(APIDictionary.department, departmentData, {
        withCredentials: true
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate departments list for the organization
      if (variables.orgId) {
        queryClient.invalidateQueries({
          queryKey: departmentQueryKeys.byOrg(variables.orgId)
        })
      }
      
      toast({
        title: "Success",
        description: "Department created successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error creating department:', error)
      toast({
        title: "Error",
        description: "Failed to create department. Please try again.",
        variant: "destructive"
      })
    }
  })
}

// Update Department Mutation
export const useUpdateDepartmentMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Department> }) => {
      const response = await axios.put(`${APIDictionary.department}/${id}`, data, {
        withCredentials: true
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate specific department and department list
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.detail(variables.id)
      })
      
      // Also invalidate the departments list
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.all
      })
      
      toast({
        title: "Success",
        description: "Department updated successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error updating department:', error)
      toast({
        title: "Error",
        description: "Failed to update department. Please try again.",
        variant: "destructive"
      })
    }
  })
}

// Delete Department Mutation
export const useDeleteDepartmentMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${APIDictionary.department}/${id}`, {
        withCredentials: true
      })
      return response.data
    },
    onSuccess: (_, departmentId) => {
      // Remove the department from cache
      queryClient.removeQueries({
        queryKey: departmentQueryKeys.detail(departmentId)
      })
      
      // Invalidate departments list
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.all
      })
      
      toast({
        title: "Success",
        description: "Department deleted successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error deleting department:', error)
      toast({
        title: "Error",
        description: "Failed to delete department. Please try again.",
        variant: "destructive"
      })
    }
  })
}

// Change Department Head Mutation
export const useChangeDepartmentHeadMutation = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ departmentId, userId }: { departmentId: string; userId: string }) => {
      const response = await axios.put(
        `${APIDictionary.department}/${departmentId}/head/${userId}`,
        {},
        { withCredentials: true }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate specific department
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.detail(variables.departmentId)
      })
      
      // Also invalidate the departments list
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.all
      })
      
      toast({
        title: "Success",
        description: "Department head updated successfully",
        variant: "default"
      })
    },
    onError: (error) => {
      console.error('Error updating department head:', error)
      toast({
        title: "Error",
        description: "Failed to update department head",
        variant: "destructive"
      })
    }
  })
}
