import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { APIDictionary } from '@/services/api/v2/APIdict';

export interface ActivityActorTarget {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  actor: ActivityActorTarget;
  target?: ActivityActorTarget;
}

export interface ActivityStats {
  totalActivities: number;
  period: string;
  actionStats: Array<{ action: string; count: number }>;
  entityStats: Array<{ entity: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
  userStats: Array<{
    userId: string;
    name: string;
    email: string;
    employeeId?: string;
    activityCount: number;
  }>;
}

export interface ActivityLogsFilterParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: string;
  targetUserId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface ActivityLogsResponse {
  data: ActivityLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const activityLogsKeys = {
  all: ['activity-logs'] as const,
  list: (filters: ActivityLogsFilterParams) => [...activityLogsKeys.all, 'list', filters] as const,
  stats: (period: string) => [...activityLogsKeys.all, 'stats', period] as const,
  userRecent: (userId: string) => [...activityLogsKeys.all, 'user-recent', userId] as const,
};

export function useActivityLogsQuery(filters: ActivityLogsFilterParams) {
  return useQuery<ActivityLogsResponse>({
    queryKey: activityLogsKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.action && filters.action !== 'all') params.append('action', filters.action);
      if (filters.entity && filters.entity !== 'all') params.append('entity', filters.entity);
      if (filters.userId && filters.userId !== 'all') params.append('userId', filters.userId);
      if (filters.targetUserId && filters.targetUserId !== 'all') params.append('targetUserId', filters.targetUserId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.searchTerm) params.append('search', filters.searchTerm);

      const response = await axios.get(`${APIDictionary.activityLogs}?${params.toString()}`, {
        withCredentials: true,
      });
      return {
        data: response.data.data || [],
        pagination: response.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    },
    staleTime: 60 * 1000,
  });
}

export function useActivityStatsQuery(period: string = '30d') {
  return useQuery<ActivityStats>({
    queryKey: activityLogsKeys.stats(period),
    queryFn: async () => {
      const response = await axios.get(`${APIDictionary.activityStats}?period=${period}`, {
        withCredentials: true,
      });
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
