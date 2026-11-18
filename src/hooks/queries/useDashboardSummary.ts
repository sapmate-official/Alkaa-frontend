import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { APIDictionary } from '@/services/api/v2/APIdict';

export interface AdminStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  onboardingPending: number;
  onboardingApproved: number;
  attendanceRate: number;
  departments: { id: string; name: string; code?: string | null; _count?: { users: number } }[];
  recentPendingCandidates: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    status: string;
    createdAt: string;
    department?: { name: string } | null;
  }[];
  recentPendingLeaves: {
    id: string;
    user: { id: string; firstName: string; lastName: string; email: string };
    leaveType: { name: string };
    startDate?: string;
    endDate?: string;
  }[];
}

export interface EmployeeStats {
  leaveBalances: { id: string; name: string; used: number; remaining: number; total: number }[];
  todayAttendance?: { status: string; checkInTime: string; checkOutTime?: string | null } | null;
  recentLeaves: { id: string; status: string; startDate: string; endDate: string; leaveType: { name: string } }[];
  upcomingHolidays: { id: string; name: string; date: string }[];
}

export interface UserProfileSummary {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
  jobTitle?: string | null;
  department?: { id: string; name: string } | null;
  organization?: { id: string; name: string; logo?: string | null } | null;
}

export interface DashboardSummaryResponse {
  roleType: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  userProfile?: UserProfileSummary | null;
  adminStats?: AdminStats | null;
  employeeStats?: EmployeeStats | null;
  managerStats?: {
    teamSize: number;
    teamPresentToday: number;
    teamMembers: unknown[];
    teamPendingLeaves: unknown[];
  } | null;
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (userId?: string) => ['dashboard', 'summary', userId] as const,
};

export const useDashboardSummaryQuery = (userId?: string) => {
  return useQuery<DashboardSummaryResponse>({
    queryKey: dashboardKeys.summary(userId),
    queryFn: async () => {
      const endpoint = APIDictionary.dashboardSummary || (userId ? APIDictionary.dashboard(userId) : '/api/v1/dashboard/summary');
      const response = await apiClient.get<DashboardSummaryResponse>(endpoint);
      return response.data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
};
