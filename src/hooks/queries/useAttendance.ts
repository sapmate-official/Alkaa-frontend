import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { attendanceApi } from '@/services/api/attendanceApi'
import { format } from 'date-fns'
import type { AttendanceRecord } from '@/types/general'
import { attendanceKeys } from './attendanceKeys'

// Today's Sessions Query
export const useTodaySessionsQuery = (date?: string) => {
  const queryDate = date || format(new Date(), 'yyyy-MM-dd')
  
  return useQuery<AttendanceRecord[]>({
    queryKey: attendanceKeys.sessions(queryDate),
    queryFn: () => attendanceApi.getTodaySessions(queryDate),
    staleTime: 1000 * 60, // 1 minute
  })
}

// Past Not Checked Days Query
export const usePastNotCheckedDaysQuery = () => {
  return useQuery<any[]>({
    queryKey: attendanceKeys.pastDays(),
    queryFn: attendanceApi.getPastNotCheckedDays,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Attendance History Query
export const useAttendanceHistoryQuery = (filters?: any) => {
  return useQuery({
    queryKey: attendanceKeys.history(filters),
    queryFn: () => attendanceApi.getAttendanceHistory(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Check-in Mutation
export const useCheckInMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: attendanceApi.checkIn,
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
    mutationFn: attendanceApi.checkOut,
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
    mutationFn: ({ attendanceId, updateData }: { attendanceId: string, updateData: any }) =>
      attendanceApi.updateAttendance(attendanceId, updateData),
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
    queryFn: attendanceApi.getLivePanel,
    staleTime: 1000 * 30, // 30 seconds for live data
    refetchInterval: 1000 * 60, // Auto-refetch every minute
  })
}

// Verification Queue Query (for managers)
export const useVerificationQueueQuery = () => {
  return useQuery({
    queryKey: attendanceKeys.verification(),
    queryFn: attendanceApi.getVerificationQueue,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Attendance Activity Feed Query
export const useAttendanceActivityQuery = (orgId?: string, params?: { limit?: number }) => {
  return useQuery({
    queryKey: attendanceKeys.activity(orgId || 'unknown', params),
    queryFn: () => {
      if (!orgId) {
        return Promise.resolve({ success: true, data: [], scope: 'SELF', pagination: { limit: params?.limit ?? 50, total: 0 } });
      }
      return attendanceApi.getAttendanceActivity(orgId, params)
    },
    enabled: Boolean(orgId),
    staleTime: 1000 * 60, // 1 minute
  })
}

// Approve/Reject Attendance Mutation
export const useAttendanceVerificationMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ attendanceId, action, remarks }: { attendanceId: string, action: 'approve' | 'reject', remarks?: string }) =>
      attendanceApi.verifyAttendance(attendanceId, action, remarks),
    onSuccess: () => {
      // Invalidate verification queue and history
      queryClient.invalidateQueries({ queryKey: attendanceKeys.verification() })
      queryClient.invalidateQueries({ queryKey: attendanceKeys.history() })
    },
  })
}

// Utility hooks for attendance
export const useDeviceInfo = () => {
  return {
    deviceInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    },
  };
};

export const useIpAddress = () => {
  const [ipAddress, setIpAddress] = useState<string>('');

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then((response) => response.json())
      .then((data) => setIpAddress(data.ip));
  }, []);

  return { ipAddress };
};

export const useGeolocation = () => {
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    }
  }, []);

  return { location };
};
