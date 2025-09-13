import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import type { 
  Holiday, 
  HolidayType, 
  CreateHolidayRequest, 
  UpdateHolidayRequest, 
  CreateHolidayTypeRequest, 
  UpdateHolidayTypeRequest, 
  HolidayCalendarEntry 
} from '@/types/holiday.types'

export const holidaysApi = {
  async getAllHolidays(filters?: Record<string, any>): Promise<Holiday[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.holiday}?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getHolidayById(id: string): Promise<Holiday> {
    const response = await axios.get(`${APIDictionary.holiday}/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getHolidaysByOrg(orgId: string): Promise<Holiday[]> {
    const response = await axios.get(APIDictionary.holiday_by_org(orgId), { withCredentials: true })
    return response.data.data || response.data
  },

  async createHoliday(data: CreateHolidayRequest): Promise<Holiday> {
    const response = await axios.post(APIDictionary.holiday, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateHoliday(id: string, data: UpdateHolidayRequest): Promise<Holiday> {
    const response = await axios.put(`${APIDictionary.holiday}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteHoliday(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.holiday}/${id}`, { withCredentials: true })
  },

  async getHolidayCalendar(year?: number, month?: number): Promise<HolidayCalendarEntry[]> {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (month) params.append('month', month.toString())
    
    const response = await axios.get(`${APIDictionary.holiday}/calendar?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getUpcomingHolidays(limit?: number): Promise<Holiday[]> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    
    const response = await axios.get(`${APIDictionary.holiday}/upcoming?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async bulkCreateHolidays(holidays: CreateHolidayRequest[]): Promise<Holiday[]> {
    const response = await axios.post(`${APIDictionary.holiday}/bulk`, { holidays }, { withCredentials: true })
    return response.data.data || response.data
  },

  async toggleHolidayStatus(id: string, isActive: boolean): Promise<Holiday> {
    const response = await axios.patch(`${APIDictionary.holiday}/${id}/toggle`, { isActive }, { withCredentials: true })
    return response.data.data || response.data
  }
}

export const holidayTypesApi = {
  async getAllHolidayTypes(): Promise<HolidayType[]> {
    const response = await axios.get(APIDictionary.holiday_type, { withCredentials: true })
    return response.data.data || response.data
  },

  async getHolidayTypeById(id: string): Promise<HolidayType> {
    const response = await axios.get(`${APIDictionary.holiday_type}/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getHolidayTypesByOrg(orgId: string): Promise<HolidayType[]> {
    const response = await axios.get(APIDictionary.holiday_type_by_org(orgId), { withCredentials: true })
    return response.data.data || response.data
  },

  async createHolidayType(data: CreateHolidayTypeRequest): Promise<HolidayType> {
    const response = await axios.post(APIDictionary.holiday_type, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateHolidayType(id: string, data: UpdateHolidayTypeRequest): Promise<HolidayType> {
    const response = await axios.put(`${APIDictionary.holiday_type}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteHolidayType(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.holiday_type}/${id}`, { withCredentials: true })
  },

  async setDefaultHolidayType(id: string): Promise<HolidayType> {
    const response = await axios.patch(`${APIDictionary.holiday_type}/${id}/default`, {}, { withCredentials: true })
    return response.data.data || response.data
  }
}
