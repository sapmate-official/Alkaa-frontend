import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CalendarDays,
  FileText,
  User,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import RouteDict from '@/routes/RouteDict';

interface EmployeeDashboardViewProps {
  userProfile?: {
    firstName?: string;
    lastName?: string;
    employeeId?: string;
    jobTitle?: string | null;
    department?: { name: string } | null;
    organization?: { name: string } | null;
  } | null;
  stats: {
    leaveBalances: { id: string; name: string; used: number; remaining: number; total: number }[];
    todayAttendance?: { status: string; checkInTime: string; checkOutTime?: string | null } | null;
    recentLeaves: { id: string; status: string; startDate: string; endDate: string; leaveType: { name: string } }[];
    upcomingHolidays: { id: string; name: string; date: string }[];
  };
  onRefresh: () => void;
  isLoading: boolean;
}

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({
  userProfile,
  stats,
  onRefresh: _onRefresh,
  isLoading: _isLoading
}) => {
  const navigate = useNavigate();
  const isCheckedIn = Boolean(stats.todayAttendance?.checkInTime && !stats.todayAttendance?.checkOutTime);

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner & Live Shift Clock */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-card to-card/60 border rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold tracking-tight">
              Good day, {userProfile?.firstName || 'Colleague'} 👋
            </h2>
            <Badge variant="outline" className="text-xs">
              {userProfile?.employeeId || 'Staff'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {userProfile?.jobTitle || 'Team Member'} {userProfile?.department ? `• ${userProfile.department.name}` : ''}
          </p>
        </div>

        {/* Live Attendance Punch Action */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-muted/50 px-3.5 py-2 rounded-lg border text-sm">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
            />
            <span className="font-medium text-xs sm:text-sm">
              {isCheckedIn
                ? `Shift Active (${new Date(stats.todayAttendance!.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                : 'Not Checked In'}
            </span>
          </div>
          <Button
            size="sm"
            className={isCheckedIn ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary'}
            onClick={() => navigate(RouteDict.Attendance.Base)}
          >
            <Clock className="h-4 w-4 mr-1.5" />
            {isCheckedIn ? 'View Session' : 'Clock In Now'}
          </Button>
        </div>
      </div>

      {/* 2. Leave Balance Wallet */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Leave Balance Wallet
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => navigate(RouteDict.Leave.Requests.Base)}
          >
            Apply for Leave <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {stats.leaveBalances.length === 0 ? (
            <Card className="col-span-full py-6 text-center text-xs text-muted-foreground">
              No leave policies allocated yet.
            </Card>
          ) : (
            stats.leaveBalances.map((balance) => (
              <Card key={balance.id} className="shadow-sm border hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground truncate">
                    {balance.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-primary">{balance.remaining}</span>
                    <span className="text-xs text-muted-foreground">days left of {balance.total}</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, balance.total > 0 ? (balance.remaining / balance.total) * 100 : 0)}%`
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 3. Bottom Grid: My Recent Leaves & Upcoming Holidays */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Recent Leave Requests */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">My Leave Requests</CardTitle>
              <CardDescription className="text-xs">Recent submissions and status</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigate(RouteDict.Leave.Base)}
            >
              History
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentLeaves.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No recent leave requests recorded.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentLeaves.map((leave) => {
                  const isApproved = leave.status === 'APPROVED';
                  const isPending = leave.status === 'PENDING';
                  return (
                    <div key={leave.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-sm">{leave.leaveType.name}</span>
                        <div className="text-muted-foreground">
                          {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-600 border-amber-200'
                            : 'bg-red-500/10 text-red-600 border-red-200'
                        }
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Holidays Calendar */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Upcoming Holidays</CardTitle>
              <CardDescription className="text-xs">Organization calendar</CardDescription>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.upcomingHolidays.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No upcoming holidays scheduled this month.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {stats.upcomingHolidays.map((holiday) => (
                  <div key={holiday.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-sm">{holiday.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(holiday.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Quick Tools */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card
          className="p-4 flex items-center gap-3 hover:bg-muted/40 cursor-pointer transition-colors"
          onClick={() => navigate(RouteDict.Profile.Base)}
        >
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">My Profile</div>
            <div className="text-xs text-muted-foreground">Personal & bank details</div>
          </div>
        </Card>

        <Card
          className="p-4 flex items-center gap-3 hover:bg-muted/40 cursor-pointer transition-colors"
          onClick={() => navigate(RouteDict.Attendance.Base)}
        >
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Attendance Log</div>
            <div className="text-xs text-muted-foreground">Check-in and shift records</div>
          </div>
        </Card>

        <Card
          className="p-4 flex items-center gap-3 hover:bg-muted/40 cursor-pointer transition-colors"
          onClick={() => navigate(RouteDict.Payroll.Base)}
        >
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">My Payslips</div>
            <div className="text-xs text-muted-foreground">Salary slips & tax breakdown</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboardView;
