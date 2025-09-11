import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/api/v2/APIdict'
import { format } from 'date-fns'
import { AttendanceRecord } from '@/interface/general'

// Query Keys
export const attendanceKeys = {
  all: ['attendance'] as const,
  sessions: (date: string) => [...attendanceKeys.all, 'sessions', date] as const,
  history: (filters?: any) => [...attendanceKeys.all, 'history', filters] as const,
  pastDays: () => [...attendanceKeys.all, 'past-days'] as const,
  livePanel: () => [...attendanceKeys.all, 'live-panel'] as const,
  verification: () => [...attendanceKeys.all, 'verification'] as const,
}

// Today's Sessions Query
export const useTodaySessionsQuery = (date?: string) => {
  const queryDate = date || format(new Date(), 'yyyy-MM-dd')
  
  return useQuery<AttendanceRecord[]>({
    queryKey: attendanceKeys.sessions(queryDate),
    queryFn: async () => {
      const { data } = await axios.get(`${APIDictionary.todaySessions}${queryDate}`, {
        withCredentials: true
      })
      return data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Past Not Checked Days Query
export const usePastNotCheckedDaysQuery = () => {
  return useQuery<any[]>({
    queryKey: attendanceKeys.pastDays(),
    queryFn: async () => {
      const { data } = await axios.get(`${APIDictionary.attendance}/check-out/past`, {
        withCredentials: true
      })
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Attendance History Query
export const useAttendanceHistoryQuery = (filters?: any) => {
  return useQuery({
    queryKey: attendanceKeys.history(filters),
    queryFn: async () => {
      const { data } = await axios.get(APIDictionary.attendanceHistory, {
        params: filters,
        withCredentials: true
      })
      return data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Check-in Mutation
export const useCheckInMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (checkInData: any) => {
      const { data } = await axios.post(APIDictionary.checkIn, checkInData, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      })
      return data
    },
    onSuccess: () => {
      // Invalidate today's sessions to refetch
      const today = format(new Date(), 'yyyy-MM-dd')
      queryClient.invalidateQueries({ queryKey: attendanceKeys.sessions(today) })
      queryClient.invalidateQueries({ queryKey: attendanceKeys.history() })
    },
  })
}

// Check-out Mutation
export const useCheckOutMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (checkOutData: any) => {
      const { data } = await axios.post(APIDictionary.checkOut, checkOutData, {
        withCredentials: true
      })
      return data
    },
    onSuccess: () => {
      // Invalidate today's sessions and past days
      const today = format(new Date(), 'yyyy-MM-dd')
      queryClient.invalidateQueries({ queryKey: attendanceKeys.sessions(today) })
      queryClient.invalidateQueries({ queryKey: attendanceKeys.pastDays() })
      queryClient.invalidateQueries({ queryKey: attendanceKeys.history() })
    },
  })
}

// Attendance Update/Edit Mutation (for past days regularization)
export const useAttendanceUpdateMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ attendanceId, updateData }: { attendanceId: string, updateData: any }) => {
      const { data } = await axios.put(`${APIDictionary.attendance}/${attendanceId}`, updateData, {
        withCredentials: true
      })
      return data
    },
    onSuccess: () => {
      // Invalidate all attendance-related queries
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}

// Live Panel Query (for managers)
export const useLivePanelQuery = () => {
  return useQuery({
    queryKey: attendanceKeys.livePanel(),
    queryFn: async () => {
      const { data } = await axios.get(`${APIDictionary.attendance}/live`, {
        withCredentials: true
      })
      return data
    },
    staleTime: 1000 * 30, // 30 seconds for live data
    refetchInterval: 1000 * 60, // Auto-refetch every minute
  })
}

// Verification Queue Query (for managers)
export const useVerificationQueueQuery = () => {
  return useQuery({
    queryKey: attendanceKeys.verification(),
    queryFn: async () => {
      const { data } = await axios.get(`${APIDictionary.attendance}/verification`, {
        withCredentials: true
      })
      return data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Approve/Reject Attendance Mutation
export const useAttendanceVerificationMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ attendanceId, action, remarks }: { attendanceId: string, action: 'approve' | 'reject', remarks?: string }) => {
      const { data } = await axios.patch(`${APIDictionary.attendance}/${attendanceId}/verify`, {
        action,
        remarks
      }, {
        withCredentials: true
      })
      return data
    },
    onSuccess: () => {
      // Invalidate verification queue and history
      queryClient.invalidateQueries({ queryKey: attendanceKeys.verification() })
      queryClient.invalidateQueries({ queryKey: attendanceKeys.history() })
    },
  })
}
