import axios, { AxiosResponse } from 'axios';
import {
  EmploymentType,
  EmploymentTypePolicy,
  EmployeeByType,
  ExpiringContract,
  UserRulesSummary,
} from '@/types/employmentType';

const API_BASE_URL = '/api/v3/employment-type';

// Normalize backend responses that wrap payloads under `data`
const unwrapData = <T>(response: AxiosResponse<any>): T => (response?.data?.data ?? response?.data) as T;

export const employmentTypeService = {
  // Get all employment type policies for an organization
  async getOrganizationPolicies(orgId: string): Promise<EmploymentTypePolicy[]> {
    const response = await axios.get(`${API_BASE_URL}/organizations/${orgId}/policies`, {
      withCredentials: true,
    });
    return unwrapData<EmploymentTypePolicy[]>(response);
  },

  // Get policy for specific employment type
  async getPolicyByType(orgId: string, employmentType: EmploymentType): Promise<EmploymentTypePolicy> {
    const response = await axios.get(
      `${API_BASE_URL}/organizations/${orgId}/policies/${employmentType}`,
      { withCredentials: true }
    );
    return unwrapData<EmploymentTypePolicy>(response);
  },

  // Create or update employment type policy
  async createOrUpdatePolicy(
    orgId: string,
    employmentType: EmploymentType,
    policyData: Partial<EmploymentTypePolicy>
  ): Promise<EmploymentTypePolicy> {
    const response = await axios.post(
      `${API_BASE_URL}/organizations/${orgId}/policies/${employmentType}`,
      policyData,
      { withCredentials: true }
    );
    return unwrapData<EmploymentTypePolicy>(response);
  },

  // Delete employment type policy
  async deletePolicy(orgId: string, employmentType: EmploymentType): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/organizations/${orgId}/policies/${employmentType}`,
      { withCredentials: true }
    );
  },

  // Get employees by employment type
  async getEmployeesByType(orgId: string, employmentType: EmploymentType): Promise<EmployeeByType[]> {
    const response = await axios.get(
      `${API_BASE_URL}/organizations/${orgId}/employees/${employmentType}`,
      { withCredentials: true }
    );
    return unwrapData<EmployeeByType[]>(response);
  },

  // Update user's employment type
  async updateUserEmploymentType(
    userId: string,
    data: {
      employmentType: EmploymentType;
      contractEndDate?: string;
      effectiveDate?: string;
      reason?: string;
      notes?: string;
    }
  ): Promise<void> {
    await axios.patch(`${API_BASE_URL}/users/${userId}/employment-type`, data, {
      withCredentials: true,
    });
  },

  // Get employment type history
  async getEmploymentTypeHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any> {
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/employment-type/history`,
      {
        params: { limit, offset },
        withCredentials: true,
      }
    );
    return response.data;
  },

  // Get expiring contracts
  async getExpiringContracts(orgId: string, daysAhead: number = 30): Promise<ExpiringContract[]> {
    const response = await axios.get(
      `${API_BASE_URL}/organizations/${orgId}/expiring-contracts`,
      {
        params: { daysAhead },
        withCredentials: true,
      }
    );
    return unwrapData<ExpiringContract[]>(response);
  },

  // Get user's rules summary
  async getUserRulesSummary(orgId: string, userId: string): Promise<UserRulesSummary> {
    const response = await axios.get(
      `${API_BASE_URL}/organizations/${orgId}/users/${userId}/rules-summary`,
      {
        withCredentials: true,
      }
    );
    return unwrapData<UserRulesSummary>(response);
  },
};
