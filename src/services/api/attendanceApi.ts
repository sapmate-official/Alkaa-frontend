import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import type { AttendanceRecord } from '@/types/general'

export interface AttendanceHistoryFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface CheckInPayload {
  clientTimestamp?: string;
  clientTimezone?: string;
  location?: { latitude: number; longitude: number; address?: string };
  notes?: string;
  [key: string]: unknown;
}

export interface CheckOutPayload {
  clientTimestamp?: string;
  clientTimezone?: string;
  location?: { latitude: number; longitude: number; address?: string };
  notes?: string;
  [key: string]: unknown;
}

export interface VerificationQueueItem {
  id: string;
  userId: string;
  user?: { name: string; email: string };
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  [key: string]: unknown;
}

export const attendanceApi = {
  async getTodaySessions(date: string): Promise<AttendanceRecord[]> {
    const { data } = await axios.get(`${APIDictionary.todaySessions}${date}`, {
      withCredentials: true
    })
    return data
  },

  async getPastNotCheckedDays(): Promise<Record<string, unknown>[]> {
    const { data } = await axios.get(`${APIDictionary.attendance}/check-out/past`, {
      withCredentials: true
    })
    return data
  },

  async getAttendanceHistory(filters?: AttendanceHistoryFilters): Promise<AttendanceRecord[] | Record<string, unknown>> {
    const { data } = await axios.get(APIDictionary.attendanceHistory, {
      params: filters,
      withCredentials: true
    })
    return data
  },

  async checkIn(checkInData: CheckInPayload): Promise<AttendanceRecord> {
    const { data } = await axios.post(APIDictionary.checkIn, checkInData, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    })
    return data
  },

  async checkOut(checkOutData: CheckOutPayload): Promise<AttendanceRecord & { session?: AttendanceRecord; dailyTotal?: { hours: number; minutes: number } }> {
    const { data } = await axios.post(APIDictionary.checkOut, checkOutData, {
      withCredentials: true
    })
    return data
  },

  async updateAttendance(attendanceId: string, updateData: Partial<AttendanceRecord> | Record<string, unknown>): Promise<AttendanceRecord> {
    const { data } = await axios.put(`${APIDictionary.attendance}/${attendanceId}`, updateData, {
      withCredentials: true
    })
    return data
  },

  async getLivePanel(): Promise<Record<string, unknown>> {
    const { data } = await axios.get(`${APIDictionary.attendance}/live`, {
      withCredentials: true
    })
    return data
  },

  async getVerificationQueue(): Promise<VerificationQueueItem[]> {
    const { data } = await axios.get(`${APIDictionary.attendance}/verification`, {
      withCredentials: true
    })
    return data
  },

  async verifyAttendance(attendanceId: string, action: 'approve' | 'reject', remarks?: string): Promise<Record<string, unknown>> {
    const { data } = await axios.patch(`${APIDictionary.attendance}/${attendanceId}/verify`, {
      action,
      remarks
    }, {
      withCredentials: true
    })
    return data
  }
}
