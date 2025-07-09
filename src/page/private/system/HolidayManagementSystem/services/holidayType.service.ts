import axios from 'axios';
import { HolidayType } from '../types/holiday.types';
import { backendDomain } from '@/lib/constant/Domain';
const API_URL = backendDomain

export const holidayTypeService = {
  // Get all holiday types for an organization
  async getAllHolidayTypes(orgId: string): Promise<HolidayType[]> {
    try {
      const response = await axios.get(`${API_URL}/api/v2/holiday-type/${orgId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching holiday types:', error);
      throw error;
    }
  },

  // Create a new holiday type
  async createHolidayType(holidayType: Omit<HolidayType, 'id'>): Promise<HolidayType> {
    try {
      const response = await axios.post(`${API_URL}/api/v2/holiday-type/`, holidayType);
      return response.data.data;
    } catch (error) {
      console.error('Error creating holiday type:', error);
      throw error;
    }
  },

  // Update an existing holiday type
  async updateHolidayType(id: string, holidayType: Partial<HolidayType>): Promise<HolidayType> {
    try {
      const response = await axios.put(`${API_URL}/api/v2/holiday-type/${id}`, holidayType);
      return response.data.data;
    } catch (error) {
      console.error('Error updating holiday type:', error);
      throw error;
    }
  },

  // Delete a holiday type
  async deleteHolidayType(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/api/v2/holiday-type/${id}`);
    } catch (error) {
      console.error('Error deleting holiday type:', error);
      throw error;
    }
  }
};
