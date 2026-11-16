import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { APIDictionary } from '@/services/api/v2/APIdict';

export interface FieldDiff {
  from: unknown;
  to: unknown;
  label?: string;
}

export interface EmployeeAuditLog {
  id: string;
  orgId: string;
  actorId: string;
  targetId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  metadata?: {
    diff?: Record<string, FieldDiff>;
    isSelfEdit?: boolean;
    updatedFieldCount?: number;
    [key: string]: unknown;
  } | null;
  createdAt: string;
  actor: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  };
  target?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  } | null;
}

export const auditHistoryKeys = {
  all: ['employee-audit-history'] as const,
  byUser: (userId: string) => [...auditHistoryKeys.all, userId] as const,
};

export const useEmployeeAuditHistory = (userId?: string, limit = 20) => {
  return useQuery({
    queryKey: auditHistoryKeys.byUser(userId ?? ''),
    queryFn: async (): Promise<EmployeeAuditLog[]> => {
      if (!userId) return [];
      const response = await axios.get(
        `${APIDictionary.userRecentActivities(userId)}?limit=${limit}`,
        { withCredentials: true }
      );
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
};
