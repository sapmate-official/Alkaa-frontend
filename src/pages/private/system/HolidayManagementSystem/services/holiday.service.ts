import axios from 'axios';
import { APIDictionary } from '../../../../../services/api/v2/APIdict';
import { Holiday, HolidayType } from '../types/holiday.types';

// Get all holidays for an organization
export const getHolidaysByOrg = async (orgId: string): Promise<Holiday[]> => {
  try {
    const response = await axios.get(APIDictionary.holiday_by_org(orgId));
    return response.data;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    throw error;
  }
};

// Get a holiday by ID
export const getHolidayById = async (id: string): Promise<Holiday> => {
  try {
    const response = await axios.get(`${APIDictionary.holiday}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching holiday:', error);
    throw error;
  }
};

// Create a new holiday
export const createHoliday = async (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => {
  try {
    const response = await axios.post(APIDictionary.holiday, holiday);
    return response.data;
  } catch (error) {
    console.error('Error creating holiday:', error);
    throw error;
  }
};

// Update a holiday
export const updateHoliday = async (id: string, holiday: Partial<Holiday>): Promise<Holiday> => {
  try {
    const response = await axios.put(`${APIDictionary.holiday}/${id}`, holiday);
    return response.data;
  } catch (error) {
    console.error('Error updating holiday:', error);
    throw error;
  }
};

// Delete a holiday
export const deleteHoliday = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${APIDictionary.holiday}/${id}`);
  } catch (error) {
    console.error('Error deleting holiday:', error);
    throw error;
  }
};

// Get all holiday types for an organization
export const getHolidayTypesByOrg = async (orgId: string): Promise<HolidayType[]> => {
  try {
    const response = await axios.get(APIDictionary.holiday_type_by_org(orgId));
    return response.data.data;
  } catch (error) {
    console.error('Error fetching holiday types:', error);
    throw error;
  }
};

// Create a new holiday type
export const createHolidayType = async (orgId: string, holidayType: Omit<HolidayType, 'id'>): Promise<HolidayType> => {
  try {
    const payload = { ...holidayType, orgId };
    const response = await axios.post(APIDictionary.holiday_type, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating holiday type:', error);
    throw error;
  }
};
