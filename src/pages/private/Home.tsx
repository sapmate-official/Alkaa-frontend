import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/providers/AuthContext';
import { APIDictionary } from '@/services/api/v2/APIdict';
import { AdminDashboardView, AdminDashboardViewProps } from './dashboard/AdminDashboardView';
import { EmployeeDashboardView, EmployeeDashboardViewProps } from './dashboard/EmployeeDashboardView';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User } from 'lucide-react';

interface DashboardSummaryData {
  roleType?: string;
  adminStats?: AdminDashboardViewProps['stats'];
  employeeStats?: EmployeeDashboardViewProps['stats'];
  userProfile?: EmployeeDashboardViewProps['userProfile'];
  [key: string]: unknown;
}

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'admin' | 'employee'>('admin');

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!user?.id) return;

      const response = await axios.get(
        APIDictionary.dashboardSummary || APIDictionary.dashboard(user.id),
        { withCredentials: true }
      );

      setDashboardSummary(response.data);
      if (response.data.roleType === 'EMPLOYEE') {
        setActiveTab('employee');
      } else {
        setActiveTab('admin');
      }
    } catch (error) {
      console.error('Error fetching adaptive dashboard summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const isAdminOrSuperAdmin = Boolean(
    user?.superAdmin ||
    user?.isSuperAdmin ||
    dashboardSummary?.roleType === 'ADMIN' ||
    user?.roles?.some((r: string | { role?: { name?: string } }) =>
      typeof r === 'string'
        ? ['SUPER_ADMIN', 'Org_Admin', 'Admin'].includes(r)
        : ['SUPER_ADMIN', 'Org_Admin', 'Admin'].includes(r?.role?.name || '')
    )
  );

  if (isLoading && !dashboardSummary) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-y-auto">
      {/* Viewport Mode Switcher for Admins */}
      {isAdminOrSuperAdmin && (
        <div className="flex justify-end">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'admin' | 'employee')}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-2 h-9 p-1 bg-muted/60">
              <TabsTrigger value="admin" className="text-xs flex items-center gap-1.5 px-3">
                <Shield className="h-3.5 w-3.5" /> Executive View
              </TabsTrigger>
              <TabsTrigger value="employee" className="text-xs flex items-center gap-1.5 px-3">
                <User className="h-3.5 w-3.5" /> My Self-Service
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Render Adaptive Viewport */}
      {activeTab === 'admin' && dashboardSummary?.adminStats ? (
        <AdminDashboardView
          stats={dashboardSummary.adminStats}
          onRefresh={fetchDashboardData}
          isLoading={isLoading}
        />
      ) : (
        <EmployeeDashboardView
          userProfile={dashboardSummary?.userProfile || user}
          stats={
            dashboardSummary?.employeeStats || {
              leaveBalances: [],
              todayAttendance: null,
              recentLeaves: [],
              upcomingHolidays: []
            }
          }
          onRefresh={fetchDashboardData}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default Home;
