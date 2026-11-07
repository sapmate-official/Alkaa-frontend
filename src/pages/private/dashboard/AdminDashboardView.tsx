import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserPlus,
  Clock,
  CalendarDays,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock4
} from 'lucide-react';
import RouteDict from '@/routes/RouteDict';

interface AdminDashboardViewProps {
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

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ stats, onRefresh, isLoading }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/60 backdrop-blur border rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold tracking-tight">Organization Command Center</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
              <ShieldCheck className="h-3 w-3 mr-1 inline" /> Executive Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time workforce metrics, candidate pipeline, and approval queues across all departments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRefresh} variant="outline" size="sm" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Refresh Feed'}
          </Button>
          <Button onClick={() => navigate(RouteDict.Onboarding.Base)} size="sm" className="gap-1.5">
            <UserPlus className="h-4 w-4" /> Onboard Candidate
          </Button>
          <Button onClick={() => navigate(RouteDict.Department.Base)} variant="secondary" size="sm">
            <Building2 className="h-4 w-4 mr-1" /> Departments
          </Button>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Workforce */}
        <Card
          className="hover:border-primary/50 transition-all cursor-pointer shadow-sm"
          onClick={() => navigate(RouteDict.Employee.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workforce</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.totalEmployees}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="text-emerald-500 font-semibold">{stats.activeEmployees} active</span>
              <span>•</span>
              <span>{Math.max(0, stats.totalEmployees - stats.activeEmployees)} inactive</span>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Pipeline */}
        <Card
          className="hover:border-primary/50 transition-all cursor-pointer shadow-sm"
          onClick={() => navigate(RouteDict.Onboarding.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Onboarding Pipeline</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <UserPlus className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-500">{stats.onboardingPending}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="font-semibold">{stats.onboardingApproved} approved</span>
              <span>•</span>
              <span>awaiting HR review</span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Attendance Rate */}
        <Card
          className="hover:border-primary/50 transition-all cursor-pointer shadow-sm"
          onClick={() => navigate(RouteDict.Attendance.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Presence</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-500">{stats.attendanceRate}%</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600">{stats.presentToday} checked in</span>
              <span>•</span>
              <span>{Math.max(0, stats.totalEmployees - stats.presentToday)} absent/off</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Leave Requests */}
        <Card
          className="hover:border-primary/50 transition-all cursor-pointer shadow-sm"
          onClick={() => navigate(RouteDict.Leave.Requests.Base)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Leaves</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <CalendarDays className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-500">{stats.pendingLeaves}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Applications awaiting manager/HR sign-off</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Operational Grid: Pending Review Queue & Department Distribution */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Onboarding Review Queue (2 Columns) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Candidate Action Center</CardTitle>
              <CardDescription className="text-xs">
                Candidates waiting for document validation and HR approval
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => navigate(RouteDict.Onboarding.Base)}
            >
              View Pipeline <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentPendingCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2 opacity-80" />
                <p className="font-medium text-sm">All caught up!</p>
                <p className="text-xs">No candidate onboarding submissions are pending review.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentPendingCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="py-3 flex items-center justify-between hover:bg-muted/30 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate(RouteDict.Onboarding.Review(candidate.id))}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {candidate.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {candidate.firstName} {candidate.lastName || ''}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{candidate.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                        {candidate.department?.name || 'General'}
                      </Badge>
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-300 text-xs">
                        Review Needed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Headcount Breakdown */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Department Breakdown</CardTitle>
              <CardDescription className="text-xs">Staffing distribution</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigate(RouteDict.Department.Base)}
            >
              Manage
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.departments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No departments found.</p>
            ) : (
              stats.departments.slice(0, 5).map((dept) => {
                const count = dept._count?.users || 0;
                const percentage = stats.totalEmployees > 0 ? Math.round((count / stats.totalEmployees) * 100) : 0;
                return (
                  <div key={dept.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate max-w-[160px]">{dept.name}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Pending Leave Approvals Roster */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Escalated Leave Applications</CardTitle>
            <CardDescription className="text-xs">Pending leave requests awaiting decision</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => navigate(RouteDict.Leave.Requests.Base)}
          >
            Review All <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentPendingLeaves.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No leave requests currently pending organization approval.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentPendingLeaves.map((leave) => (
                <div key={leave.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Clock4 className="h-4 w-4 text-amber-500" />
                    <div>
                      <span className="font-medium">
                        {leave.user.firstName} {leave.user.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">({leave.leaveType.name})</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => navigate(RouteDict.Leave.Requests.Base)}
                  >
                    Action
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardView;
