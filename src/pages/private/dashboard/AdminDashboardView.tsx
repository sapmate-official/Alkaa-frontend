import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Clock,
  Calendar,
  CreditCard,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Check,
  X,
  RefreshCw,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import RouteDict from '@/routes/RouteDict';
import { useApproveLeaveRequestMutation, useRejectLeaveRequestMutation } from '@/hooks/queries/useLeaves';
import { useAuth } from '@/providers/AuthContext';

export interface AdminDashboardViewProps {
  stats: {
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
  };
  onRefresh: () => void;
  isLoading: boolean;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  stats,
  onRefresh,
  isLoading,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const approveLeave = useApproveLeaveRequestMutation();
  const rejectLeave = useRejectLeaveRequestMutation();
  const [currentClock, setCurrentClock] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentClock(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }) +
          ' • ' +
          now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalPendingActions = stats.pendingLeaves + stats.onboardingPending;
  const totalEmployeesCount = Math.max(stats.totalEmployees, 1);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Live Date/Time Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1.5">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Executive Dashboard</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Workforce Executive Overview
            </h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-0.5">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 inline" /> HR Management
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time insights across organization headcount, shift attendance, and pending employee approvals.
          </p>
        </div>

        {/* Live Clock & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-end">
          <div className="px-3.5 py-2 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-foreground font-semibold">{currentClock || 'Syncing time...'}</span>
          </div>

          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-xs h-9 gap-1.5 rounded-xl border-border hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
          </Button>

          <Button
            onClick={() => navigate(RouteDict.Onboarding.Base)}
            size="sm"
            className="text-xs h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Onboard Employee</span>
          </Button>
        </div>
      </div>

      {/* 2. Key HRMS Performance Metric Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Active Workforce */}
        <Card
          className="hover:border-primary/50 transition-all cursor-pointer shadow-sm bg-card rounded-2xl group"
          onClick={() => navigate(RouteDict.Employee.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Workforce
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {stats.totalEmployees}
              </span>
              <span className="text-xs text-muted-foreground font-medium">team members</span>
            </div>

            {/* Active ratio bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((stats.activeEmployees / totalEmployeesCount) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.activeEmployees} Active</span>
                <span>{Math.max(0, stats.totalEmployees - stats.activeEmployees)} Inactive</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Today's Shift Attendance */}
        <Card
          className="hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm bg-card rounded-2xl group"
          onClick={() => navigate(RouteDict.Attendance.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Today's Attendance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {stats.presentToday}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                / {stats.totalEmployees} checked in
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-border pt-2 text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                {stats.attendanceRate}% Presence
              </span>
              <span className="font-semibold text-rose-500">
                {Math.max(0, stats.totalEmployees - stats.presentToday)} Absent
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Pending Approvals & Requests */}
        <Card
          className="hover:border-amber-500/50 transition-all cursor-pointer shadow-sm bg-card rounded-2xl group"
          onClick={() => navigate(RouteDict.Leave.Requests.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                {String(totalPendingActions).padStart(2, '0')}
              </span>
              <span className="text-xs text-muted-foreground font-medium">awaiting review</span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-border pt-2 text-muted-foreground">
              <span>{stats.pendingLeaves} Leave Requests</span>
              <span>{stats.onboardingPending} Candidates</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Onboarding & Hiring Pipeline */}
        <Card
          className="hover:border-blue-500/50 transition-all cursor-pointer shadow-sm bg-card rounded-2xl group"
          onClick={() => navigate(RouteDict.Onboarding.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Onboarding Pipeline
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserPlus className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                {stats.onboardingPending}
              </span>
              <span className="text-xs text-muted-foreground font-medium">in verification</span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-border pt-2 text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.onboardingApproved} Approved</span>
              <span>Ready to start</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Operational Sections (7:5 Responsive Split) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Left Column (7 Cols): Urgent Approvals & Applications */}
        <Card className="lg:col-span-7 shadow-sm bg-card border border-border rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Pending Approvals &amp; Requests
                </CardTitle>
                {totalPendingActions > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                    {totalPendingActions} Actions
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-0.5">
                Review and approve leave applications or verify new candidate profiles.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(RouteDict.Leave.Requests.Base)}
              className="text-xs text-primary hover:text-primary/90 hover:bg-primary/5 gap-1 font-medium"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Pending Leave Requests Stream */}
            {stats.recentPendingLeaves && stats.recentPendingLeaves.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Time-Off Applications
                </span>
                {stats.recentPendingLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                        {leave.user?.firstName?.[0] || 'U'}
                        {leave.user?.lastName?.[0] || ''}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {leave.user?.firstName} {leave.user?.lastName}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-medium">
                            {leave.leaveType?.name || 'Leave'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {leave.startDate && new Date(leave.startDate).toLocaleDateString()} —{' '}
                          {leave.endDate && new Date(leave.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Inline Decision Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          rejectLeave.mutate({
                            id: leave.id,
                            approvedBy: user?.id || 'admin',
                            rejectedReason: 'Declined by Administrator',
                          })
                        }
                        disabled={rejectLeave.isPending}
                        className="h-8 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 rounded-xl gap-1"
                      >
                        <X className="h-3.5 w-3.5" /> Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          approveLeave.mutate({
                            id: leave.id,
                            approvedBy: user?.id || 'admin',
                          })
                        }
                        disabled={approveLeave.isPending}
                        className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1 shadow-xs"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Candidates Stream */}
            {stats.recentPendingCandidates && stats.recentPendingCandidates.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  New Candidates In Verification
                </span>
                {stats.recentPendingCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 hover:border-primary/40 transition-colors cursor-pointer"
                    onClick={() => navigate(RouteDict.Onboarding.Review(candidate.id))}
                  >
                    <div className="flex items-center gap-3 min-w-0 text-left">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                        {candidate.firstName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-foreground truncate">
                          {candidate.firstName} {candidate.lastName || ''}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{candidate.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs hidden sm:inline-flex rounded-md">
                        {candidate.department?.name || 'General'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 px-3 text-xs gap-1 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(RouteDict.Onboarding.Review(candidate.id));
                        }}
                      >
                        <FileCheck className="h-3.5 w-3.5" /> Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPendingActions === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2 opacity-90" />
                <p className="font-bold text-sm text-foreground">All queues are clear!</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                  No employee time-off requests or onboarding candidate verifications are awaiting action.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column (5 Cols): Department Distribution & Quick HR Hubs */}
        <div className="lg:col-span-5 space-y-5">
          {/* Department Headcount Allocation Card */}
          <Card className="shadow-sm bg-card border border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
              <div className="text-left">
                <CardTitle className="text-base font-bold text-foreground">
                  Department Distribution
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Headcount allocation across teams
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary/90 gap-1 font-medium"
                onClick={() => navigate(RouteDict.Department.Base)}
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              {stats.departments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No departments configured yet.
                </p>
              ) : (
                stats.departments.slice(0, 5).map((dept) => {
                  const count = dept._count?.users || 0;
                  const percentage =
                    stats.totalEmployees > 0
                      ? Math.round((count / stats.totalEmployees) * 100)
                      : 0;

                  return (
                    <div key={dept.id} className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                          {dept.name}
                        </span>
                        <div className="text-muted-foreground flex items-center gap-1.5">
                          <span className="text-foreground font-bold">{count}</span>
                          <span className="text-[11px]">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Core HR Quick Action Navigation Hubs */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <Card
              className="p-4 hover:border-primary/50 cursor-pointer transition-all shadow-sm border border-border rounded-2xl group"
              onClick={() => navigate(RouteDict.Payroll.Dashboard)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Payroll Hub</div>
                  <div className="text-[11px] text-muted-foreground">Monthly pay runs</div>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 hover:border-primary/50 cursor-pointer transition-all shadow-sm border border-border rounded-2xl group"
              onClick={() => navigate(RouteDict.Attendance.Base)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Live Attendance</div>
                  <div className="text-[11px] text-muted-foreground">Geofenced shifts</div>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 hover:border-primary/50 cursor-pointer transition-all shadow-sm border border-border rounded-2xl group"
              onClick={() => navigate(RouteDict.Role.Base)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Role Permissions</div>
                  <div className="text-[11px] text-muted-foreground">RBAC control</div>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 hover:border-primary/50 cursor-pointer transition-all shadow-sm border border-border rounded-2xl group"
              onClick={() => navigate(RouteDict.Organization.Settings)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Org Settings</div>
                  <div className="text-[11px] text-muted-foreground">Company policies</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
