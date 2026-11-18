import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthContext';
import { useDashboardSummaryQuery } from '@/hooks/queries/useDashboardSummary';
import { AdminDashboardView } from './dashboard/AdminDashboardView';
import { EmployeeDashboardView } from './dashboard/EmployeeDashboardView';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User } from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { data: dashboardSummary, isLoading, refetch, isFetching } = useDashboardSummaryQuery(user?.id);
  const [activeTabOverride, setActiveTabOverride] = useState<'admin' | 'employee' | null>(null);

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

  // If user has explicitly toggled tab, use it; otherwise infer from backend roleType
  const activeTab: 'admin' | 'employee' =
    activeTabOverride ??
    (dashboardSummary?.roleType === 'EMPLOYEE' || !isAdminOrSuperAdmin ? 'employee' : 'admin');

  if (isLoading && !dashboardSummary) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-80 rounded-2xl" />
          <Skeleton className="lg:col-span-5 h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Viewport Mode Switcher for Admins */}
      {isAdminOrSuperAdmin && (
        <div className="flex justify-end">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTabOverride(val as 'admin' | 'employee')}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-2 h-10 p-1 bg-muted/60 border border-border rounded-xl">
              <TabsTrigger value="admin" className="text-xs font-semibold flex items-center gap-1.5 px-3.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-xs">
                <Shield className="h-3.5 w-3.5 text-primary" /> Executive View
              </TabsTrigger>
              <TabsTrigger value="employee" className="text-xs font-semibold flex items-center gap-1.5 px-3.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-xs">
                <User className="h-3.5 w-3.5 text-emerald-500" /> Employee Self-Service
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Render Adaptive Viewport */}
      {activeTab === 'admin' && dashboardSummary?.adminStats ? (
        <AdminDashboardView
          stats={dashboardSummary.adminStats}
          onRefresh={() => void refetch()}
          isLoading={isFetching}
        />
      ) : (
        <EmployeeDashboardView
          userProfile={dashboardSummary?.userProfile || user}
          stats={
            dashboardSummary?.employeeStats || {
              leaveBalances: [],
              todayAttendance: null,
              recentLeaves: [],
              upcomingHolidays: [],
            }
          }
          onRefresh={() => void refetch()}
          isLoading={isFetching}
        />
      )}
    </div>
  );
};

export default Home;
