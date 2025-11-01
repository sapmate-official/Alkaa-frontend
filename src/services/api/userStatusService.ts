import axios from 'axios'

const API_BASE_URL = '/api/v3/users'

export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'suspended' | 'terminated'
  terminationDate?: string | null
  reason?: string
  notes?: string
}

export interface ReactivateUserRequest {
  reason?: string
  notes?: string
}

export interface UserStatusHistoryEntry {
  id: string
  userId: string
  previousStatus: string
  newStatus: string
  changedBy: string
  changedAt: string
  reason?: string
  effectiveDate?: string
  terminationDate?: string
  notes?: string
  changedByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
    employeeId: string
  }
}

export interface PendingTermination {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  status: string
  terminationDate: string
  employmentType: string
}

export const userStatusService = {
  /**
   * Update user status
   */
  async updateUserStatus(userId: string, data: UpdateUserStatusRequest): Promise<any> {
    const response = await axios.patch(
      `${API_BASE_URL}/${userId}/status`,
      data,
      { withCredentials: true }
    )
    return response.data.data
  },

  /**
   * Get user status history
   */
  async getUserStatusHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data: UserStatusHistoryEntry[]; pagination: any }> {
    const response = await axios.get(
      `${API_BASE_URL}/${userId}/status/history`,
      {
        params: { limit, offset },
        withCredentials: true
      }
    )
    return response.data
  },

  /**
   * Reactivate a terminated user
   */
  async reactivateUser(userId: string, data: ReactivateUserRequest): Promise<any> {
    const response = await axios.post(
      `${API_BASE_URL}/${userId}/reactivate`,
      data,
      { withCredentials: true }
    )
    return response.data.data
  },

  /**
   * Get users with pending termination
   */
  async getPendingTerminations(): Promise<PendingTermination[]> {
    const response = await axios.get(
      `${API_BASE_URL}/pending-termination`,
      { withCredentials: true }
    )
    return response.data.data
  }
}
