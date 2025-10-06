import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import type { AttendanceRecord } from '@/types/general'

export const attendanceApi = {
  async getTodaySessions(date: string): Promise<AttendanceRecord[]> {
    const { data } = await axios.get(`${APIDictionary.todaySessions}${date}`, {
      withCredentials: true
    })
    return data
  },

  async getPastNotCheckedDays(): Promise<any[]> {
    const { data } = await axios.get(`${APIDictionary.attendance}/check-out/past`, {
      withCredentials: true
    })
    return data
  },

  async getAttendanceHistory(filters?: any): Promise<any> {
    const { data } = await axios.get(APIDictionary.attendanceHistory, {
      params: filters,
      withCredentials: true
    })
    return data
  },

  async checkIn(checkInData: any): Promise<any> {
    const { data } = await axios.post(APIDictionary.checkIn, checkInData, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    })
    return data
  },

  async checkOut(checkOutData: any): Promise<any> {
    const { data } = await axios.post(APIDictionary.checkOut, checkOutData, {
      withCredentials: true
    })
    return data
  },

  async updateAttendance(attendanceId: string, updateData: any): Promise<any> {
    const { data } = await axios.put(`${APIDictionary.attendance}/${attendanceId}`, updateData, {
      withCredentials: true
    })
    return data
  },

  async getLivePanel(): Promise<any> {
    const { data } = await axios.get(`${APIDictionary.attendance}/live`, {
      withCredentials: true
    })
    return data
  },

  async getVerificationQueue(): Promise<any> {
    const { data } = await axios.get(`${APIDictionary.attendance}/verification`, {
      withCredentials: true
    })
    return data
  },

  async verifyAttendance(attendanceId: string, action: 'approve' | 'reject', remarks?: string): Promise<any> {
    const { data } = await axios.patch(`${APIDictionary.attendance}/${attendanceId}/verify`, {
      action,
      remarks
    }, {
      withCredentials: true
    })
    return data
  },

  async getAttendanceActivity(orgId: string, params?: { limit?: number }): Promise<any> {
    const { data } = await axios.get(APIDictionary.attendanceActivity(orgId), {
      params,
      withCredentials: true
    })
    return data
  }
}
