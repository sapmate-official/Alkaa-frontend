import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'

export const employeesApi = {
  // Employee CRUD
  async getAllEmployees(filters?: Record<string, any>): Promise<any[]> {
    // Use the correct endpoint for fetching users by organization
    if (filters?.orgId) {
      const response = await axios.get(`${APIDictionary.user}/org/${filters.orgId}`, { withCredentials: true })
      return response.data.data || response.data
    }
    // Fallback to user-list endpoint if no orgId provided
    const response = await axios.get(`${APIDictionary.user}/user-list`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getEmployeeById(id: string): Promise<any> {
    const response = await axios.get(`${APIDictionary.user}/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async createEmployee(data: any): Promise<any> {
    const response = await axios.post(APIDictionary.user, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateEmployee(id: string, data: any): Promise<any> {
    const response = await axios.put(`${APIDictionary.user}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteEmployee(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.user}/${id}`, { withCredentials: true })
  },

  // Department-based queries
  async getEmployeesByDepartment(departmentId: string): Promise<any[]> {
    const response = await axios.get(`${APIDictionary.user}?departmentId=${departmentId}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getEmployeesByManager(managerId: string): Promise<any[]> {
    const response = await axios.get(`${APIDictionary.employee_list}?managerId=${managerId}`, { withCredentials: true })
    return response.data.data || response.data
  },

  // Role management
  async getEmployeeRoles(employeeId: string): Promise<any[]> {
    const response = await axios.get(`${APIDictionary.user_role}/user/${employeeId}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async assignEmployeeDepartment(employeeId: string, departmentId: string): Promise<void> {
    await axios.put(`${APIDictionary.user}/${employeeId}/department/${departmentId}`, {}, { withCredentials: true })
  },

  async assignEmployeeRole(employeeId: string, roleId: string): Promise<void> {
    await axios.post(APIDictionary.user_role, { userId: employeeId, roleId }, { withCredentials: true })
  },

  async removeEmployeeRole(employeeId: string, roleId: string): Promise<void> {
    await axios.delete(APIDictionary.user_role, {
      data: { userId: employeeId, roleId },
      withCredentials: true
    })
  },

  // Status management
  async updateEmployeeStatus(id: string, status: string): Promise<any> {
    const response = await axios.put(`${APIDictionary.user}/${id}`, { status }, { withCredentials: true })
    return response.data.data || response.data
  },
}
