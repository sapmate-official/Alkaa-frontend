import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Check,
  X,
  RefreshCw,
  TrendingUp,
  FileCheck,
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
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }) +
          ' • ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }) +
          ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalBottlenecks = stats.pendingLeaves + stats.onboardingPending;
  const totalEmployeesCount = Math.max(stats.totalEmployees, 1);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & IST Live Clock */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/60 backdrop-blur border border-border rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-foreground font-medium">Command Center</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Executive Command Center
            </h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-mono">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 inline" /> Executive Admin
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            High-assurance workforce telemetry, candidate validation pipeline, and zero-click approval queue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border font-mono text-xs text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-foreground font-medium">{currentClock || 'Syncing clock...'}</span>
          </div>

          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Feed'}</span>
          </Button>

          <Button
            onClick={() => navigate(RouteDict.Onboarding.Base)}
            size="sm"
            className="text-xs h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Onboard Candidate</span>
          </Button>
        </div>
      </div>

      {/* 2. Key Performance Indicators (Row 1) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Workforce */}
        <Card
          className="hover:border-primary/50 transition-all cursor-pointer shadow-xs bg-card/60 backdrop-blur"
          onClick={() => navigate(RouteDict.Employee.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Active Workforce
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Live
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-foreground tracking-tight">
                {stats.totalEmployees}
              </span>
              <span className="text-xs font-mono text-muted-foreground">heads registered</span>
            </div>

            {/* Department Breakdown Mini Bar */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.min(100, Math.round((stats.activeEmployees / totalEmployeesCount) * 100))}%`,
                  }}
                  title="Active"
                />
                <div
                  className="h-full bg-slate-400"
                  style={{
                    width: `${Math.max(0, 100 - Math.round((stats.activeEmployees / totalEmployeesCount) * 100))}%`,
                  }}
                  title="Inactive"
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                <span className="text-emerald-500 font-medium">{stats.activeEmployees} active</span>
                <span>{Math.max(0, stats.totalEmployees - stats.activeEmployees)} inactive</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Today's Presence Pulse */}
        <Card
          className="hover:border-primary/50 transition-all cursor-pointer shadow-xs bg-card/60 backdrop-blur"
          onClick={() => navigate(RouteDict.Attendance.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Attendance Pulse
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {stats.attendanceRate}% on-time
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-500 tracking-tight">
                {stats.presentToday}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                / {stats.totalEmployees} Clocked In
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono text-muted-foreground border-t border-border pt-2">
              <div className="flex justify-between">
                <span>Present:</span>
                <span className="text-emerald-500 font-semibold">{stats.presentToday}</span>
              </div>
              <div className="flex justify-between">
                <span>Absent:</span>
                <span className="text-rose-400 font-semibold">
                  {Math.max(0, stats.totalEmployees - stats.presentToday)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Action Bottlenecks */}
        <Card
          className="hover:border-primary/50 transition-all cursor-pointer shadow-xs bg-card/60 backdrop-blur"
          onClick={() => navigate(RouteDict.Leave.Requests.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Action Bottlenecks
            </span>
            <span
              className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
                totalBottlenecks > 0
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {totalBottlenecks > 0 ? 'Action Needed' : 'Clear'}
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-amber-500 tracking-tight">
                {String(totalBottlenecks).padStart(2, '0')}
              </span>
              <span className="text-xs font-mono text-muted-foreground">pending approvals</span>
            </div>

            <div className="space-y-1 text-[11px] font-mono text-muted-foreground border-t border-border pt-2">
              <div className="flex justify-between">
                <span>Pending Leaves:</span>
                <span className="text-amber-500 font-semibold">{stats.pendingLeaves}</span>
              </div>
              <div className="flex justify-between">
                <span>Candidate Reviews:</span>
                <span className="text-indigo-400 font-semibold">{stats.onboardingPending}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Onboarding Pipeline */}
        <Card
          className="hover:border-primary/50 transition-all cursor-pointer shadow-xs bg-card/60 backdrop-blur"
          onClick={() => navigate(RouteDict.Onboarding.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Onboarding Pipeline
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {stats.onboardingApproved} Approved
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-primary tracking-tight">
                {stats.onboardingPending}
              </span>
              <span className="text-xs font-mono text-muted-foreground">in active verification</span>
            </div>

            <div className="space-y-1 text-[11px] font-mono text-muted-foreground border-t border-border pt-2">
              <div className="flex justify-between">
                <span>Ready for Account:</span>
                <span className="text-emerald-500 font-semibold">{stats.onboardingApproved}</span>
              </div>
              <div className="flex justify-between">
                <span>Review In-Progress:</span>
                <span className="text-primary font-semibold">{stats.onboardingPending}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Operational Grid: Zero-Click Actions & Departments (7:5 ratio) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Left (7 Columns): Urgent Pending Approvals */}
        <Card className="lg:col-span-7 shadow-xs bg-card/60 backdrop-blur border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  Urgent Pending Approvals
                </CardTitle>
                {totalBottlenecks > 0 && (
                  <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                    {totalBottlenecks} Queue
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-0.5">
                Zero-click decisioning: Approve or decline requests directly from the cockpit
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Pending Leave Requests Stream */}
            {stats.recentPendingLeaves && stats.recentPendingLeaves.length > 0 && (
              <div className="space-y-2.5">
                <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Leave Applications Awaiting Decision
                </span>
                {stats.recentPendingLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="p-3 rounded-lg bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold font-mono flex items-center justify-center text-xs shrink-0">
                        {leave.user?.firstName?.[0] || 'U'}
                        {leave.user?.lastName?.[0] || ''}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {leave.user?.firstName} {leave.user?.lastName}
                          </span>
                          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-muted border border-border text-muted-foreground">
                            {leave.leaveType?.name || 'Leave'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
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
                            rejectedReason: 'Declined from Command Center',
                          })
                        }
                        disabled={rejectLeave.isPending}
                        className="h-7 px-2.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1"
                      >
                        <X className="h-3 w-3" /> Decline
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
                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Candidates Stream */}
            {stats.recentPendingCandidates && stats.recentPendingCandidates.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Candidate Verification Queue
                </span>
                {stats.recentPendingCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between gap-3 hover:border-primary/40 transition-colors cursor-pointer"
                    onClick={() => navigate(RouteDict.Onboarding.Review(candidate.id))}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 font-bold font-mono flex items-center justify-center text-xs shrink-0">
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
                      <Badge variant="outline" className="text-xs hidden sm:inline-flex font-mono">
                        {candidate.department?.name || 'General'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2.5 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(RouteDict.Onboarding.Review(candidate.id));
                        }}
                      >
                        <FileCheck className="h-3 w-3" /> Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalBottlenecks === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2 opacity-80" />
                <p className="font-semibold text-sm text-foreground">All queues cleared!</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                  No employee leave applications or candidate onboarding profiles are awaiting action.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right (5 Columns): Department Allocation & Operations */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="shadow-xs bg-card/60 backdrop-blur border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Department Allocation
                </CardTitle>
                <CardDescription className="text-xs">
                  Workforce distribution across functional teams
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 font-mono"
                onClick={() => navigate(RouteDict.Department.Base)}
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              {stats.departments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No departments created yet.
                </p>
              ) : (
                stats.departments.slice(0, 6).map((dept) => {
                  const count = dept._count?.users || 0;
                  const percentage =
                    stats.totalEmployees > 0
                      ? Math.round((count / stats.totalEmployees) * 100)
                      : 0;

                  return (
                    <div key={dept.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-foreground truncate max-w-[180px]">
                          {dept.name}
                        </span>
                        <div className="font-mono text-muted-foreground flex items-center gap-1.5">
                          <span className="text-foreground font-semibold">{count}</span>
                          <span className="text-[10px]">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
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

          {/* Quick Operations Strip */}
          <div className="grid grid-cols-2 gap-3">
            <Card
              className="p-3.5 hover:bg-muted/40 cursor-pointer transition-colors shadow-xs border border-border"
              onClick={() => navigate(RouteDict.System.ActivityLogs)}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-purple-500/10 text-purple-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Audit Log</div>
                  <div className="text-[10px] text-muted-foreground">Trace all edits</div>
                </div>
              </div>
            </Card>

            <Card
              className="p-3.5 hover:bg-muted/40 cursor-pointer transition-colors shadow-xs border border-border"
              onClick={() => navigate(RouteDict.Role.Base)}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Permissions</div>
                  <div className="text-[10px] text-muted-foreground">RBAC Policies</div>
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
