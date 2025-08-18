import axios from 'axios';
import { APIDictionary } from '@/api/v2/APIdict';
import { 
  User, 
  DepartmentAssignmentRequest, 
  DepartmentAssignmentResponse 
} from '@/interface/general';

/**
 * Multi-Department API Functions
 * These functions handle API calls for multi-department operations
 */

export const multiDepartmentApi = {
  /**
   * Get user's department assignments
   */
  getUserDepartments: async (userId: string): Promise<User> => {
    const response = await axios.get(`${APIDictionary.user}/${userId}/departments`, {
      withCredentials: true
    });
    return response.data;
  },

  /**
   * Assign user to multiple departments
   */
  assignUserToDepartments: async (
    userId: string, 
    assignmentData: DepartmentAssignmentRequest
  ): Promise<DepartmentAssignmentResponse> => {
    const response = await axios.post(
      `${APIDictionary.user}/${userId}/departments`,
      assignmentData,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Update user's department assignments
   */
  updateUserDepartments: async (
    userId: string, 
    assignmentData: DepartmentAssignmentRequest
  ): Promise<DepartmentAssignmentResponse> => {
    const response = await axios.put(
      `${APIDictionary.user}/${userId}/departments`,
      assignmentData,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Remove user from a specific department
   */
  removeUserFromDepartment: async (
    userId: string, 
    departmentId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(
      `${APIDictionary.user}/${userId}/departments/${departmentId}`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Get department statistics with multi-department info
   */
  getDepartmentStats: async (departmentId: string) => {
    const response = await axios.get(
      `${APIDictionary.department}/${departmentId}/stats`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Get all departments with multi-department user counts
   */
  getDepartmentsWithStats: async (orgId: string) => {
    const response = await axios.get(
      `${APIDictionary.department}/org/${orgId}?includeMultiDeptStats=true`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Migrate user from legacy single department to multi-department
   */
  migrateUserToMultiDepartment: async (userId: string) => {
    const response = await axios.post(
      `${APIDictionary.user}/${userId}/migrate-departments`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Bulk assign users to departments
   */
  bulkAssignUsersToDepartments: async (
    assignments: { userId: string; departments: DepartmentAssignmentRequest }[]
  ) => {
    const response = await axios.post(
      `${APIDictionary.user}/bulk-assign-departments`,
      { assignments },
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Get users filtered by department (supports multi-department)
   */
  getUsersByDepartment: async (
    orgId: string, 
    departmentId: string, 
    options: { primaryOnly?: boolean; includeSecondary?: boolean } = {}
  ) => {
    const params = new URLSearchParams();
    params.append('departmentId', departmentId);
    if (options.primaryOnly) params.append('primaryOnly', 'true');
    if (options.includeSecondary) params.append('includeSecondary', 'true');

    const response = await axios.get(
      `${APIDictionary.user}/org/${orgId}?${params.toString()}`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Search users across departments
   */
  searchUsersAcrossDepartments: async (
    orgId: string, 
    query: string, 
    departmentIds?: string[]
  ) => {
    const params = new URLSearchParams();
    params.append('query', query);
    if (departmentIds && departmentIds.length > 0) {
      departmentIds.forEach(id => params.append('departmentIds[]', id));
    }

    const response = await axios.get(
      `${APIDictionary.user}/org/${orgId}/search?${params.toString()}`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Get organization chart with multi-department structure
   */
  getMultiDepartmentOrgChart: async (orgId: string) => {
    const response = await axios.get(
      `${APIDictionary.Organization}/${orgId}/chart?multiDepartment=true`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Get department hierarchy with multi-department assignments
   */
  getDepartmentHierarchy: async (orgId: string) => {
    const response = await axios.get(
      `${APIDictionary.department}/org/${orgId}/hierarchy?includeMultiDept=true`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Validate department assignment before submission
   */
  validateDepartmentAssignment: async (
    userId: string, 
    assignmentData: DepartmentAssignmentRequest
  ) => {
    const response = await axios.post(
      `${APIDictionary.user}/${userId}/departments/validate`,
      assignmentData,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Get department assignment history for a user
   */
  getUserDepartmentHistory: async (userId: string) => {
    const response = await axios.get(
      `${APIDictionary.user}/${userId}/department-history`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Get activity logs for department assignments
   */
  getDepartmentAssignmentLogs: async (
    userId?: string, 
    departmentId?: string, 
    limit: number = 50
  ) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (departmentId) params.append('departmentId', departmentId);
    params.append('limit', limit.toString());

    const response = await axios.get(
      `${APIDictionary.Organization}/activity-logs/departments?${params.toString()}`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Export department assignments data
   */
  exportDepartmentAssignments: async (orgId: string, format: 'csv' | 'xlsx' = 'csv') => {
    const response = await axios.get(
      `${APIDictionary.department}/org/${orgId}/export?format=${format}&includeMultiDept=true`,
      { 
        withCredentials: true,
        responseType: 'blob'
      }
    );
    return response.data;
  }
};

export default multiDepartmentApi;
